#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
echo "My Vibe → EAS production iOS build + TestFlight submit"
echo "You'll sign in / pick Apple team if Expo asks (one-time)."
echo
npx eas-cli@latest build --platform ios --profile production --auto-submit
echo
echo "When EAS finishes, install from TestFlight on your iPhone."
read -n 1 -s -r -p "Press any key to close…"
