// ⚠️ DATENMODELL MUSS EXAKT DEM FRONTEND ENTSPRECHEN!
// Quelle: Dokolator-Stat-WS/src/components/doppelkopf.tsx

export interface GamePlayer {
  roles: string[];  // z.B. ["Re"], ["Solo"], ["Kontra"]
  points: number;   // Berechnete Punkte für dieses Spiel
}

export interface Game {
  gameId: string;
  spieltagId: string;           // Zuordnung zu einem Spieltag
  gameNumber: number;            // Spiel-Nummer innerhalb des Spieltags
  gameValue: number;             // Spielwert (-8 bis +8)
  bockTrigger: boolean;          // Löst Bockrunde aus
  players: Record<string, GamePlayer>;  // { "Alice": { roles: ["Re"], points: 1 } }
  date: string;                  // ISO-String
  timestamp: number;
  createdAt: string;
  updatedAt: string;
  // Hochzeit-spezifische Felder
  isHochzeitPhase1?: boolean;    // Phase 1: Suche (Wert 1)
  isHochzeitPhase2?: boolean;    // Phase 2: Eigentliches Spiel
  hasPartner?: boolean;          // Phase 2: Mit Partner (true) oder Solo (false)
}

export interface Spieltag {
  spieltagId: string;
  userId: string;                // Cognito User ID (für Multi-User)
  date: string;                  // Datum des Spieltags
  startgeld: number;             // Startgeld pro Person (z.B. 10.00)
  punktwert: number;             // Wert pro Punkt (z.B. 0.05)
  playerNames: string[];         // Liste der Spieler an diesem Tag
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
  // Bock-State (wird nach jedem Spiel aktualisiert)
  bockRoundsActive?: number;              // Anzahl aktiver Bockrunden
  bockGamesPlayedInStreak?: number;       // Gespielte Spiele in aktueller Serie
  totalBockGamesInStreak?: number;        // Gesamt-Spiele in aktueller Serie
}

// Statistiken über alle Spieltage
export interface PlayerStats {
  playerName: string;
  totalGames: number;            // Anzahl gespielter Spiele
  totalPoints: number;           // Summe aller Punkte
  totalMoney: number;            // Summe Gewinn/Verlust
  averagePoints: number;         // Durchschnitt pro Spiel
  spieltageCount: number;        // Anzahl Spieltage
  lastPlayed: string;            // Letzter Spieltag (ISO-String)
}
