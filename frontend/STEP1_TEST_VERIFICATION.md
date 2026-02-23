# Schritt 1 - Test Verifikation

## Ziel
Nur Normal Re/Kontra testen - KEINE Hochzeit, KEIN Bock, KEIN Solo

## Logik-Verifikation (1:1 aus Referenz)

### 1. calculateReKontraScores (gameLogic.ts vs. Referenz)

**Referenz (dokolator-reference.html, Zeile 624-631):**
```javascript
function calculateReKontraScores(rePlayerNames, activePlayers, effectiveValue) {
    const scores = {}; 
    activePlayers.forEach(p => scores[p] = 0);
    const actualRePlayersInRound = rePlayerNames.filter(p => activePlayers.includes(p));
    const kontraPlayersInRound = activePlayers.filter(p => !actualRePlayersInRound.includes(p));
    actualRePlayersInRound.forEach(player => scores[player] = effectiveValue);
    kontraPlayersInRound.forEach(player => scores[player] = -effectiveValue);
    return scores;
}
```

**Implementierung (lib/gameLogic.ts):**
```typescript
export function calculateReKontraScores(
  rePlayerNames: string[],
  activePlayers: string[],
  effectiveValue: number
): Record<string, number> {
  const scores: Record<string, number> = {};
  activePlayers.forEach(p => scores[p] = 0);
  
  const actualRePlayersInRound = rePlayerNames.filter(p => activePlayers.includes(p));
  const kontraPlayersInRound = activePlayers.filter(p => !actualRePlayersInRound.includes(p));
  
  actualRePlayersInRound.forEach(player => scores[player] = effectiveValue);
  kontraPlayersInRound.forEach(player => scores[player] = -effectiveValue);
  
  return scores;
}
```

✅ **IDENTISCH** - Logik 1:1 übernommen

### 2. getActivePlayers (gameLogic.ts vs. Referenz)

**Referenz (dokolator-reference.html, Zeile 838):**
```javascript
const activePlyInThisGame = plyNamesConfThisGame.filter(name => !(is5Ply && name === roles.geber));
```

**Implementierung (lib/gameLogic.ts):**
```typescript
export function getActivePlayers(
  allPlayers: string[],
  geberName: string | null,
  playerCount: number
): string[] {
  const is5Players = playerCount === 5;
  return allPlayers.filter(name => 
    !(is5Players && name === geberName)
  );
}
```

✅ **IDENTISCH** - Bei 5 Spielern sitzt Geber aus

### 3. Geber-Rotation (page-step1.tsx vs. Referenz)

**Referenz:** Nach jedem Spiel rotiert der Geber eine Position nach rechts

**Implementierung (page-step1.tsx, Zeile 189-193):**
```typescript
const currentDealerIndex = playerRoles.findIndex(role => role === 'geber');
const nextDealerIndex = currentDealerIndex !== -1 ? (currentDealerIndex + 1) % playerCount : 0;

const newRoles = new Array(playerCount).fill('');
newRoles[nextDealerIndex] = 'geber';
setPlayerRoles(newRoles);
```

✅ **KORREKT** - Geber rotiert nach rechts (Index + 1) % playerCount

## Test-Szenarien

### Test 1: 4 Spieler, Normal Re/Kontra
**Setup:**
- Spieler: Gregor (Geber), Bernd (Re), Benno (Re), Peter (Kontra)
- Spielwert: 1
- Aktive Spieler: Alle 4 (Geber spielt mit bei 4 Spielern)

**Erwartete Berechnung:**
```
activePlayers = [Gregor, Bernd, Benno, Peter]
rePlayers = [Bernd, Benno]
kontraPlayers = [Gregor, Peter]

scores:
  Bernd: +1
  Benno: +1
  Gregor: -1
  Peter: -1
```

**Nach Spiel:**
- Nächster Geber: Bernd (Index 0 → 1)

### Test 2: 5 Spieler, Normal Re/Kontra
**Setup:**
- Spieler: Gregor (Geber), Bernd (Re), Benno (Re), Peter (Kontra), Markus (Kontra)
- Spielwert: 2
- Aktive Spieler: 4 (Geber sitzt aus!)

**Erwartete Berechnung:**
```
activePlayers = [Bernd, Benno, Peter, Markus]  // Gregor sitzt aus!
rePlayers = [Bernd, Benno]
kontraPlayers = [Peter, Markus]

scores:
  Gregor: 0  (sitzt aus)
  Bernd: +2
  Benno: +2
  Peter: -2
  Markus: -2
```

**Nach Spiel:**
- Nächster Geber: Bernd (Index 0 → 1)

### Test 3: Mehrere Spiele hintereinander
**Spiel 1:**
- Gregor Geber, Bernd+Benno Re, Peter+Markus Kontra, Wert 1
- Ergebnis: Gregor 0, Bernd +1, Benno +1, Peter -1, Markus -1

**Spiel 2:**
- Bernd Geber, Benno+Peter Re, Gregor+Markus Kontra, Wert 2
- Ergebnis kumulativ: Gregor -2, Bernd +1, Benno +3, Peter +1, Markus -3

**Spiel 3:**
- Benno Geber, Gregor+Markus Re, Bernd+Peter Kontra, Wert 1
- Ergebnis kumulativ: Gregor -1, Bernd 0, Benno +3, Peter 0, Markus -2

## Verifikations-Checkliste

- [x] Build erfolgreich (npm run build) ✅
- [x] Logik 1:1 aus Referenz übernommen ✅
- [x] calculateReKontraScores identisch ✅
- [x] getActivePlayers identisch ✅
- [x] 4 Spieler: Alle spielen mit (inkl. Geber) ✅
- [x] 5 Spieler: Geber sitzt aus ✅
- [x] Re-Spieler bekommen +Wert ✅
- [x] Kontra-Spieler bekommen -Wert ✅
- [x] Geber rotiert nach jedem Spiel ✅
- [x] Negative Werte funktionieren ✅
- [x] Alle Tests bestanden (5/5) ✅

## Automatische Tests

### Test 1: Logik-Verifikation
```bash
node test-step1-logic.js
```
**Ergebnis:** ✅ 5/5 Tests bestanden

### Test 2: Geber-Rotation
```bash
node test-geber-rotation.js
```
**Ergebnis:** ✅ Rotation korrekt

## Manuelle Tests (im Browser)

- [ ] Spieltag erstellen funktioniert
- [ ] Spiel erfassen funktioniert
- [ ] Kumulative Punkte werden korrekt angezeigt
- [ ] Tabelle zeigt alle Spiele
- [ ] Gesamt-Zeile stimmt

## Nächste Schritte nach erfolgreichem Test

1. ✅ Schritt 1 abgeschlossen
2. ⏳ Schritt 2: Solo hinzufügen
3. ⏳ Schritt 3: Bockrunden
4. ⏳ Schritt 4: Hochzeit
5. ⏳ Schritt 5: Kombinationen testen
6. ⏳ Schritt 6: Polish

