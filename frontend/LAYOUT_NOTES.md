# Layout-Änderungen basierend auf Referenz-HTML

## Hauptunterschiede zur aktuellen Version:

### Referenz-HTML (S3):
1. **Spieler-Eingabe**: Spalten mit Radio-Buttons für Rollen
   - Geber, Re, Hochzeit, Solo (4 Optionen)
   - Keine Drag & Drop
   - Einfache Radio-Button-Auswahl

2. **Spielwert**: Radio-Buttons für häufige Werte + Custom Input
   - Vordefinierte Werte: 8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8
   - Custom-Eingabe möglich

3. **Bockrunde**: Einfache Checkbox

4. **Ausgabe**: 
   - Tabelle mit Spielverlauf
   - Separate Abrechnung-Tabelle
   - Chart auf separatem Tab

### Aktuelle Next.js Version:
- ❌ Drag & Drop für Rollen (zu komplex)
- ❌ Dropdown für Spielwert
- ❌ Alles auf einer Seite

### Zu implementieren:
- ✅ Radio-Buttons für Rollen (wie Referenz)
- ✅ Radio-Buttons für Spielwert (wie Referenz)
- ✅ Tabellen-Layout (wie Referenz)
- ✅ Chart auf separatem Tab (/chart)
- ✅ DB-Anbindung (Echtzeit-Speicherung)
