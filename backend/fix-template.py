#!/usr/bin/env python3
import re

with open('template.yaml', 'r') as f:
    content = f.read()

# Find all "Type: Api" blocks and add RestApiId if not present
lines = content.split('\n')
result = []
i = 0
while i < len(lines):
    line = lines[i]
    result.append(line)
    
    # Check if this is a "Type: Api" line
    if 'Type: Api' in line and i + 1 < len(lines):
        # Check next line for "Properties:"
        if 'Properties:' in lines[i + 1]:
            result.append(lines[i + 1])  # Add Properties line
            i += 2
            # Check if RestApiId already exists
            if i < len(lines) and 'RestApiId' not in lines[i]:
                # Add RestApiId with proper indentation
                indent = len(lines[i]) - len(lines[i].lstrip())
                result.append(' ' * indent + 'RestApiId: !Ref DokolatorApi')
            continue
    i += 1

with open('template.yaml', 'w') as f:
    f.write('\n'.join(result))

print("Template fixed!")
