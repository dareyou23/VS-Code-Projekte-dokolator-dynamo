# Solo Implementation - Test Guide

## Was wurde implementiert?

Solo-Spiele sind jetzt vollständig implementiert nach der Referenz-Logik.

## Änderungen

1. **UI**: Solo-Checkbox zu jedem Spieler hinzugefügt
2. **Validierung**: 
   - Genau 1 Solo-Spieler erforderlich
   - Keine Re-Spieler bei Solo erlaubt
   - Solo-Spieler muss aktiv sein (nicht Geber bei 5 Spielern)
3. **Berechnung** (EXAKT aus Referenz Zeile 615-622):
   - Solo-Spieler: `wert × anzahlGegner`
   - Gegner: `-wert`
4. **Anzeige**:
   - Solo-Spieler: **S** mit rotem Hintergrund (#ffe6e6)
   - Gegner: **K** mit orangem Hintergrund (#fff0e6)
   - Geber (aussitzend): **G** mit grauem Hintergrund (#f8f9fa)

## Test-Szenarien

### Test 1: Solo bei 5 Spielern
1. Neuen Spieltag starten
2. Geber: Gregor (sitzt aus)
3. Solo: Bernd ✓
4. Spielwert: 2
5. **Erwartung**:
   - Gregor: G (grau) +0
   - Bernd: S (rot) +6 (2 × 3 Gegner)
   - Benno: K (orange) -2
   - Peter: K (orange) -2
   - Markus: K (orange) -2

### Test 2: Solo bei 4 Spielern
1. Geber: Gregor (spielt mit als Gegner)
2. Solo: Bernd ✓
3. Spielwert: 3
4. **Erwartung**:
   - Gregor: K (orange) -3
   - Bernd: S (rot) +9 (3 × 3 Gegner)
   - Benno: K (orange) -3
   - Peter: K (orange) -3

### Test 3: Solo verloren (negativer Wert)
1. Geber: Gregor (sitzt aus bei 5 Spielern)
2. Solo: Bernd ✓
3. Spielwert: -2
4. **Erwartung**:
   - Gregor: G (grau) +0
   - Bernd: S (rot) -6 (-2 × 3 Gegner)
   - Benno: K (orange) +2
   - Peter: K (orange) +2
   - Markus: K (orange) +2

### Test 4: Validierungen
- ❌ 2 Solo-Spieler → Fehler: "Solo: Genau 1 Solo-Spieler."
- ❌ Solo + Re → Fehler: "Solo: Keine Re-Spieler."
- ❌ Solo-Spieler = Geber bei 5 Spielern → Fehler: "Solo-Spieler muss aktiv sein"

## Server

Der Server läuft auf **Port 3010**:
```
http://localhost:3010
```

## Nächste Schritte

Nach erfolgreichem Test:
- ✅ Schritt 1: Normal Re/Kontra (fertig)
- ✅ Schritt 2: Solo (fertig)
- ⏳ Schritt 3: Hochzeit
- ⏳ Schritt 4: Bock-Runden
