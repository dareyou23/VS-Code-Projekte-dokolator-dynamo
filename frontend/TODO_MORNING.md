# TODO für morgen - Dokolator Layout-Fix

## Status: Backend fertig ✅, Frontend Layout muss angepasst werden

### Was funktioniert:
- ✅ API Gateway: https://x6qfjkcjzj.execute-api.eu-central-1.amazonaws.com/Prod/
- ✅ DynamoDB mit korrektem Datenmodell
- ✅ Alle Endpoints funktionieren
- ✅ CORS korrekt konfiguriert

### Was noch zu tun ist:

#### 1. Layout wie Referenz-HTML umsetzen
**Aktuell**: Drag & Drop für Rollen (kompliziert)
**Soll**: Radio-Buttons wie in der Referenz

**Änderungen:**
```
Spieler-Spalten:
┌─────────────────┐
│ Spieler 1:      │
│ [Name Input]    │
│                 │
│ Rolle:          │
│ ○ Geber         │
│ ○ Re            │
│ ○ Hochzeit      │
│ ○ Solo          │
└─────────────────┘
```

#### 2. Spielwert-Auswahl
**Aktuell**: Dropdown
**Soll**: Radio-Buttons für häufige Werte + Custom Input

#### 3. Punkteberechnung (WICHTIG!)
**Korrekte Logik aus Referenz:**
- Re: +gameValue
- Solo: +gameValue × 3 (gegen 3 andere bei 4 Spielern)
- Geber: 0 Punkte
- Keine Rolle (Kontra): -gameValue

#### 4. Chart auf separatem Tab
- Hauptseite: Spielerfassung + Tabellen
- /chart: Punkteverlauf-Grafik

### Nächste Schritte:
1. Referenz-HTML genau analysieren (Zeilen 200-400)
2. Layout 1:1 in React/Next.js umsetzen
3. DB-Anbindung beibehalten
4. Testen mit Standard-Spielern: Gregor, Bernd, Benno, Peter, Markus

### Dateien:
- `dokolator-reference.html` - Die funktionierende Referenz aus S3
- `app/page.tsx` - Muss neu geschrieben werden
- `app/chart/page.tsx` - Neu erstellen für Grafik
