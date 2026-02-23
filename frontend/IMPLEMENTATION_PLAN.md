# Implementation Plan - Exakte Referenz-Logik

## Phase 1: Datenstrukturen ✅
- [x] Backend Types erweitert (Hochzeit-Flags, Bock-State)
- [x] Backend deployed

## Phase 2: Frontend Core Logic (JETZT)

### 2.1 State Management
```typescript
// Persistent State (im Spieltag)
const [bockRoundsActive, setBockRoundsActive] = useState(0);
const [bockGamesPlayedInStreak, setBockGamesPlayedInStreak] = useState(0);
const [totalBockGamesInStreak, setTotalBockGamesInStreak] = useState(0);

// Game State
const [allGamesData, setAllGamesData] = useState([]);
```

### 2.2 Helper Functions (aus Referenz kopieren)
- `calculateSoloScores(soloPlayer, activePlayers, effectiveValue)`
- `calculateReKontraScores(rePlayers, activePlayers, effectiveValue)`
- `getActivePlayers(allPlayers, geberName, playerCount)`

### 2.3 handleSubmit Logic
1. Spieltyp erkennen (normal/solo/hochzeit)
2. Aktive Spieler ermitteln
3. Bock-Status prüfen (effectiveValue = gameValue × 2?)
4. Punkte berechnen
5. Bei Hochzeit: 2 Zeilen erstellen (gleiche gameNumber!)
6. Bock-State aktualisieren
7. Zur DB speichern

### 2.4 Display Logic
- Tabelle mit gameNumber (bei Hochzeit 2 Zeilen, gleiche Nummer)
- Spielwert-Spalte: "1 (H Suche)", "5 (H m.P.)", "3", etc.
- Bock-Spalte: "2/4" oder "-"
- Kumulative Punkte pro Spieler

## Phase 3: Testing
- [ ] Normal Re/Kontra
- [ ] Solo
- [ ] Hochzeit mit Partner
- [ ] Hochzeit ohne Partner
- [ ] Bockrunden
- [ ] Bock + Hochzeit
- [ ] 4 Spieler
- [ ] 5 Spieler (Geber sitzt aus)

## Phase 4: Later (nicht jetzt!)
- [ ] Spiele editieren
- [ ] Spiele löschen
- [ ] Statistiken erweitern

---

**REGEL:** Keine Vereinfachungen! 1:1 Kopie der Referenz-Logik!
