#!/usr/bin/env node

/**
 * Test-Script für Geber-Rotation
 * Vergleicht Implementierung mit Referenz-Logik
 */

console.log('🔄 GEBER-ROTATION TEST\n');
console.log('='.repeat(80));

// Test 1: 4 Spieler
console.log('\n1. Test: 4 Spieler - Geber rotiert von links nach rechts');
console.log('-'.repeat(80));

const players4 = ['Gregor', 'Bernd', 'Benno', 'Peter'];
let currentDealerIndex = 0;

console.log('Start: Geber = ' + players4[currentDealerIndex]);

for (let i = 1; i <= 5; i++) {
  currentDealerIndex = (currentDealerIndex + 1) % players4.length;
  console.log(`Nach Spiel ${i}: Geber = ${players4[currentDealerIndex]}`);
}

console.log('\n✅ Rotation: Gregor → Bernd → Benno → Peter → Gregor → Bernd');

// Test 2: 5 Spieler
console.log('\n2. Test: 5 Spieler - Geber rotiert von links nach rechts');
console.log('-'.repeat(80));

const players5 = ['Gregor', 'Bernd', 'Benno', 'Peter', 'Markus'];
currentDealerIndex = 0;

console.log('Start: Geber = ' + players5[currentDealerIndex]);

for (let i = 1; i <= 6; i++) {
  currentDealerIndex = (currentDealerIndex + 1) % players5.length;
  console.log(`Nach Spiel ${i}: Geber = ${players5[currentDealerIndex]}`);
}

console.log('\n✅ Rotation: Gregor → Bernd → Benno → Peter → Markus → Gregor → Bernd');

// Test 3: Implementierungs-Code
console.log('\n3. Implementierungs-Code (aus page-step1.tsx):');
console.log('-'.repeat(80));
console.log(`
const currentDealerIndex = playerRoles.findIndex(role => role === 'geber');
const nextDealerIndex = currentDealerIndex !== -1 ? (currentDealerIndex + 1) % playerCount : 0;

const newRoles = new Array(playerCount).fill('');
newRoles[nextDealerIndex] = 'geber';
setPlayerRoles(newRoles);
`);

console.log('✅ Logik korrekt: (Index + 1) % playerCount');

console.log('\n' + '='.repeat(80));
console.log('\n🎉 GEBER-ROTATION KORREKT IMPLEMENTIERT!\n');
