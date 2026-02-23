// ⚠️ EXAKTE LOGIK AUS REFERENZ - NICHT ÄNDERN!
// Quelle: dokolator-reference.html

/**
 * Berechnet Punkte für Solo-Spiele
 * Solo-Spieler erhält: effectiveValue × Anzahl Kontra-Spieler
 * Kontra-Spieler erhalten: -effectiveValue
 */
export function calculateSoloScores(
  soloPlayerName: string,
  activePlayers: string[],
  effectiveValue: number
): Record<string, number> {
  const scores: Record<string, number> = {};
  activePlayers.forEach(p => scores[p] = 0);
  
  if (activePlayers.includes(soloPlayerName)) {
    const kontraPlayers = activePlayers.filter(p => p !== soloPlayerName);
    scores[soloPlayerName] = effectiveValue * kontraPlayers.length;
    kontraPlayers.forEach(player => scores[player] = -effectiveValue);
  }
  
  return scores;
}

/**
 * Berechnet Punkte für Re/Kontra-Spiele
 * Re-Spieler erhalten: +effectiveValue
 * Kontra-Spieler erhalten: -effectiveValue
 */
export function calculateReKontraScores(
  rePlayerNames: string[],
  activePlayers: string[],
  effectiveValue: number
): Record<string, number> {
  const scores: Record<string, number> = {};
  activePlayers.forEach(p => scores[p] = 0);
  
  const actualRePlayersInRound = rePlayerNames.filter(p => activePlayers.includes(p));
  const kontraPlayersInRound = activePlayers.filter(p => !actualRePlayersInRound.includes(p));
  
  actualRePlayersInRound.forEach(player => scores[player] = effectiveValue);
  kontraPlayersInRound.forEach(player => scores[player] = -effectiveValue);
  
  return scores;
}

/**
 * Ermittelt aktive Spieler
 * Bei 5 Spielern ist der Geber nicht aktiv
 */
export function getActivePlayers(
  allPlayers: string[],
  geberName: string | null,
  playerCount: number
): string[] {
  const is5Players = playerCount === 5;
  return allPlayers.filter(name => 
    !(is5Players && name === geberName)
  );
}

/**
 * Aktualisiert Bock-State nach einem Spiel
 * @param activePlayersCount - Anzahl der Spieler (4 oder 5), NICHT activePlayers!
 */
export function updateBockState(
  currentBockActive: number,
  currentBockPlayedInStreak: number,
  currentBockTotalInStreak: number,
  isBockRoundCurrentGame: boolean,
  triggerNewBockRound: boolean,
  activePlayersCount: number
): {
  bockActive: number;
  bockPlayedInStreak: number;
  bockTotalInStreak: number;
} {
  let tempBockActive = currentBockActive;
  let tempBockPlayedInStreak = currentBockPlayedInStreak;
  let tempBockTotalInStreak = currentBockTotalInStreak;
  
  // Bockrunde abarbeiten
  if (isBockRoundCurrentGame) {
    tempBockActive--;
    tempBockPlayedInStreak++;
  }
  
  // Neue Bockrunden hinzufügen
  let newBocks = 0;
  if (triggerNewBockRound) {
    newBocks += activePlayersCount;
  }
  
  if (newBocks > 0) {
    if (tempBockActive === 0) {
      // Neue Serie starten
      tempBockPlayedInStreak = 0;
      tempBockTotalInStreak = newBocks;
    } else {
      // Zu bestehender Serie hinzufügen
      tempBockTotalInStreak += newBocks;
    }
    tempBockActive += newBocks;
  }
  
  // Serie beenden
  if (tempBockActive === 0 && 
      tempBockPlayedInStreak >= tempBockTotalInStreak && 
      tempBockTotalInStreak > 0) {
    tempBockPlayedInStreak = 0;
    tempBockTotalInStreak = 0;
  }
  
  return {
    bockActive: tempBockActive,
    bockPlayedInStreak: tempBockPlayedInStreak,
    bockTotalInStreak: tempBockTotalInStreak
  };
}

/**
 * Formatiert Bock-Anzeige für Tabelle
 */
export function formatBockDisplay(
  isBockRound: boolean,
  playedInStreak: number,
  totalInStreak: number
): string {
  if (isBockRound && totalInStreak > 0) {
    return `${playedInStreak}/${totalInStreak}`;
  }
  return '-';
}
