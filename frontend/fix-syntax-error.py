#!/usr/bin/env python3

with open('app/page.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip_next = False

for i, line in enumerate(lines):
    # Skip duplicate label/input lines around line 448-450
    if i >= 447 and i <= 450:
        if 'type="checkbox"' in line and i == 448:
            # Skip this orphaned checkbox line
            continue
        if '<label style' in line and i == 449:
            # Skip duplicate label
            continue
    
    new_lines.append(line)

with open('app/page.tsx', 'w') as f:
    f.writelines(new_lines)

print("✓ Syntax error fixed")
