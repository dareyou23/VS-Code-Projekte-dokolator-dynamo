# Hochzeit-Implementierung

## Was muss geändert werden:

### 1. GameData Interface erweitern
```typescript
interface GameData {
  gameId?: string;
  gameNumber: number;
  gameValue: number;
  bockTrigger: boolean;
  players: { [key: string]: { roles: string[]; points: number } };
  date: string;
  isHochzeitPhase1?: boolean;  // NEU
  isHochzeitPhase2?: boolean;  // NEU
  hasPartner?: boolean;         // NEU
}
```

### 2. handleSubmit Logik

**Hochzeit erkennen:**
- Wenn ein Spieler "hochzeit" Rolle hat
- Optional: Ein anderer Spieler hat "re" Rolle (= Partner)

**Phase 1 erstellen (Wert: 1):**
```javascript
// Hochzeit-Spieler: +1 × (Anzahl Kontra)
// Andere: -1
```

**Phase 2 erstellen (eingegebener Wert):**
```javascript
if (Partner vorhanden) {
  // Hochzeit + Partner: +gameValue
  // Andere: -gameValue
} else {
  // Hochzeit alleine: +gameValue × (Anzahl Kontra)
  // Andere: -gameValue
}
```

### 3. Anzeige in Tabelle

Spielwert-Spalte muss anzeigen:
- `1 (H Suche)` für Phase 1
- `X (H m.P.)` für Phase 2 mit Partner
- `X (H Solo)` für Phase 2 ohne Partner

### 4. Backend muss erweitert werden

Das Backend muss die zusätzlichen Felder unterstützen:
- `isHochzeitPhase1`
- `isHochzeitPhase2`
- `hasPartner`

## Nächste Schritte:

1. Backend Handler erweitern
2. Frontend page.tsx komplett neu schreiben
3. Testen mit Hochzeit-Szenarien
