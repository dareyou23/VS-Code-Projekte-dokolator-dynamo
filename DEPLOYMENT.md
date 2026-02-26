# Deployment Guide - Dokolator V3 Beta

## 📋 Voraussetzungen

- AWS Account mit Admin-Rechten
- AWS CLI konfiguriert
- AWS SAM CLI installiert
- Node.js 18+ installiert
- Git installiert

## 🔧 Backend Deployment (AWS)

### 1. AWS Credentials konfigurieren

```bash
aws configure
# AWS Access Key ID: [DEIN_KEY]
# AWS Secret Access Key: [DEIN_SECRET]
# Default region: eu-central-1
# Default output format: json
```

### 2. Backend bauen und deployen

```bash
cd backend

# Dependencies installieren
npm install

# SAM Build
sam build

# Deployment (guided beim ersten Mal)
sam deploy --guided

# Oder: Deployment ohne Bestätigung
sam deploy --no-confirm-changeset
```

### 3. Stack-Name und Region

- **Stack Name**: `Dokolator-dynamo`
- **Region**: `eu-central-1`
- **Capabilities**: `CAPABILITY_IAM`

### 4. API URL notieren

Nach dem Deployment zeigt SAM die API URL:
```
Outputs:
  ApiUrl: https://XXXXXXXXXX.execute-api.eu-central-1.amazonaws.com/Prod/
```

Diese URL brauchst du für das Frontend!

## 🌐 Frontend Deployment (Vercel)

### Option A: Vercel CLI

```bash
cd frontend

# Vercel CLI installieren (falls noch nicht)
npm i -g vercel

# Login
vercel login

# Deployment
vercel

# Production Deployment
vercel --prod
```

### Option B: GitHub Integration

1. Push Code zu GitHub
2. Vercel Dashboard öffnen: https://vercel.com
3. "New Project" → GitHub Repo auswählen
4. Framework: Next.js (auto-detected)
5. Root Directory: `frontend`
6. Deploy!

### Environment Variables (Vercel)

Falls du die API URL konfigurierbar machen willst:

```env
NEXT_PUBLIC_API_URL=https://XXXXXXXXXX.execute-api.eu-central-1.amazonaws.com/Prod/
```

Aktuell ist die URL hardcoded in `frontend/lib/api.ts`.

## 🔄 Updates deployen

### Backend Update

```bash
cd backend
sam build && sam deploy --no-confirm-changeset
```

### Frontend Update

```bash
cd frontend
git add .
git commit -m "feat: update"
git push
# Vercel deployed automatisch bei Push
```

## 🗄️ DynamoDB Tabellen

Nach dem ersten Deployment werden automatisch erstellt:

- `Dokolator-Users` - User-Accounts
- `Dokolator-Spieltage` - Spieltage
- `Dokolator-Games` - Einzelne Spiele

### Admin-User erstellen

```bash
cd backend
node create-admin.js
# Erstellt: traudichbox@googlemail.com / Doko2024!
```

### Test-User erstellen

```bash
cd backend
node create-test-user.js
# Erstellt: tom@test.de / Doko2024!
```

## 🧪 Testing nach Deployment

### 1. Backend testen

```bash
cd backend
./test-deployed.sh
```

Oder manuell:
```bash
curl https://XXXXXXXXXX.execute-api.eu-central-1.amazonaws.com/Prod/health
# → {"status":"ok"}
```

### 2. Frontend testen

1. Öffne die Vercel URL
2. Login mit Test-Account
3. Neuen Spieltag starten
4. Spiel erfassen
5. Prüfe Abrechnung

## 🔐 Security Checklist

- [ ] AWS Credentials sicher gespeichert
- [ ] DynamoDB Tabellen haben Backups
- [ ] API Gateway hat Rate Limiting
- [ ] JWT Secret ist sicher
- [ ] CORS ist korrekt konfiguriert
- [ ] Passwörter sind gehashed (bcrypt)

## 📊 Monitoring

### CloudWatch Logs

```bash
# Lambda Logs anschauen
aws logs tail /aws/lambda/Dokolator-LoginFunction --follow

# API Gateway Logs
aws logs tail /aws/apigateway/Dokolator-dynamo --follow
```

### DynamoDB Monitoring

```bash
# Tabellen-Status
aws dynamodb describe-table --table-name Dokolator-Users
aws dynamodb describe-table --table-name Dokolator-Spieltage
aws dynamodb describe-table --table-name Dokolator-Games
```

## 🚨 Rollback

### Backend Rollback

```bash
# Vorherige Version finden
aws cloudformation list-stacks

# Stack löschen (Vorsicht!)
aws cloudformation delete-stack --stack-name Dokolator-dynamo

# Neu deployen
sam deploy
```

### Frontend Rollback (Vercel)

1. Vercel Dashboard öffnen
2. Deployments → Vorherige Version auswählen
3. "Promote to Production"

## 💾 Backup

### DynamoDB Backup

```bash
# On-Demand Backup erstellen
aws dynamodb create-backup \
  --table-name Dokolator-Users \
  --backup-name Dokolator-Users-Backup-$(date +%Y%m%d)

aws dynamodb create-backup \
  --table-name Dokolator-Spieltage \
  --backup-name Dokolator-Spieltage-Backup-$(date +%Y%m%d)

aws dynamodb create-backup \
  --table-name Dokolator-Games \
  --backup-name Dokolator-Games-Backup-$(date +%Y%m%d)
```

## 🔧 Troubleshooting

### "Stack already exists"
```bash
sam deploy --no-confirm-changeset
```

### "Insufficient permissions"
- AWS User braucht IAM, Lambda, API Gateway, DynamoDB Rechte

### "Module not found"
```bash
cd backend && npm install
cd frontend && npm install
```

### API gibt 500 zurück
- CloudWatch Logs checken
- DynamoDB Tabellen existieren?
- Lambda hat IAM Rechte?

## 📞 Support

Bei Problemen:
1. CloudWatch Logs checken
2. `backend/API_DOCUMENTATION.md` lesen
3. `SECURITY_AUDIT.md` prüfen
4. Git Issues erstellen

## ✅ Deployment Checklist

- [ ] Backend deployed
- [ ] API URL notiert
- [ ] Frontend deployed
- [ ] Admin-User erstellt
- [ ] Test-User erstellt
- [ ] Login funktioniert
- [ ] Spieltag erstellen funktioniert
- [ ] Spiel erfassen funktioniert
- [ ] Abrechnung korrekt
- [ ] Backup konfiguriert
- [ ] Monitoring aktiv

🎉 **Fertig! Viel Spaß beim Doppelkopf!**
