#!/usr/bin/env python3

with open('app/page.tsx', 'r') as f:
    content = f.read()

# 1. Update subtitle
content = content.replace(
    'Normal Re/Kontra + Solo - Kein Bock, Keine Hochzeit',
    'Normal Re/Kontra + Solo + Hochzeit - Kein Bock'
)

# 2. Add Hochzeit checkbox after Re checkbox, before Solo checkbox
# Find the Re checkbox closing tag and insert Hochzeit after it
re_checkbox_end = '''                          Re
                        </label>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                          <input
                            type="checkbox"
                            checked={playerRoles[i] === 'solo' || playerRoles[i] === 'geber+solo'}'''

hochzeit_checkbox = '''                          Re
                        </label>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                          <input
                            type="checkbox"
                            checked={playerRoles[i] === 'hochzeit' || playerRoles[i] === 'geber+hochzeit'}
                            disabled={playerCount === 5 && (playerRoles[i] === 'geber' || playerRoles[i] === 'geber+hochzeit')}
                            onChange={(e) => {
                              const newRoles = [...playerRoles];
                              const currentRole = playerRoles[i];
                              
                              if (e.target.checked) {
                                if (currentRole === 'geber') {
                                  newRoles[i] = 'geber+hochzeit';
                                } else {
                                  newRoles[i] = 'hochzeit';
                                }
                              } else {
                                if (currentRole === 'geber+hochzeit') {
                                  newRoles[i] = 'geber';
                                } else {
                                  newRoles[i] = '';
                                }
                              }
                              
                              setPlayerRoles(newRoles);
                            }}
                            style={{ marginRight: '5px' }}
                          />
                          Hochzeit
                        </label>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                          <input
                            type="checkbox"
                            checked={playerRoles[i] === 'solo' || playerRoles[i] === 'geber+solo'}'''

content = content.replace(re_checkbox_end, hochzeit_checkbox)

# 3. Update Geber checkbox to include geber+hochzeit
content = content.replace(
    "checked={playerRoles[i] === 'geber' || playerRoles[i] === 'geber+re' || playerRoles[i] === 'geber+solo'}",
    "checked={playerRoles[i] === 'geber' || playerRoles[i] === 'geber+re' || playerRoles[i] === 'geber+hochzeit' || playerRoles[i] === 'geber+solo'}"
)

# 4. Update Geber onChange logic
old_geber_logic = '''                            onChange={() => {
                              const newRoles = [...playerRoles];
                              const currentRole = playerRoles[i];
                              if (currentRole === 're') {
                                newRoles[i] = 'geber+re';
                              } else if (currentRole === 'solo') {
                                newRoles[i] = 'geber+solo';
                              } else {
                                newRoles[i] = 'geber';
                              }
                              setPlayerRoles(newRoles);
                            }}'''

new_geber_logic = '''                            onChange={() => {
                              const newRoles = [...playerRoles];
                              const currentRole = playerRoles[i];
                              if (currentRole === 're') {
                                newRoles[i] = 'geber+re';
                              } else if (currentRole === 'hochzeit') {
                                newRoles[i] = 'geber+hochzeit';
                              } else if (currentRole === 'solo') {
                                newRoles[i] = 'geber+solo';
                              } else {
                                newRoles[i] = 'geber';
                              }
                              setPlayerRoles(newRoles);
                            }}'''

content = content.replace(old_geber_logic, new_geber_logic)

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("✓ Hochzeit checkbox added cleanly")
print("✓ Hochzeit+Geber disabled at 5 players")
print("✓ Subtitle updated")
print("✓ Geber logic updated")
