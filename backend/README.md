# Dokolator-dynamo

DynamoDB Backend für Doppelkopf Spielstatistiken mit AWS Lambda und DynamoDB.

**Version:** 2.0 - Datenmodell exakt abgestimmt auf Frontend (Dokolator-Stat-WS)

## ⚠️ WICHTIG

**Die Spiellogik aus `Dokolator-Stat-WS` darf NICHT verändert werden!**  
Siehe [CRITICAL_RULES.md](CRITICAL_RULES.md) für Details.

## Struktur

- `src/handlers/` - Lambda-Funktionen für API-Endpunkte
  - `spieltag.ts` - Spieltag-Verwaltung
  - `game.ts` - Spiele hinzufügen/abrufen
  - `stats.ts` - Statistiken & Abrechnung
  - `auth.ts` - Cognito-Authentifizierung
- `src/types/` - TypeScript-Typdefinitionen (exakt wie Frontend!)
- `template.yaml` - AWS SAM Template für Infrastructure as Code

## API-Endpunkte

### Spieltage
- `POST /spieltage` - Neuen Spieltag erstellen
- `GET /spieltage` - Alle Spieltage eines Users
- `GET /spieltage/{spieltagId}` - Einzelnen Spieltag mit Spielen
- `PUT /spieltage/{spieltagId}/complete` - Spieltag abschließen

### Spiele
- `POST /spieltage/{spieltagId}/games` - Spiel hinzufügen
- `GET /spieltage/{spieltagId}/games` - Alle Spiele eines Spieltags

### Statistiken
- `GET /stats` - Gesamt-Statistiken über alle Spieltage
- `GET /spieltage/{spieltagId}/stats` - Abrechnung für einen Spieltag

## Setup

```bash
npm install
npm run build
```

## Deployment

```bash
npm run build
npm run deploy:guided
```

Bei der ersten Ausführung wirst du nach Stack-Name (`DokolatorStack`), Region, etc. gefragt.

## Testing

**Nach Deployment:**
```bash
./test-api.sh
```

Testet alle Endpunkte mit dem korrekten Frontend-Datenmodell.

## Datenmodell

**WICHTIG:** Das Backend-Datenmodell ist EXAKT auf das Frontend abgestimmt!

### Game (wie Frontend sendet)
```typescript
{
  gameValue: number,           // -8 bis +8
  bockTrigger: boolean,
  players: {
    "Alice": {
      roles: ["Re"],
      points: 1
    },
    "Bob": {
      roles: ["Kontra"],
      points: -1
    }
  }
}
```

Siehe [API_DOCUMENTATION.md](API_DOCUMENTATION.md) für vollständige API-Dokumentation.

## DynamoDB Schema

**Single Table Design:**
- Spieltage: `PK=USER#<userId>`, `SK=SPIELTAG#<spieltagId>`
- Spiele: `PK=SPIELTAG#<spieltagId>`, `SK=GAME#<gameId>`


## Authentifizierung

Die API verwendet AWS Cognito mit Telefonnummer-Authentifizierung. Siehe [AUTH_FLOW.md](AUTH_FLOW.md) für Details.

**Kurz:**
1. Sign Up mit Telefonnummer → SMS-Code erhalten
2. Code bestätigen
3. Login → Access Token erhalten
4. Token bei API-Aufrufen im `Authorization: Bearer <token>` Header mitschicken

## Kostenoptimierung

**Aktuelle Konfiguration (sehr günstig):**
- DynamoDB: Provisioned mit 1 RCU/WCU = ~$0.65/Monat
- Lambda: 128MB Memory = 50% günstiger als Standard
- Function URLs: KOSTENLOS (statt API Gateway)
- Cognito: Erste 50.000 MAUs kostenlos
- SMS: Erste 50 SMS/Monat kostenlos, danach ~$0.0055/SMS

**Geschätzte monatliche Kosten für 4-10 Spieler:**
- DynamoDB: $0.65
- Lambda: Im Free Tier (kostenlos)
- Cognito: Im Free Tier (kostenlos)
- SMS: Im Free Tier (kostenlos bei <50 SMS/Monat)
- **Total: ~$0.65/Monat**
