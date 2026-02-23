# Edit-Funktionalität Testen

## Status: ✅ Implementiert und deployed

Die Edit-Funktionalität ist vollständig implementiert:
- ✅ Backend: `updateGame` Lambda-Funktion deployed
- ✅ Frontend: Edit-Button (✍️) in jeder Tabellenzeile
- ✅ API: `api.updateGame()` Funktion
- ✅ UI: Formular wechselt in Edit-Modus

## Test-Schritte:

### 1. Öffne die App
- URL: http://localhost:3010
- Dev-Server läuft auf Port 3010

### 2. Erstelle ein paar Test-Spiele
- Starte einen neuen Spieltag (falls noch nicht vorhanden)
- Erfasse 2-3 normale Re/Kontra Spiele
- Die Spiele erscheinen in der Tabelle

### 3. Teste Edit-Funktion
1. **Klicke auf ✍️-Button** in einer Tabellenzeile
   - Formular lädt die Spieldaten
   - Button ändert sich zu "Änderungen speichern" (gelb)
   - "Abbrechen"-Button erscheint

2. **Ändere Werte:**
   - Ändere den Spielwert (z.B. von 2 auf 3)
   - Ändere Re-Spieler (andere 2 Spieler auswählen)
   - Ändere Geber (anderer Spieler)

3. **Speichere Änderungen:**
   - Klicke "Änderungen speichern"
   - Spiel wird in DynamoDB aktualisiert
   - Tabelle wird neu geladen
   - Formular kehrt in Normal-Modus zurück

4. **Teste Abbrechen:**
   - Klicke erneut auf ✍️
   - Klicke "Abbrechen"
   - Formular kehrt in Normal-Modus zurück (ohne Speichern)

### 4. Erwartetes Verhalten

**Im Edit-Modus:**
- ✅ Geber rotiert NICHT nach dem Speichern
- ✅ Bock-State wird NICHT aktualisiert
- ✅ Nur die Spieldaten werden geändert
- ✅ gameNumber bleibt gleich

**Im Normal-Modus (neues Spiel):**
- ✅ Geber rotiert nach dem Speichern
- ✅ Bock-State wird aktualisiert (falls Bock aktiv)
- ✅ Neues Spiel mit neuer gameNumber

### 5. Bekannte Einschränkungen
- Hochzeit-Spiele können bearbeitet werden, aber die Suche-Zeile wird nicht automatisch neu berechnet
- Bei Hochzeit-Spielen sollte man vorsichtig sein (beide Zeilen haben gleiche gameNumber)

## Technische Details

### Backend (deployed)
- Route: `PUT /spieltage/{spieltagId}/games/{gameId}`
- Lambda: `UpdateGameFunction`
- Permissions: DynamoDBCrudPolicy

### Frontend
- `startEditGame(game)` - Lädt Spiel in Formular
- `cancelEdit()` - Bricht Edit ab
- `handleSubmit()` - Unterscheidet CREATE vs UPDATE
- `editingGameId` State - Tracking des Edit-Modus

### API
```typescript
api.updateGame(spieltagId, gameId, gameData)
```

## Commit
```
794bb96 - Feature: Spiele bearbeiten - Edit-Button (✍️) in Tabelle, Update-Funktion im Backend
```
