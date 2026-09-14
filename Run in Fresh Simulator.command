#!/bin/zsh
set -euo pipefail
cd "${0:A:h}"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
mkdir -p .expo
exec > >(tee .expo/fresh-simulator.log) 2>&1
trap 'echo "Launch stopped. The full output is saved in .expo/fresh-simulator.log."; read "?Press Return to close."' ZERR
xcrun simctl list --json > .expo/simulator-inventory.json
python3 - <<'PY'
import json,subprocess
from pathlib import Path
p=Path('.expo')
data=json.loads((p/'simulator-inventory.json').read_text())
existing=[d for devices in data['devices'].values() for d in devices if d.get('name')=='My Vibe Test' and d.get('isAvailable')]
if existing:
    identifier=existing[0]['udid']
else:
    runtimes=[r for r in data['runtimes'] if r.get('isAvailable') and r.get('identifier','').startswith('com.apple.CoreSimulator.SimRuntime.iOS-')]
    if not runtimes: raise SystemExit('Install an iOS Simulator runtime in Xcode Settings, then retry.')
    runtimes.sort(key=lambda r:tuple(int(n) for n in r['version'].split('.')))
    devices=[d for d in data['devicetypes'] if d['name']=='iPhone 17']
    if not devices: raise SystemExit('iPhone 17 simulator type was not found. Send this log to Codex.')
    identifier=subprocess.check_output(['xcrun','simctl','create','My Vibe Test',devices[0]['identifier'],runtimes[-1]['identifier']],text=True).strip()
(p/'my-vibe-test-simulator.txt').write_text(identifier)
print('Using dedicated My Vibe test simulator:',identifier)
PY
simulator_id=$(cat .expo/my-vibe-test-simulator.txt)
if [[ ! -d node_modules ]]; then npm ci; fi
npm run ios -- --device "$simulator_id"
