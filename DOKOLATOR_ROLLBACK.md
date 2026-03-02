# Dokolator Rollback - 2026-03-03

## Was passiert ist:

1. **Ursprüngliches Problem**: Passwort-Änderung funktionierte nicht
   - `/auth/change-password` hatte keinen JWT-Authorizer
   - User konnte Passwort nicht ändern

2. **Fehlerhafter Fix**: JWT-Authorizer zu ALLEN Endpoints hinzugefügt
   - Alle Spieltag-Endpoints bekamen Authorizer
   - GET `/spieltage` wurde geschützt
   - **Problem**: App braucht Spieltage-Liste OHNE Login beim Laden der Startseite

3. **Resultat**: App komplett kaputt
   - 403 Forbidden auf localhost UND Vercel
   - Keine Spieltage ladbar
   - CORS-Fehler auf Vercel (Nebeneffekt)

## Rollback durchgeführt:

- Git Reset auf Commit `0c7c059` (vor Authorizer-Änderungen)
- Backend neu deployed
- GitHub force-pushed

## Aktueller Stand:

- ✅ App funktioniert wieder auf localhost:3000
- ✅ Backend deployed ohne Authorizer auf allen Endpoints
- ⚠️ Passwort-Änderung funktioniert NICHT (ursprüngliches Problem besteht)

## Lösung für nächste Session:

**NUR diese Endpoints brauchen Authorizer:**
- `/auth/change-password` (POST)
- `/auth/admin-reset-password` (POST)

**Diese Endpoints NICHT schützen:**
- `/spieltage` (GET) - wird beim Laden der Startseite gebraucht
- Alle anderen Endpoints - funktionieren bereits

## Wichtige Erkenntnis:

Die App hat ein **öffentliches** Frontend-Design:
- Startseite lädt Spieltage OHNE Login
- Nur Aktionen (Erstellen, Ändern) brauchen Auth
- Nicht alle Endpoints dürfen geschützt werden

## Test-User:

- admin@test.de / admin123
- traudichbox@googlemail.com / Traudich23!
- markus@test.de / markus123

## Nächste Schritte:

1. NUR `/auth/change-password` mit Authorizer versehen
2. Auf localhost testen
3. Dann erst deployen
