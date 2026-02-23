# Test Plan - Vergleich mit Referenz

## Testfälle (nach Implementierung)

### 1. Normal Re/Kontra (4 Spieler)
**Setup:**
- Gregor: Geber (0 Punkte)
- Bernd: Re (+1)
- Benno: Re (+1)
- Peter: Kontra (-1)
- Markus: Kontra (-1)
- Spielwert: 1

**Erwartete Punkte:**
- Gregor: 0
- Bernd: +1
- Benno: +1
- Peter: -1
- Markus: -1

### 2. Solo (4 Spieler)
**Setup:**
- Gregor: Geber (0)
- Bernd: Solo
- Benno, Peter, Markus: Kontra
- Spielwert: 2

**Erwartete Punkte:**
- Gregor: 0
- Bernd: +2 × 3 = +6
- Benno: -2
- Peter: -2
- Markus: -2

### 3. Hochzeit MIT Partner (5 Spieler)
**Setup:**
- Gregor: Geber (sitzt aus)
- Bernd: Hochzeit
- Benno: Re (Partner)
- Peter, Markus: Kontra
- Spielwert: 3

**Erwartete Zeilen:**
Zeile 1 (Phase 1 - Suche, Wert 1):
- Bernd: +1 × 3 = +3
- Benno: -1
- Peter: -1
- Markus: -1

Zeile 2 (Phase 2 - mit Partner, Wert 3):
- Bernd: +3
- Benno: +3
- Peter: -3
- Markus: -3

**Gesamt:**
- Bernd: +6
- Benno: +2
- Peter: -4
- Markus: -4

### 4. Hochzeit OHNE Partner (4 Spieler)
**Setup:**
- Gregor: Geber (0)
- Bernd: Hochzeit
- Benno, Peter, Markus: Kontra
- Spielwert: 2

**Erwartete Zeilen:**
Zeile 1 (Phase 1 - Suche, Wert 1):
- Bernd: +1 × 3 = +3
- Benno: -1
- Peter: -1
- Markus: -1

Zeile 2 (Phase 2 - Solo, Wert 2):
- Bernd: +2 × 3 = +6
- Benno: -2
- Peter: -2
- Markus: -2

**Gesamt:**
- Bernd: +9
- Benno: -3
- Peter: -3
- Markus: -3

### 5. Bockrunde (4 Spieler)
**Setup:**
- Spiel 1: Normal, Wert 1, Bock-Trigger aktiviert
- Spiel 2: Normal, Wert 1 (sollte × 2 = 2 sein)

**Erwartete Bock-State:**
Nach Spiel 1:
- bockActive: 4 (4 aktive Spieler)
- bockPlayedInStreak: 0
- bockTotalInStreak: 4

Nach Spiel 2:
- bockActive: 3
- bockPlayedInStreak: 1
- bockTotalInStreak: 4
- Punkte verdoppelt!

### 6. Geber-Rotation
**Setup:**
- Spiel 1: Gregor Geber
- Spiel 2: Bernd sollte Geber sein
- Spiel 3: Benno sollte Geber sein

---

## Vergleichsmethode

1. Referenz-HTML öffnen
2. Gleiche Szenarien eingeben
3. Punkte vergleichen
4. Bock-Zähler vergleichen
5. Tabellen-Anzeige vergleichen

## Kritische Punkte

- [ ] Hochzeit erzeugt 2 Zeilen mit GLEICHER Spielnummer
- [ ] Bockrunden verdoppeln Punkte (× 2)
- [ ] Solo = Wert × Anzahl Gegner (nicht fest × 3)
- [ ] Bei 5 Spielern sitzt Geber aus
- [ ] Kumulative Punkte korrekt
- [ ] Geber rotiert nach jedem Spiel
