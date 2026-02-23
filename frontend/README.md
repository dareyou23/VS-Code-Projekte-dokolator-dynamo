# Dokolator App - Mobile Doppelkopf Statistiken

Mobile-optimierte Web-App für Doppelkopf-Statistiken mit AWS Backend.

## 🚀 Setup

```bash
npm install
npm run dev
```

## 📱 Features

- ✅ Mobile-First Design
- ✅ Spieltag-Verwaltung
- ✅ Spielerfassung (EXAKT wie statische Seite)
- ✅ Echtzeit-Abrechnung
- ✅ Statistiken über mehrere Spieltage
- ✅ Touch-optimierte UI

## 🎯 Nächste Schritte

1. `npm install` - Dependencies installieren
2. Komponenten aus `Dokolator-Stat-WS` kopieren
3. `npm run dev` - Development Server starten
4. Auf Vercel deployen

## 📡 Backend

Backend ist bereits deployed und läuft!  
Siehe `../Dokolator-dynamo/DEPLOYED_URLS.md` für API-Endpunkte.

## 🔧 Struktur

```
dokolator-app/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Home / Spieltag-Liste
│   ├── spieltag/[id]/     # Einzelner Spieltag
│   └── stats/             # Gesamt-Statistiken
├── components/
│   ├── doppelkopf/        # Kopiert aus Dokolator-Stat-WS
│   └── ui/                # UI-Komponenten
└── lib/
    └── api.ts             # Backend-Client (fertig!)
```

## ⚠️ WICHTIG

Die Spiellogik aus den kopierten Komponenten darf NICHT verändert werden!  
Siehe `../Dokolator-dynamo/CRITICAL_RULES.md`
