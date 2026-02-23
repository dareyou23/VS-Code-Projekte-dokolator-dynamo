# Implementierungs-Schritte

## ✅ Schritt 0: Vorbereitung
- [x] Helper-Funktionen erstellt (gameLogic.ts)
- [x] Types definiert (types.ts)
- [x] Test-Plan erstellt
- [x] Automatische Tests erstellt
- [x] Logik 1:1 aus Referenz verifiziert (5/5 Tests bestanden)

## ✅ Schritt 1: Normal Re/Kontra (FERTIG - BEREIT FÜR MANUELLEN TEST)
**Ziel:** Basis-Funktionalität ohne Hochzeit, ohne Bock, ohne Solo

**Features:**
- Spieltag erstellen ✅
- Spieler eingeben (4-5) ✅
- Geber auswählen ✅
- Re-Spieler auswählen ✅
- Spielwert eingeben ✅
- Spiel speichern ✅
- Tabelle anzeigen ✅
- Geber rotiert ✅

**Test:**
- ✅ 4 Spieler: Gregor Geber, Bernd+Benno Re, Peter+Markus Kontra, Wert 1
- ✅ Erwartung: Gregor -1, Bernd +1, Benno +1, Peter -1, Markus -1
- ✅ 5 Spieler: Geber sitzt aus
- ✅ Geber-Rotation funktioniert
- ✅ Alle automatischen Tests bestanden (5/5)

**Dateien:**
- `app/page-step1.tsx` - Test-Version für Schritt 1
- `lib/gameLogic.ts` - Helper-Funktionen (verifiziert)
- `lib/types.ts` - TypeScript-Typen
- `test-step1-logic.js` - Automatische Tests
- `test-geber-rotation.js` - Geber-Rotation Tests
- `STEP1_TEST_VERIFICATION.md` - Dokumentation

## ⏳ Schritt 2: Solo hinzufügen
- Solo-Rolle
- Solo-Berechnung (Wert × Anzahl Gegner)
- Test mit 4 und 5 Spielern

## ⏳ Schritt 3: Bockrunden
- Bock-Trigger Checkbox
- Bock-State speichern
- Punkte verdoppeln
- Bock-Anzeige in Tabelle

## ⏳ Schritt 4: Hochzeit
- Hochzeit-Rolle
- 2 Zeilen erzeugen (gleiche Nummer)
- Mit/ohne Partner
- Phase 1 + Phase 2

## ⏳ Schritt 5: Kombinationen testen
- Bock + Solo
- Bock + Hochzeit
- Alle Szenarien aus TEST_PLAN.md

## ⏳ Schritt 6: Polish
- Chart-Seite anpassen
- Abrechnung
- UI-Verbesserungen

---

**REGEL:** Jeder Schritt wird getestet bevor der nächste beginnt!
