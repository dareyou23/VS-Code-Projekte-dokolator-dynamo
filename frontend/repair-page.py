#!/usr/bin/env python3

with open('app/page.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # Skip lines 447-450 which are duplicates/broken
    if i >= 446 and i <= 449:
        # Check if this is the broken section
        if i == 447 and 'type="checkbox"' in line and '<input' not in line:
            # Skip orphaned checkbox line
            i += 1
            continue
        if i == 448 and '<label style' in line:
            # This is the start of Hochzeit checkbox - keep it
            pass
    
    new_lines.append(line)
    i += 1

with open('app/page.tsx', 'w') as f:
    f.writelines(new_lines)

print(f"✓ Repaired page.tsx ({len(new_lines)} lines)")
