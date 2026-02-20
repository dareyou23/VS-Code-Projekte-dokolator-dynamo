# Dokolator-dynamo - Projekt-Analyse

**Datum:** 19.02.2026  
**Ziel:** Statische Webseite → Mobile-fähige Web-App mit DynamoDB-Persistierung

---

## 🎯 Projektziel

Transformation der statischen Doppelkopf-Webseite (`Dokolator-Stat-WS`) in eine mobile-fähige Web-App mit:
- ✅ Persistierung in DynamoDB
- ✅ Statistiken über mehrere Spieltage
- ✅ Multi-User-Fähigkeit mit Cognito-Auth
- ⚠️ **KRITISCH:** Spiellogik MUSS unverändert bleiben!

---

## 📊 Aktueller Status

### Dokolator-Stat-WS (Statische Webseite)
**Technologie:** Next.js (Pages Router), React, TypeScript, Tailwind CSS

**Komponenten:**
1. `doppelkopf.tsx` - Hauptkomponente (State Management)
2. `PlayerInput.tsx` - Spielerfassung & Rollenzuweisung
3. `GameHistory.tsx` - Spielverlauf-Anzeige
4. `Abrechnung.tsx` - Tagesabrechnung mit Geldberechnung
5. `ScoreChart.tsx` - Visualisierung

**Kern-Spiellogik (GESCHÜTZT):**
```typescript
// PlayerInput.tsx - Punkteberechnung
if (player.roles.includes('Re')) {
  points = gameValue;
} else if (player.roles.includes('Solo')) {
  points = gameValue * 2;
} else {
  points = -gameValue;
}

// Abrechnung.tsx - Geldberechnung
const totalPoints = games.reduce((sum, game) => sum + (game.players[name]?.points || 0), 0);
const money = startgeld + (totalPoints * punktwert);
```

**Datenstruktur:**
```typescript
interface GameData {
  gameNumber: number;
  gameValue: number;
  bockTrigger: boolean;
  players: { [key: string]: { roles: string[]; points: number } };
  date: string;
}
```

**Features:**
- ✅ 4 oder 5 Spieler
- ✅ Rollenzuweisung (Re, Re, Hochzeit, Solo, Geber)
- ✅ Spielwert-Auswahl (-8 bis +8)
- ✅ Bockrunden-Trigger
- ✅ Tagesabrechnung mit Startgeld & Punktwert
- ✅ Visualisierung (Chart)
- ❌ Keine Persistierung (nur Session)

---

### Dokolator-dynamo (Backend)
**Technologie:** AWS SAM, Lambda, DynamoDB, Cognito

**Infrastruktur:**
- ✅ DynamoDB Table: `DokolatorGames`
- ✅ Cognito User Pool (Telefonnummer-Auth)
- ✅ Lambda Functions mit Function URLs (kostenoptimiert)
- ✅ CORS konfiguriert

**API-Endpunkte:**
```
Auth (NONE):
- POST /signup - Registrierung
- POST /confirm - SMS-Code Bestätigung
- POST /signin - Login

Games (AWS_IAM):
- POST /games - Spiel erstellen
- GET /games - Alle Spiele
- GET /games/{id} - Einzelnes Spiel
- GET /stats - Statistiken
```

**Datenmodell (Backend):**
```typescript
interface Game {
  gameId: string;
  timestamp: number;
  players: Player[];           // { name, score }
  rounds: GameRound[];         // { roundNumber, winner[], points, soloPlayer?, soloType? }
  finalScores: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}
```

**Problem:** ⚠️ **Datenmodell-Mismatch!**
- Frontend: `players: { [name]: { roles, points } }`
- Backend: `players: Player[]` + `rounds: GameRound[]`

---

## 🔍 Gap-Analyse

### 1. Datenmodell-Inkompatibilität
**Problem:** Frontend und Backend haben unterschiedliche Datenstrukturen

**Frontend (Dokolator-Stat-WS):**
- Speichert Spiele als flache Struktur
- Jedes Spiel hat `players` mit Rollen und Punkten
- Keine Runden-Konzept

**Backend (Dokolator-dynamo):**
- Erwartet `rounds` Array
- Trennt zwischen `players` und `finalScores`
- Konzept für Solo-Spiele

**Lösung:** Backend-Datenmodell an Frontend anpassen!

### 2. Fehlende Frontend-Integration
**Problem:** Keine Web-App die das Backend nutzt

**Was fehlt:**
- [ ] Frontend-Projekt (Next.js App Router oder React)
- [ ] API-Client für Backend-Kommunikation
- [ ] Auth-Flow Integration (Cognito)
- [ ] Mobile-optimiertes UI
- [ ] Spieltag-Verwaltung (Liste, Auswahl, Historie)

### 3. Authentifizierung
**Status:** Backend hat Cognito, Frontend hat keine Auth

**Benötigt:**
- [ ] Login/Signup UI
- [ ] Token-Management
- [ ] Protected Routes
- [ ] User-spezifische Daten

### 4. Multi-Spieltag-Funktionalität
**Problem:** Statische Webseite = nur ein Spieltag

**Benötigt:**
- [ ] Spieltag erstellen/beenden
- [ ] Spieltag-Liste
- [ ] Spieltag-Auswahl
- [ ] Historische Statistiken über alle Spieltage

---

## 🎯 Empfohlene Architektur

### Option A: Next.js App Router (Empfohlen)
```
dokolator-app/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (protected)/
│   │   │   ├── spieltage/          # Liste aller Spieltage
│   │   │   ├── spieltag/[id]/      # Einzelner Spieltag (Spielerfassung)
│   │   │   ├── statistik/          # Gesamt-Statistiken
│   │   │   └── profil/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── doppelkopf/             # KOPIERT aus Dokolator-Stat-WS
│   │   │   ├── PlayerInput.tsx     # ⚠️ UNVERÄNDERT
│   │   │   ├── Abrechnung.tsx      # ⚠️ UNVERÄNDERT
│   │   │   ├── GameHistory.tsx
│   │   │   └── ScoreChart.tsx
│   │   └── ui/
│   ├── lib/
│   │   ├── api.ts                  # Backend-Client
│   │   ├── auth.ts                 # Cognito-Integration
│   │   └── types.ts                # Shared Types
│   └── middleware.ts               # Auth-Protection
└── package.json
```

### Option B: Separate React App
- Ähnliche Struktur, aber ohne Next.js
- Deployment auf Vercel/Netlify
- Einfacher, aber weniger SEO

---

## 📋 Implementierungsplan

### Phase 1: Backend-Anpassung (KRITISCH)
**Ziel:** Datenmodell an Frontend anpassen

1. **Neue Game-Typen definieren:**
```typescript
// src/types/game.ts
export interface GamePlayer {
  roles: string[];
  points: number;
}

export interface Game {
  gameId: string;
  spieltagId: string;           // NEU: Zuordnung zu Spieltag
  gameNumber: number;            // NEU: Spiel-Nummer im Spieltag
  gameValue: number;             // NEU: Spielwert
  bockTrigger: boolean;          // NEU: Bockrunde
  players: Record<string, GamePlayer>;  // ANGEPASST
  timestamp: number;
  createdAt: string;
  updatedAt: string;
}

export interface Spieltag {
  spieltagId: string;
  userId: string;                // Cognito User ID
  date: string;
  startgeld: number;
  punktwert: number;
  games: Game[];
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}
```

2. **Neue Handler erstellen:**
- `createSpieltag.ts` - Neuen Spieltag starten
- `getSpieltag.ts` - Spieltag mit allen Spielen laden
- `listSpieltage.ts` - Alle Spieltage eines Users
- `addGameToSpieltag.ts` - Spiel zu Spieltag hinzufügen
- `completeSpieltag.ts` - Spieltag abschließen

3. **DynamoDB Schema anpassen:**
```yaml
# Neue GSI für User-Abfragen
GlobalSecondaryIndexes:
  - IndexName: UserIdIndex
    KeySchema:
      - AttributeName: userId
        KeyType: HASH
      - AttributeName: createdAt
        KeyType: RANGE
```

### Phase 2: Frontend-Projekt Setup
1. **Next.js App erstellen:**
```bash
npx create-next-app@latest dokolator-app --typescript --tailwind --app
```

2. **Dependencies installieren:**
```bash
npm install @aws-sdk/client-cognito-identity-provider
npm install recharts  # für Charts
```

3. **Komponenten kopieren:**
- Alle Komponenten aus `Dokolator-Stat-WS/src/components/doppelkopf/` kopieren
- ⚠️ **KEINE Änderungen an Berechnungslogik!**
- Nur API-Integration hinzufügen

### Phase 3: Auth-Integration
1. Cognito-Client implementieren
2. Login/Signup UI
3. Token-Management
4. Protected Routes

### Phase 4: Spieltag-Verwaltung
1. Spieltag-Liste
2. Spieltag erstellen/starten
3. Spiele erfassen (mit kopierten Komponenten)
4. Spieltag abschließen

### Phase 5: Statistiken
1. Gesamt-Statistiken über alle Spieltage
2. Spieler-Vergleiche
3. Historische Trends

---

## 🚨 Kritische Punkte

### 1. Spiellogik NICHT ändern!
**Dateien die 1:1 kopiert werden:**
- `PlayerInput.tsx` - Punkteberechnung
- `Abrechnung.tsx` - Geldberechnung
- Alle mathematischen Formeln

**Erlaubte Änderungen:**
- API-Calls hinzufügen (z.B. `onGameSubmit` ruft Backend)
- UI-Styling verbessern
- Mobile-Optimierung
- Loading-States

### 2. Datenmodell-Konsistenz
**Wichtig:** Backend muss exakt die Datenstruktur des Frontends speichern!

```typescript
// Frontend sendet:
{
  gameValue: 1,
  bockTrigger: false,
  players: {
    "Alice": { roles: ["Re"], points: 1 },
    "Bob": { roles: ["Kontra"], points: -1 }
  }
}

// Backend speichert EXAKT das gleiche!
```

### 3. Kostenoptimierung beibehalten
- DynamoDB Provisioned (1 RCU/WCU)
- Lambda 128MB
- Function URLs (kein API Gateway)
- Cognito Free Tier

---

## 🎬 Nächste Schritte

### Sofort:
1. ✅ CRITICAL_RULES.md erstellt
2. ✅ Projekt-Analyse dokumentiert

### Als Nächstes (auf deine Anweisung):
1. Backend-Datenmodell anpassen
2. Neue Handler implementieren
3. Frontend-Projekt aufsetzen
4. Komponenten kopieren und integrieren

---

## 📝 Offene Fragen

1. **Deployment-Ziel für Frontend?**
   - Vercel (empfohlen, kostenlos)
   - AWS Amplify
   - Netlify

2. **User-Konzept?**
   - Jeder User hat eigene Spieltage?
   - Oder gemeinsame Spieltage für Gruppe?

3. **Offline-Fähigkeit?**
   - PWA mit Service Worker?
   - Lokale Speicherung + Sync?

4. **Zusätzliche Features?**
   - Push-Benachrichtigungen?
   - Spieler-Einladungen?
   - Export (PDF/Excel)?

---

**Status:** Analyse abgeschlossen, bereit für Implementierung
**Nächster Schritt:** Auf deine Anweisung warten
