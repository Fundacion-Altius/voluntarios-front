#!/usr/bin/env bash
set -euo pipefail

echo "=== Metrics Analysis ==="
echo ""

echo "--- Cyclomatic Complexity (ESLint) ---"
npx eslint src/ --format json 2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
total = 0
for f in data:
    for m in f.get('messages', []):
        if m.get('ruleId') == 'complexity':
            total += 1
            print(f\"  {f['filePath']}:{m['line']} complexity={m['message'].split('Maximum allowed')[0].strip().split()[-1]}\")
print(f\"Total functions exceeding complexity threshold: {total}\")
"

echo ""
echo "--- Test Coverage ---"
npx jest --coverage --coverage-reporters=text-summary 2>&1 | tail -10

echo ""
echo "--- DRY Violations (duplicated lines) ---"
npx eslint src/ --format json 2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
for f in data:
    for m in f.get('messages', []):
        if m.get('ruleId') in ('no-duplicate-imports', 'no-useless-rename'):
            print(f\"  {f['filePath']}:{m['line']} [{m['ruleId']}] {m['message']}\")
"

echo ""
echo "=== Metrics Analysis Complete ==="