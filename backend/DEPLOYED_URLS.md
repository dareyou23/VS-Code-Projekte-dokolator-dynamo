# Deployed Function URLs

**Stack:** DokolatorStack  
**Region:** eu-central-1  
**Deployment:** 19.02.2026

---

## 🔐 Authentifizierung

### Sign Up
```
POST https://67behv4cgdclyfhnob34ubxu2q0hrmwr.lambda-url.eu-central-1.on.aws/
```

### Confirm Sign Up
```
POST https://vz6yf736xs2nyx6edmtaz7izdm0lvgqd.lambda-url.eu-central-1.on.aws/
```

### Sign In
```
POST https://ynhmsy5o3y64pgokmrznxfmcsa0llihm.lambda-url.eu-central-1.on.aws/
```

---

## 📅 Spieltage

### Spieltag erstellen
```
POST https://mue4v56c5ygusg4ncjxulxr3xa0ttfga.lambda-url.eu-central-1.on.aws/
Header: x-user-id: <userId>
```

### Alle Spieltage
```
GET https://55ixevhezmyelovmw7ipp4wkm40csucj.lambda-url.eu-central-1.on.aws/
Header: x-user-id: <userId>
```

### Einzelner Spieltag
```
GET https://3yq53zuwr2kl2morcheptcewjq0wblkj.lambda-url.eu-central-1.on.aws/<spieltagId>
Header: x-user-id: <userId>
```

### Spieltag abschließen
```
PUT https://tds4sbmrdnlcagfz6v7nova6ty0fdebd.lambda-url.eu-central-1.on.aws/<spieltagId>/complete
Header: x-user-id: <userId>
```

---

## 🎮 Spiele

### Spiel hinzufügen
```
POST https://iigobky3oqe3uhz5r6x6xtjnte0puiiv.lambda-url.eu-central-1.on.aws/<spieltagId>/games
Header: x-user-id: <userId>

Body (EXAKT wie Frontend!):
{
  "gameValue": 1,
  "bockTrigger": false,
  "players": {
    "Alice": { "roles": ["Re"], "points": 1 },
    "Bob": { "roles": ["Kontra"], "points": -1 }
  }
}
```

### Alle Spiele eines Spieltags
```
GET https://5pg7tu2m4iwobyylomwjvaclxe0frewd.lambda-url.eu-central-1.on.aws/<spieltagId>/games
Header: x-user-id: <userId>
```

---

## 📊 Statistiken

### Gesamt-Statistiken
```
GET https://u76ercwisscoz2jkeibbxsuuii0evqgk.lambda-url.eu-central-1.on.aws/
Header: x-user-id: <userId>
```

### Spieltag-Statistiken (Abrechnung)
```
GET https://6stulz4a2bzoyovhahtveo5gdm0fddam.lambda-url.eu-central-1.on.aws/<spieltagId>/stats
Header: x-user-id: <userId>
```

---

## 🗄️ DynamoDB

**Tabelle:** DokolatorGames  
**Billing:** Provisioned (1 RCU/WCU)  
**Kosten:** ~$0.65/Monat

---

## 🧪 Testen

```bash
# Test-Script ausführen
./test-api.sh
```

Oder manuell mit curl:

```bash
# Spieltag erstellen
curl -X POST https://mue4v56c5ygusg4ncjxulxr3xa0ttfga.lambda-url.eu-central-1.on.aws/ \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123" \
  -d '{
    "date": "2026-02-19T18:00:00.000Z",
    "startgeld": 10.00,
    "punktwert": 0.05,
    "playerNames": ["Alice", "Bob", "Charlie", "David"]
  }'

# Spiel hinzufügen (EXAKT Frontend-Format!)
curl -X POST https://iigobky3oqe3uhz5r6x6xtjnte0puiiv.lambda-url.eu-central-1.on.aws/<SPIELTAG_ID>/games \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123" \
  -d '{
    "gameValue": 1,
    "bockTrigger": false,
    "players": {
      "Alice": { "roles": ["Re"], "points": 1 },
      "Bob": { "roles": ["Re"], "points": 1 },
      "Charlie": { "roles": ["Kontra"], "points": -1 },
      "David": { "roles": ["Kontra"], "points": -1 }
    }
  }'
```

---

## ✅ Status

- ✅ Backend deployed
- ✅ Datenmodell EXAKT wie Frontend
- ✅ Alle 11 Lambda Functions aktiv
- ✅ DynamoDB Tabelle erstellt
- ✅ Cognito User Pool konfiguriert
- ⏳ Frontend-App (nächster Schritt)

---

**Cognito:**
- User Pool ID: `eu-central-1_lAb3MxE5t`
- Client ID: `6qqiugc6pdlqgrvdbs2f9iaa86`
