// Solo calculation logic - EXACT from reference line 615-622

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
