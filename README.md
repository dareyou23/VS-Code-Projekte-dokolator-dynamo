# Dokolator V3 Beta

Moderne Doppelkopf-Statistik-App mit JWT Authentication, User Management und Echtzeit-Abrechnung.

## 🎯 Features

- ✅ **JWT Authentication** - Sicheres Login-System ohne Cognito
- ✅ **User Management** - Admin & User Rollen
- ✅ **Spieltag-Verwaltung** - Mehrere Spieltage parallel
- ✅ **Echtzeit-Abrechnung** - Automatische Punkteberechnung
- ✅ **Bockrunden** - Vollständige Bock-Logik
- ✅ **Hochzeit & Solo** - Alle Spielvarianten
- ✅ **Mobile-First** - iPad-optimiert mit Touch-Bedienung
- ✅ **Moderne UI** - Tailwind CSS, Gradient-Design
- ✅ **Statistiken** - Historie, Grafiken, Abrechnung

## 🚀 Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Backend (AWS SAM)
```bash
cd backend
npm install
sam build
sam deploy
```

## 👥 Test-Accounts

- **Admin**: `traudichbox@googlemail.com` / `Doko2024!`
- **User**: `tom@test.de` / `Doko2024!`

## 📡 API

**Production**: `https://7rfvjbcze2.execute-api.eu-central-1.amazonaws.com/Prod/`

Siehe `backend/API_DOCUMENTATION.md` für Details.

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 18, Tailwind CSS
- **Backend**: AWS Lambda, API Gateway, DynamoDB
- **Auth**: JWT (bcrypt + jsonwebtoken)
- **Deployment**: AWS SAM, Vercel

## 📂 Struktur

```
dokolator-dynamo/
├── frontend/           # Next.js App
│   ├── app/           # Pages (App Router)
│   ├── components/    # React Components
│   └── lib/           # API Client, Utils
└── backend/           # AWS Lambda
    ├── src/handlers/  # Lambda Functions
    └── template.yaml  # SAM Template
```

## 🔐 Security

- Passwörter mit bcrypt gehashed
- JWT Tokens (24h Gültigkeit)
- Role-based Access Control (Admin/User)
- Siehe `SECURITY_AUDIT.md`

## 📖 Weitere Docs

- [Deployment Guide](DEPLOYMENT.md)
- [API Documentation](backend/API_DOCUMENTATION.md)
- [Auth Flow](backend/AUTH_FLOW.md)
- [Security Audit](SECURITY_AUDIT.md)

## 🎮 Spielregeln

- **Normal**: 2 Re-Spieler vs Rest
- **Solo**: 1 gegen alle
- **Hochzeit**: Suche + Spiel (2 Zeilen)
- **Bock**: Automatischer 2x Multiplikator
- **5 Spieler**: Geber sitzt aus

## 🚧 Development

```bash
# Frontend Dev Server
cd frontend && npm run dev

# Backend Local Testing
cd backend && sam local start-api

# Build & Deploy
cd backend && sam build && sam deploy
```

## 📝 Git Workflow

Branch: `feature/v3-beta-jwt-auth-hamburger-menu`

```bash
git add .
git commit -m "feat: description"
git push origin feature/v3-beta-jwt-auth-hamburger-menu
```

## 🐛 Known Issues

Keine bekannten Issues - V3 Beta läuft stabil!

## 📧 Support

Bei Fragen: Siehe Code-Kommentare oder `backend/CRITICAL_RULES.md`
