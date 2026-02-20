# ⚠️ KRITISCHE REGELN - IMMER ZUERST LESEN ⚠️

## UNVERÄNDERLICHE LOGIK

**DIE SPIELLOGIK AUS `Dokolator-Stat-WS` DARF NICHT VERÄNDERT WERDEN!**

### Was ist geschützt:
- ✅ Spielerfassung-Logik
- ✅ Punktewertung-Algorithmen
- ✅ Abrechnungs-Berechnungen
- ✅ Alle mathematischen Formeln

### Grund:
Diese Logik ist **getestet und funktioniert einwandfrei**. Sie muss 1:1 übernommen werden.

### Projektziel:
- Statische Webseite aus `Dokolator-Stat-WS` → Mobile-fähige Web-App
- Persistierung in DynamoDB für Statistiken über mehrere Spieltage
- UI/UX kann modernisiert werden
- Backend-Integration hinzufügen
- **ABER: Kern-Spiellogik bleibt unverändert**

---

## 🎯 STANDARD DOKO-RUNDE

### Die 5 Standard-Spieler:
**Gregor, Bernd, Benno, Peter, Markus**

Diese 5 Spieler sind die Hauptgruppe für die die App primär gebaut ist.

### Andere Spieler = Andere Datenbank
- Sobald andere Namen auftauchen → User spielt mit anderen Freunden
- Dann wird eine separate DB/User-Context verwendet (über Cognito userId)
- **WICHTIG:** Daten müssen NICHT historisiert werden
- Jede Spielrunde ist isoliert
- Keine Cross-User-Statistiken nötig
- Spieltage können gelöscht werden ohne Konsequenzen

### Implikationen für die Architektur:
- ✅ Einfaches Datenmodell ohne komplexe Historisierung
- ✅ User-basierte Isolation über Cognito userId
- ✅ Keine Migrations-Logik für alte Daten nötig
- ✅ Fokus auf aktuelle Spieltage, nicht auf jahrelange Historie

---

**Erstellt:** 19.02.2026
**Aktualisiert:** 19.02.2026
**Priorität:** KRITISCH - Bei jeder Änderung prüfen!
