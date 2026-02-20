# Authentifizierung mit Telefonnummer

## Ablauf

### 1. Registrierung (Sign Up)
```bash
curl -X POST <SIGN_UP_URL> \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+491234567890",
    "password": "MeinPasswort123"
  }'
```

**Response:**
```json
{
  "message": "Verification code sent to your phone",
  "userSub": "xxx-xxx-xxx"
}
```

Du erhältst eine SMS mit einem 6-stelligen Code.

### 2. Bestätigung (Confirm Sign Up)
```bash
curl -X POST <CONFIRM_SIGN_UP_URL> \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+491234567890",
    "code": "123456"
  }'
```

**Response:**
```json
{
  "message": "Phone number verified successfully"
}
```

### 3. Login (Sign In)
```bash
curl -X POST <SIGN_IN_URL> \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+491234567890",
    "password": "MeinPasswort123"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJraWQiOiJ...",
  "idToken": "eyJraWQiOiJ...",
  "refreshToken": "eyJjdHkiOiJ...",
  "expiresIn": 3600
}
```

### 4. API-Aufrufe mit Token
```bash
curl -X POST <CREATE_GAME_URL> \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "players": [...],
    "rounds": [...],
    "finalScores": {...}
  }'
```

## Telefonnummer-Format

Telefonnummern müssen im internationalen Format angegeben werden:
- Deutschland: `+491234567890`
- Österreich: `+431234567890`
- Schweiz: `+411234567890`

## Token-Gültigkeit

- **Access Token**: 1 Stunde
- **Refresh Token**: 30 Tage

Wenn der Access Token abläuft, kannst du den Refresh Token verwenden, um einen neuen zu erhalten.

## Kosten

- **Erste 50 SMS/Monat**: KOSTENLOS
- **Danach**: ~$0.0055 pro SMS
- **Cognito User Pool**: Erste 50.000 MAUs kostenlos

Für eine private Doppelkopf-Gruppe mit 4-10 Spielern: **~$0.65/Monat** (nur DynamoDB)
