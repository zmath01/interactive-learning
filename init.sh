#!/bin/bash
# init.sh — standard startup + verification path for the interactive-learning harness.
set -e
cd "$(dirname "$0")"

echo "=== Harness Initialization ==="
echo "Working dir: $(pwd)"

echo
echo "=== Verification: node scripts/verify.js ==="
node scripts/verify.js

echo
echo "=== Verification Complete ==="
echo "Next steps:"
echo "1. Read feature_list.json to see current feature state"
echo "2. Pick ONE unfinished feature to work on"
echo "3. Implement only that feature"
echo "4. Re-run ./init.sh before claiming done"
echo
echo "Local preview: python3 -m http.server 8000  (then open http://localhost:8000)"
