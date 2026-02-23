# 🚀 DEV-SERVER GESTARTET

## Server-Info

**URL:** http://localhost:3002  
**Status:** ✅ Running  
**Port:** 3002 (Port 3000 war belegt)

## Nächste Schritte

1. **Browser öffnen:** http://localhost:3002

2. **Test-Szenarien durchführen** (siehe READY_FOR_MANUAL_TEST.md)

## Quick-Test Anleitung

### Test 1: Spieltag erstellen
1. Klick auf "Neuen Spieltag starten"
2. Prüfe: Standard-Spieler werden angezeigt (Gregor, Bernd, Benno, Peter, Markus)
3. Prüfe: Gregor ist als Geber vorausgewählt

### Test 2: Erstes Spiel (4 Spieler)
**Setup:**
- Anzahl: 4 Spieler auswählen
- Gregor (Geber), Bernd (Re), Benno (Re), Peter (bleibt leer = Kontra)
- Spielwert: 1

**Erwartung:**
- Gregor: -1
- Bernd: +1
- Benno: +1
- Peter: -1

**Prüfen:**
- Tabelle wird angezeigt
- Punkte stimmen
- Nächster Geber ist Bernd

### Test 3: Zweites Spiel (5 Spieler)
**Setup:**
- Anzahl: 5 Spieler auswählen
- Bernd (Geber), Benno (Re), Peter (Re), Gregor + Markus (Kontra)
- Spielwert: 2

**Erwartung:**
- Bernd: 0 (sitzt aus!)
- Gregor: +2 (war -1, jetzt +1)
- Benno: +3 (war +1, jetzt +3)
- Peter: +1 (war -1, jetzt +1)
- Markus: -2

**Wichtig:** Bernd muss 0 Punkte bekommen (Geber sitzt bei 5 Spielern aus)!

## Server stoppen

```bash
# Im Terminal:
Ctrl+C

# Oder über Kiro:
controlBashProcess mit action="stop" und processId=14
```

## Automatische Tests (bereits bestanden)

✅ Logik-Tests: 5/5 bestanden  
✅ Geber-Rotation: korrekt  
✅ Build: erfolgreich

## Status

- [x] Dev-Server gestartet
- [ ] Manueller Test im Browser
- [ ] Alle Szenarien getestet
- [ ] Schritt 1 komplett abgeschlossen

