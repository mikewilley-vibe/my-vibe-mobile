"""Remove only code-signing-incompatible metadata from this project's build inputs."""
import subprocess
import sys
from pathlib import Path
if sys.platform != 'darwin':
    sys.exit(0)
root = Path(__file__).resolve().parent.parent
for folder in (root / 'node_modules' / 'expo-modules-jsi' / 'apple',):
    if folder.exists():
        for attribute in ('com.apple.FinderInfo', 'com.apple.ResourceFork'):
            subprocess.run(['/usr/bin/xattr', '-dr', attribute, str(folder)], check=True)
print('iOS build preparation: Finder metadata cleared from project build inputs.')
