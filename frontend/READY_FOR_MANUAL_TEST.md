# 🚀 BEREIT FÜR MANUELLEN TEST

## Status: Schritt 1 - Automatische Tests ✅

Datum: 20.02.2026

## Was wurde getestet

### ✅ Automatische Tests (ALLE BESTANDEN)

#### 1. Logik-Verifikation
```bash
node test-step1-logic.js
```
**Ergebnis:** 5/5 Tests bestanden

**Test-Szenarien:**
- ✅ 4 Spieler, Normal Re/Kontra
- ✅ 5 Spieler, Geber sitzt aus
- ✅ 5 Spieler, Geber ist Re-Spieler
- ✅ 4 Spieler, negativer Wert
- ✅ 5 Spieler, alle außer Geber sind Re

#### 2. Geber-Rotation
```bash
node test-geber-rotation.js
```
**Ergebnis:** ✅ Rotation korrekt (links nach rechts)

#### 3. Build
```bash
npm run build
```
**Ergebnis:** ✅ Erfolgreich kompiliert

## Manuelle Tests im Browser

### Vorbereitung

1. **Dev-Server starten:**
   ```bash
   cd dokolator-app
   npm run dev
   ```

2. **Browser öffnen:**
   ```
   http://localhost:3000
   ```

### Test-Szenarien

#### Test 1: Spieltag erstellen
1. Klick auf "Neuen Spieltag starten"
2. ✅ Spieltag wird erstellt
3. ✅ Standard-Spieler werden angezeigt: Gregor, Bernd, Benno, Peter, Markus
4. ✅ Gregor ist als Geber vorausgewählt

#### Test 2: Erstes Spiel (4 Spieler)
**Setup:**
- Anzahl: 4 Spieler
- Spieler: Gregor (Geber), Bernd (Re), Benno (Re), Peter (Kontra)
- Spielwert: 1

**Erwartetes Ergebnis:**
```
Spiel # | Spielwert | Gregor | Bernd | Benno | Peter
--------|-----------|--------|-------|-------|-------
1       | 1         | -1     | +1    | +1    | -1
--------|-----------|--------|-------|-------|-------
GESAMT  |           | -1     | +1    | +1    | -1
```

**Prüfen:**
- ✅ Tabelle wird angezeigt
- ✅ Punkte stimmen
- ✅ Nächster Geber ist Bernd

#### Test 3: Zweites Spiel (5 Spieler)
**Setup:**
- Anzahl: 5 Spieler
- Spieler: Gregor, Bernd (Geber), Benno (Re), Peter (Re), Markus (Kontra)
- Spielwert: 2

**Erwartetes Ergebnis:**
```
Spiel # | Spielwert | Gregor | Bernd | Benno | Peter | Markus
--------|-----------|--------|-------|-------|-------|--------
1       | 1         | -1     | +1    | +1    | -1    | 0
2       | 2         | +2     | +1    | +3    | +1    | -2
--------|-----------|--------|-------|-------|-------|--------
GESAMT  |           | +1     | +1    | +3    | +1    | -2
```

**Wichtig:** Bernd sitzt aus (Geber bei 5 Spielern) → Punkte: 0 für dieses Spiel!

**Prüfen:**
- ✅ Bernd bekommt 0 Punkte (sitzt aus)
- ✅ Gregor, Benno, Peter, Markus spielen
- ✅ Kumulative Punkte stimmen
- ✅ Nächster Geber ist Benno

#### Test 4: Drittes Spiel (negativer Wert)
**Setup:**
- Anzahl: 4 Spieler
- Spieler: Gregor (Re), Bernd, Benno (Geber), Peter (Re)
- Spielwert: -2

**Erwartetes Ergebnis:**
```
Spiel # | Spielwert | Gregor | Bernd | Benno | Peter
--------|-----------|--------|-------|-------|-------
1       | 1         | -1     | +1    | +1    | -1
2       | 2         | +1     | +1    | +3    | +1
3       | -2        | -1     | +3    | +5    | -1
--------|-----------|--------|-------|-------|-------
GESAMT  |           | -1     | +3    | +5    | -1
```

**Prüfen:**
- ✅ Negative Werte funktionieren
- ✅ Re-Spieler bekommen -2 (nicht +2!)
- ✅ Kontra-Spieler bekommen +2 (nicht -2!)
- ✅ Kumulative Punkte stimmen

#### Test 5: Geber-Rotation
**Prüfen nach jedem Spiel:**
- Spiel 1: Gregor Geber → Nach Spiel: Bernd Geber
- Spiel 2: Bernd Geber → Nach Spiel: Benno Geber
- Spiel 3: Benno Geber → Nach Spiel: Peter Geber
- Spiel 4: Peter Geber → Nach Spiel: Markus Geber (bei 5 Spielern)
- Spiel 5: Markus Geber → Nach Spiel: Gregor Geber (Rotation komplett)

✅ Geber rotiert von links nach rechts

### Checkliste

- [ ] Spieltag erstellen funktioniert
- [ ] Spiel erfassen funktioniert
- [ ] 4 Spieler: Alle spielen mit (inkl. Geber)
- [ ] 5 Spieler: Geber sitzt aus (bekommt 0 Punkte)
- [ ] Re-Spieler bekommen +Wert
- [ ] Kontra-Spieler bekommen -Wert
- [ ] Negative Werte funktionieren korrekt
- [ ] Geber rotiert nach jedem Spiel
- [ ] Kumulative Punkte werden korrekt angezeigt
- [ ] Tabelle zeigt alle Spiele
- [ ] Gesamt-Zeile stimmt

## Nach erfolgreichem Test

Wenn alle manuellen Tests bestanden sind:

1. ✅ Schritt 1 ist komplett abgeschlossen
2. ⏳ Weiter mit Schritt 2: Solo hinzufügen

## Bekannte Einschränkungen (Schritt 1)

- ❌ KEIN Solo (kommt in Schritt 2)
- ❌ KEINE Bockrunden (kommt in Schritt 3)
- ❌ KEINE Hochzeit (kommt in Schritt 4)
- ❌ KEINE Edit-Funktion (kommt später)

## Dateien

**Aktuelle Hauptseite:**
- `app/page.tsx` - Schritt 1 Implementation (kopiert von page-step1.tsx)

**Backup:**
- `app/page-old.tsx` - Alte Version (mit Solo/Bock/Hochzeit, aber nicht getestet)
- `app/page-step1.tsx` - Original Schritt 1 Version

**Tests:**
- `test-step1-logic.js` - Automatische Logik-Tests
- `test-geber-rotation.js` - Geber-Rotation Tests

**Dokumentation:**
- `STEP1_COMPLETE.md` - Abschluss-Dokumentation
- `STEP1_TEST_VERIFICATION.md` - Test-Dokumentation
- `READY_FOR_MANUAL_TEST.md` - Diese Datei

## Nächste Schritte

Nach erfolgreichem manuellen Test:

### Schritt 2: Solo
- Solo-Rolle hinzufügen (Radio-Button)
- Solo-Berechnung: `soloPlayer: +value × opponents, others: -value`
- Test mit 4 und 5 Spielern
- Automatische Tests erweitern

### Schritt 3: Bockrunden
- Bock-Trigger Checkbox
- Bock-State (active, playedInStreak, totalInStreak)
- Punkte verdoppeln (× 2)
- Bock-Anzeige in Tabelle

### Schritt 4: Hochzeit
- Hochzeit-Rolle
- 2 Zeilen (GLEICHE Spielnummer!)
- Phase 1: Suche (Wert 1)
- Phase 2: Mit/ohne Partner

## Wichtig

**KEINE Änderungen an der Logik!** Die Logik ist 1:1 aus der Referenz übernommen und wurde automatisch verifiziert. Nur UI-Bugs oder offensichtliche Fehler beheben.

