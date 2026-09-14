#!/bin/zsh
set -e
cd "${0:A:h}"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
if ! command -v node >/dev/null; then
  echo "Install Node.js LTS, then open this shortcut again."
  read "?Press Return to close."
  exit 1
fi
if [[ ! -d node_modules ]]; then npm ci; fi
npm run iphone
