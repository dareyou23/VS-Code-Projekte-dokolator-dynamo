// Frontend Types - müssen mit Backend übereinstimmen

export interface GamePlayer {
  roles: string[];
  points: number;
}

export interface GameData {
  gameId?: string;
  gameNumber: number;
  gameValue: number;
  bockTrigger: boolean;
  players: { [key: string]: GamePlayer };
  date: string;
  // Hochzeit-Flags
  isHochzeitPhase1?: boolean;
  isHochzeitPhase2?: boolean;
  hasPartner?: boolean;
  // Für Anzeige
  displayValue?: string;  // z.B. "1 (H Suche)", "5 (H m.P.)"
}

export interface Spieltag {
  spieltagId: string;
  date: string;
  playerNames: string[];
  status: 'active' | 'completed';
  startgeld: number;
  punktwert: number;
  // Bock-State
  bockRoundsActive?: number;
  bockGamesPlayedInStreak?: number;
  totalBockGamesInStreak?: number;
}

export interface PlayerRoles {
  geber: string | null;
  re: string[];
  hochzeit: string | null;
  solo: string | null;
}
