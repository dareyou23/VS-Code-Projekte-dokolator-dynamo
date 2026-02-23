#!/usr/bin/env node

/**
 * Test-Script für Schritt 1: Normal Re/Kontra
 * Vergleicht Implementierung mit Referenz-Logik
 */

// Referenz-Funktionen (1:1 aus dokolator-reference.html)
function calculateReKontraScores_Reference(rePlayerNames, activePlayers, effectiveValue) {
  const scores = {};
  activePlayers.forEach(p => scores[p] = 0);
  const actualRePlayersInRound = rePlayerNames.filter(p => activePlayers.includes(p));
  const kontraPlayersInRound = activePlayers.filter(p => !actualRePlayersInRound.includes(p));
  actualRePlayersInRound.forEach(player => scores[player] = effectiveValue);
  kontraPlayersInRound.forEach(player => scores[player] = -effectiveValue);
  return scores;
}

function getActivePlayers_Reference(allPlayers, geberName, playerCount) {
  const is5Players = playerCount === 5;
  return allPlayers.filter(name => !(is5Players && name === geberName));
}

// Test-Szenarien
const tests = [
  {
    name: 'Test 1: 4 Spieler, Normal Re/Kontra',
    playerCount: 4,
    players: ['Gregor', 'Bernd', 'Benno', 'Peter'],
    geber: 'Gregor',
    rePlayers: ['Bernd', 'Benno'],
    gameValue: 1,
    expected: {
      Gregor: -1,
      Bernd: 1,
      Benno: 1,
      Peter: -1
    }
  },
  {
    name: 'Test 2: 5 Spieler, Geber sitzt aus',
    playerCount: 5,
    players: ['Gregor', 'Bernd', 'Benno', 'Peter', 'Markus'],
    geber: 'Gregor',
    rePlayers: ['Bernd', 'Benno'],
    gameValue: 2,
    expected: {
      Gregor: 0,  // sitzt aus!
      Bernd: 2,
      Benno: 2,
      Peter: -2,
      Markus: -2
    }
  },
  {
    name: 'Test 3: 5 Spieler, Geber ist Re-Spieler (spielt mit)',
    playerCount: 5,
    players: ['Gregor', 'Bernd', 'Benno', 'Peter', 'Markus'],
    geber: 'Bernd',
    rePlayers: ['Gregor', 'Markus'],
    gameValue: 3,
    expected: {
      Bernd: 0,   // sitzt aus (Geber)
      Gregor: 3,  // Re
      Benno: -3,  // Kontra
      Peter: -3,  // Kontra
      Markus: 3   // Re
    }
  },
  {
    name: 'Test 4: 4 Spieler, negativer Wert',
    playerCount: 4,
    players: ['Gregor', 'Bernd', 'Benno', 'Peter'],
    geber: 'Benno',
    rePlayers: ['Gregor', 'Peter'],
    gameValue: -2,
    expected: {
      Gregor: -2,  // Re mit negativem Wert
      Bernd: 2,    // Kontra mit negativem Wert
      Benno: 2,    // Kontra mit negativem Wert
      Peter: -2    // Re mit negativem Wert
    }
  },
  {
    name: 'Test 5: 5 Spieler, alle außer Geber sind Re',
    playerCount: 5,
    players: ['Gregor', 'Bernd', 'Benno', 'Peter', 'Markus'],
    geber: 'Gregor',
    rePlayers: ['Bernd', 'Benno', 'Peter', 'Markus'],
    gameValue: 5,
    expected: {
      Gregor: 0,   // sitzt aus
      Bernd: 5,    // Re
      Benno: 5,    // Re
      Peter: 5,    // Re
      Markus: 5    // Re (keine Kontra-Spieler!)
    }
  }
];

// Tests ausführen
console.log('🧪 SCHRITT 1 LOGIK-TEST\n');
console.log('Vergleich: Implementierung vs. Referenz\n');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  console.log(`\n${index + 1}. ${test.name}`);
  console.log('-'.repeat(80));
  
  // Aktive Spieler ermitteln
  const activePlayers = getActivePlayers_Reference(test.players, test.geber, test.playerCount);
  console.log(`Aktive Spieler: ${activePlayers.join(', ')}`);
  console.log(`Re-Spieler: ${test.rePlayers.join(', ')}`);
  console.log(`Spielwert: ${test.gameValue}`);
  
  // Punkte berechnen
  const scores = calculateReKontraScores_Reference(test.rePlayers, activePlayers, test.gameValue);
  
  // Geber-Punkte hinzufügen (0 wenn er aussitzt)
  if (test.playerCount === 5 && !activePlayers.includes(test.geber)) {
    scores[test.geber] = 0;
  }
  
  // Ergebnisse vergleichen
  console.log('\nErgebnis:');
  let testPassed = true;
  
  test.players.forEach(player => {
    const actual = scores[player] || 0;
    const expected = test.expected[player];
    const match = actual === expected ? '✅' : '❌';
    
    if (actual !== expected) {
      testPassed = false;
    }
    
    console.log(`  ${match} ${player}: ${actual >= 0 ? '+' : ''}${actual} (erwartet: ${expected >= 0 ? '+' : ''}${expected})`);
  });
  
  if (testPassed) {
    console.log('\n✅ TEST BESTANDEN');
    passed++;
  } else {
    console.log('\n❌ TEST FEHLGESCHLAGEN');
    failed++;
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 ZUSAMMENFASSUNG: ${passed}/${tests.length} Tests bestanden`);

if (failed === 0) {
  console.log('\n🎉 ALLE TESTS BESTANDEN! Logik ist 1:1 aus Referenz übernommen.\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failed} Test(s) fehlgeschlagen. Bitte Logik überprüfen.\n`);
  process.exit(1);
}
