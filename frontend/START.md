# 🚀 Dokolator App - Start Guide

## ✅ App ist fertig!

Die App ist komplett und bereit zum Testen!

## 🎯 Features

✅ Mobile-optimiertes Design  
✅ Spieltag-Verwaltung  
✅ Spielerfassung mit Original-Logik  
✅ Echtzeit-Abrechnung  
✅ Gesamt-Statistiken  
✅ Touch-friendly UI  
✅ Bottom Navigation  

## 🚀 Starten

```bash
cd dokolator-app
npm run dev
```

Dann öffne: **http://localhost:3000**

## 📱 Testen

### 1. Neuen Spieltag erstellen
- Klick auf "+ Neuer Spieltag"
- Spieler eingeben: `Alice, Bob, Charlie, David`
- Startgeld: `10.00`
- Punktwert: `0.05`
- Erstellen

### 2. Spiel erfassen
- Spieltag öffnen
- Rollen auf Spieler verteilen (antippen)
- Spielwert wählen
- Bockrunde optional
- "Spiel speichern"

### 3. Abrechnung ansehen
- Wird automatisch nach jedem Spiel aktualisiert
- Zeigt Punkte, Geld, Gewinn/Verlust

### 4. Statistiken
- Bottom Navigation → "Statistiken"
- Rangliste über alle Spieltage
- Durchschnittswerte

## 🎨 Design

- **Mobile-First:** Optimiert für Smartphones
- **Touch-friendly:** Große Buttons (min 44x44px)
- **Clean:** Wie Meden Manager
- **Schnell:** Keine unnötigen Animationen

## 🔧 Technologie

- Next.js 15 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- AWS Lambda Backend (deployed!)

## 📡 Backend

Backend ist bereits live:
- ✅ 11 Lambda Functions
- ✅ DynamoDB
- ✅ Cognito
- ✅ ~$0.65/Monat

## ⚠️ WICHTIG

Die Spiellogik (Punkteberechnung) ist ORIGINAL und darf nicht geändert werden!

```typescript
// ORIGINAL LOGIK - NICHT ÄNDERN!
if (roles.includes('Re')) {
  return value;
} else if (roles.includes('Solo')) {
  return value * 2;
} else {
  return -value;
}
```

## 🚀 Deployment (später)

```bash
# Build testen
npm run build

# Auf Vercel deployen
vercel
```

## 📝 Struktur

```
dokolator-app/
├── app/
│   ├── page.tsx              # Home (Spieltag-Liste)
│   ├── spieltag/[id]/        # Spieltag-Detail
│   └── stats/                # Statistiken
├── lib/
│   └── api.ts                # Backend-Client
└── package.json
```

## 🎉 Viel Spaß!

Die App ist fertig und funktioniert mit dem deployed Backend!
