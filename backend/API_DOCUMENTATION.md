# Dokolator API Dokumentation

**Version:** 2.0  
**Datum:** 19.02.2026  
**Datenmodell:** Exakt abgestimmt auf Frontend (Dokolator-Stat-WS)

---

## 🎯 Datenmodell

### Spieltag
```typescript
{
  spieltagId: string;           // "spieltag-1234567890-abc123"
  userId: string;                // Cognito User ID
  date: string;                  // ISO-String "2026-02-19T10:00:00.000Z"
  startgeld: number;             // 10.00
  punktwert: number;             // 0.05
  playerNames: string[];         // ["Alice", "Bob", "Charlie"]
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}
```

### Game (EXAKT wie Frontend!)
```typescript
{
  gameId: string;
  spieltagId: string;
  gameNumber: number;            // 1, 2, 3, ...
  gameValue: number;             // -8 bis +8
  bockTrigger: boolean;
  players: {
    "Alice": {
      roles: ["Re"],
      points: 1
    },
    "Bob": {
      roles: ["Kontra"],
      points: -1
    }
  },
  date: string;
  timestamp: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 📡 API-Endpunkte

### Authentifizierung

#### POST /signup
Neuen User registrieren (Telefonnummer)

**Request:**
```json
{
  "phoneNumber": "+491234567890",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "message": "User created. Check SMS for verification code.",
  "userId": "abc-123-def"
}
```

#### POST /confirm
SMS-Code bestätigen

**Request:**
```json
{
  "phoneNumber": "+491234567890",
  "code": "123456"
}
```

**Response:**
```json
{
  "message": "User confirmed successfully"
}
```

#### POST /signin
Login

**Request:**
```json
{
  "phoneNumber": "+491234567890",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 3600,
  "userId": "abc-123-def"
}
```

---

### Spieltage

#### POST /spieltage
Neuen Spieltag erstellen

**Headers:**
```
x-user-id: abc-123-def
```

**Request:**
```json
{
  "date": "2026-02-19T18:00:00.000Z",
  "startgeld": 10.00,
  "punktwert": 0.05,
  "playerNames": ["Alice", "Bob", "Charlie", "David"]
}
```

**Response:**
```json
{
  "spieltagId": "spieltag-1708365600000-xyz789",
  "userId": "abc-123-def",
  "date": "2026-02-19T18:00:00.000Z",
  "startgeld": 10.00,
  "punktwert": 0.05,
  "playerNames": ["Alice", "Bob", "Charlie", "David"],
  "status": "active",
  "createdAt": "2026-02-19T18:00:00.000Z",
  "updatedAt": "2026-02-19T18:00:00.000Z"
}
```

#### GET /spieltage
Alle Spieltage eines Users

**Headers:**
```
x-user-id: abc-123-def
```

**Response:**
```json
{
  "spieltage": [
    {
      "spieltagId": "spieltag-1708365600000-xyz789",
      "userId": "abc-123-def",
      "date": "2026-02-19T18:00:00.000Z",
      "startgeld": 10.00,
      "punktwert": 0.05,
      "playerNames": ["Alice", "Bob", "Charlie", "David"],
      "status": "active",
      "createdAt": "2026-02-19T18:00:00.000Z",
      "updatedAt": "2026-02-19T18:00:00.000Z"
    }
  ]
}
```

#### GET /spieltage/{spieltagId}
Einzelnen Spieltag mit allen Spielen

**Headers:**
```
x-user-id: abc-123-def
```

**Response:**
```json
{
  "spieltag": {
    "spieltagId": "spieltag-1708365600000-xyz789",
    "userId": "abc-123-def",
    "date": "2026-02-19T18:00:00.000Z",
    "startgeld": 10.00,
    "punktwert": 0.05,
    "playerNames": ["Alice", "Bob", "Charlie", "David"],
    "status": "active",
    "createdAt": "2026-02-19T18:00:00.000Z",
    "updatedAt": "2026-02-19T18:00:00.000Z"
  },
  "games": [
    {
      "gameId": "game-1708365700000-abc123",
      "spieltagId": "spieltag-1708365600000-xyz789",
      "gameNumber": 1,
      "gameValue": 1,
      "bockTrigger": false,
      "players": {
        "Alice": { "roles": ["Re"], "points": 1 },
        "Bob": { "roles": ["Re"], "points": 1 },
        "Charlie": { "roles": ["Kontra"], "points": -1 },
        "David": { "roles": ["Kontra"], "points": -1 }
      },
      "date": "2026-02-19T18:05:00.000Z",
      "timestamp": 1708365700000,
      "createdAt": "2026-02-19T18:05:00.000Z",
      "updatedAt": "2026-02-19T18:05:00.000Z"
    }
  ]
}
```

#### PUT /spieltage/{spieltagId}/complete
Spieltag abschließen

**Headers:**
```
x-user-id: abc-123-def
```

**Response:**
```json
{
  "message": "Spieltag completed"
}
```

---

### Spiele

#### POST /spieltage/{spieltagId}/games
Spiel zu Spieltag hinzufügen

**Headers:**
```
x-user-id: abc-123-def
```

**Request (EXAKT wie Frontend!):**
```json
{
  "gameValue": 1,
  "bockTrigger": false,
  "players": {
    "Alice": {
      "roles": ["Re"],
      "points": 1
    },
    "Bob": {
      "roles": ["Re"],
      "points": 1
    },
    "Charlie": {
      "roles": ["Kontra"],
      "points": -1
    },
    "David": {
      "roles": ["Kontra"],
      "points": -1
    }
  }
}
```

**Response:**
```json
{
  "gameId": "game-1708365700000-abc123",
  "spieltagId": "spieltag-1708365600000-xyz789",
  "gameNumber": 1,
  "gameValue": 1,
  "bockTrigger": false,
  "players": {
    "Alice": { "roles": ["Re"], "points": 1 },
    "Bob": { "roles": ["Re"], "points": 1 },
    "Charlie": { "roles": ["Kontra"], "points": -1 },
    "David": { "roles": ["Kontra"], "points": -1 }
  },
  "date": "2026-02-19T18:05:00.000Z",
  "timestamp": 1708365700000,
  "createdAt": "2026-02-19T18:05:00.000Z",
  "updatedAt": "2026-02-19T18:05:00.000Z"
}
```

#### GET /spieltage/{spieltagId}/games
Alle Spiele eines Spieltags

**Headers:**
```
x-user-id: abc-123-def
```

**Response:**
```json
{
  "games": [
    {
      "gameId": "game-1708365700000-abc123",
      "spieltagId": "spieltag-1708365600000-xyz789",
      "gameNumber": 1,
      "gameValue": 1,
      "bockTrigger": false,
      "players": {
        "Alice": { "roles": ["Re"], "points": 1 },
        "Bob": { "roles": ["Re"], "points": 1 },
        "Charlie": { "roles": ["Kontra"], "points": -1 },
        "David": { "roles": ["Kontra"], "points": -1 }
      },
      "date": "2026-02-19T18:05:00.000Z",
      "timestamp": 1708365700000,
      "createdAt": "2026-02-19T18:05:00.000Z",
      "updatedAt": "2026-02-19T18:05:00.000Z"
    }
  ]
}
```

---

### Statistiken

#### GET /stats
Gesamt-Statistiken über alle Spieltage

**Headers:**
```
x-user-id: abc-123-def
```

**Response:**
```json
{
  "stats": [
    {
      "playerName": "Alice",
      "totalGames": 15,
      "totalPoints": 23,
      "totalMoney": 1.15,
      "averagePoints": 1.53,
      "spieltageCount": 3,
      "lastPlayed": "2026-02-19T18:05:00.000Z"
    }
  ],
  "totalSpieltage": 3,
  "totalGames": 45,
  "activeSpieltage": 1,
  "completedSpieltage": 2
}
```

#### GET /spieltage/{spieltagId}/stats
Statistiken für einen Spieltag (Abrechnung)

**Headers:**
```
x-user-id: abc-123-def
```

**Response:**
```json
{
  "spieltag": {
    "spieltagId": "spieltag-1708365600000-xyz789",
    "startgeld": 10.00,
    "punktwert": 0.05,
    "status": "completed"
  },
  "games": [...],
  "finalScores": {
    "Alice": {
      "points": 5,
      "money": 10.25,
      "gewinnVerlust": 0.25
    },
    "Bob": {
      "points": -3,
      "money": 9.85,
      "gewinnVerlust": -0.15
    }
  },
  "totalGames": 10
}
```

---

## 🔐 Authentifizierung

**Aktuell:** Temporär über `x-user-id` Header (für Entwicklung)

**Später:** Cognito JWT Token im `Authorization: Bearer <token>` Header

---

## 🗄️ DynamoDB Schema (Single Table Design)

### Access Patterns

| Pattern | PK | SK |
|---------|----|----|
| User's Spieltage | `USER#<userId>` | `SPIELTAG#<spieltagId>` |
| Spieltag's Games | `SPIELTAG#<spieltagId>` | `GAME#<gameId>` |

### Beispiel-Items

**Spieltag:**
```json
{
  "PK": "USER#abc-123-def",
  "SK": "SPIELTAG#spieltag-1708365600000-xyz789",
  "entityType": "SPIELTAG",
  "spieltagId": "spieltag-1708365600000-xyz789",
  "userId": "abc-123-def",
  "date": "2026-02-19T18:00:00.000Z",
  "startgeld": 10.00,
  "punktwert": 0.05,
  "playerNames": ["Alice", "Bob"],
  "status": "active",
  "createdAt": "2026-02-19T18:00:00.000Z",
  "updatedAt": "2026-02-19T18:00:00.000Z"
}
```

**Game:**
```json
{
  "PK": "SPIELTAG#spieltag-1708365600000-xyz789",
  "SK": "GAME#game-1708365700000-abc123",
  "entityType": "GAME",
  "gameId": "game-1708365700000-abc123",
  "spieltagId": "spieltag-1708365600000-xyz789",
  "gameNumber": 1,
  "gameValue": 1,
  "bockTrigger": false,
  "players": {
    "Alice": { "roles": ["Re"], "points": 1 },
    "Bob": { "roles": ["Kontra"], "points": -1 }
  },
  "date": "2026-02-19T18:05:00.000Z",
  "timestamp": 1708365700000,
  "createdAt": "2026-02-19T18:05:00.000Z",
  "updatedAt": "2026-02-19T18:05:00.000Z"
}
```

---

## 💰 Kosten

- DynamoDB: $0.65/Monat (1 RCU/WCU)
- Lambda: Free Tier (128MB)
- Cognito: Free Tier (erste 50.000 MAUs)
- Function URLs: Kostenlos

**Total: ~$0.65/Monat**

---

## 🚀 Deployment

```bash
npm run build
npm run deploy
```

Nach Deployment werden alle Function URLs in den Outputs angezeigt.
