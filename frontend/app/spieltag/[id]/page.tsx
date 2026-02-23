'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';

const ROLES = ['Re', 'Re', 'Hochzeit', 'Solo', 'Geber'];
const GAME_VALUES = [8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8];

interface GamePlayer {
  roles: string[];
  points: number;
}

interface Game {
  gameId: string;
  gameNumber: number;
  gameValue: number;
  bockTrigger: boolean;
  players: Record<string, GamePlayer>;
  date: string;
}

interface Spieltag {
  spieltagId: string;
  date: string;
  startgeld: number;
  punktwert: number;
  playerNames: string[];
  status: string;
}

export default function SpieltagPage() {
  const params = useParams();
  const router = useRouter();
  const spieltagId = params.id as string;

  const [spieltag, setSpieltag] = useState<Spieltag | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  // Spielerfassung State
  const [playerCount, setPlayerCount] = useState(5);
  const [players, setPlayers] = useState<Record<string, { name: string; roles: string[] }>>({});
  const [gameValue, setGameValue] = useState(1);
  const [bockTrigger, setBockTrigger] = useState(false);
  const [availableRoles, setAvailableRoles] = useState(ROLES);

  useEffect(() => {
    loadSpieltag();
  }, [spieltagId]);

  const loadSpieltag = async () => {
    try {
      const data = await api.getSpieltag(spieltagId);
      setSpieltag(data.spieltag);
      setGames(data.games || []);
      
      // Spieler vorausfüllen
      const initialPlayers: Record<string, { name: string; roles: string[] }> = {};
      data.spieltag.playerNames.forEach((name: string, i: number) => {
        initialPlayers[`player${i + 1}`] = { name, roles: [] };
      });
      setPlayers(initialPlayers);
      setPlayerCount(data.spieltag.playerNames.length);
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleAssignment = (playerIndex: number, role: string) => {
    const playerId = `player${playerIndex}`;
    const currentRoles = players[playerId]?.roles || [];
    
    setPlayers(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        roles: [...currentRoles, role]
      }
    }));
    
    setAvailableRoles(prev => {
      const index = prev.indexOf(role);
      if (index > -1) {
        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
  };

  const handleRoleRemoval = (playerIndex: number, roleToRemove: string) => {
    const playerId = `player${playerIndex}`;
    const currentRoles = players[playerId]?.roles || [];
    
    setPlayers(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        roles: currentRoles.filter(role => role !== roleToRemove)
      }
    }));
    
    setAvailableRoles(prev => [...prev, roleToRemove]);
  };

  const calculatePoints = (roles: string[], value: number): number => {
    // ORIGINAL LOGIK - NICHT ÄNDERN!
    if (roles.includes('Re')) {
      return value;
    } else if (roles.includes('Solo')) {
      return value * 2;
    } else {
      return -value;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (availableRoles.length > 0) {
      alert('Bitte alle Rollen zuweisen!');
      return;
    }

    // Punkte berechnen (ORIGINAL LOGIK!)
    const playersWithPoints: Record<string, GamePlayer> = {};
    Object.entries(players).forEach(([playerId, player]) => {
      if (player.name.trim()) {
        playersWithPoints[player.name] = {
          roles: player.roles,
          points: calculatePoints(player.roles, gameValue)
        };
      }
    });

    try {
      await api.addGame(spieltagId, {
        gameValue,
        bockTrigger,
        players: playersWithPoints
      });

      // Reset
      setPlayers(prev => {
        const reset: Record<string, { name: string; roles: string[] }> = {};
        Object.entries(prev).forEach(([key, val]) => {
          reset[key] = { name: val.name, roles: [] };
        });
        return reset;
      });
      setAvailableRoles(ROLES);
      setBockTrigger(false);
      
      loadSpieltag();
    } catch (error) {
      console.error('Fehler:', error);
      alert('Fehler beim Speichern');
    }
  };

  const calculateFinalScores = () => {
    if (!spieltag || games.length === 0) return {};
    
    const finalScores: Record<string, { points: number; money: number; gewinnVerlust: number }> = {};
    
    spieltag.playerNames.forEach(playerName => {
      const totalPoints = games.reduce((sum, game) => {
        return sum + (game.players[playerName]?.points || 0);
      }, 0);
      
      const money = spieltag.startgeld + (totalPoints * spieltag.punktwert);
      const gewinnVerlust = money - spieltag.startgeld;
      
      finalScores[playerName] = {
        points: totalPoints,
        money: Math.round(money * 100) / 100,
        gewinnVerlust: Math.round(gewinnVerlust * 100) / 100
      };
    });
    
    return finalScores;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Lade Spieltag...</div>
      </div>
    );
  }

  if (!spieltag) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Spieltag nicht gefunden</div>
      </div>
    );
  }

  const finalScores = calculateFinalScores();

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            Spieltag {new Date(spieltag.date).toLocaleDateString('de-DE')}
          </h1>
          <div className="flex gap-4 mt-2 text-sm text-gray-600">
            <span>Startgeld: {spieltag.startgeld.toFixed(2)}€</span>
            <span>Punktwert: {spieltag.punktwert.toFixed(3)}€</span>
            <span>Spiele: {games.length}</span>
          </div>
        </div>

        {/* Spielerfassung */}
        {spieltag.status === 'active' && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Neues Spiel erfassen</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rollen-Pool */}
              <div>
                <label className="block text-sm font-medium mb-2">Verfügbare Rollen</label>
                <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-gray-50 rounded-lg border-2 border-dashed">
                  {availableRoles.map((role, index) => (
                    <button
                      key={`${role}-${index}`}
                      type="button"
                      onClick={() => {
                        const firstEmpty = Array.from({length: playerCount}, (_, i) => i + 1)
                          .find(i => !players[`player${i}`]?.roles?.length);
                        if (firstEmpty) handleRoleAssignment(firstEmpty, role);
                      }}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-medium hover:bg-blue-200 transition"
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spieler */}
              <div className="space-y-3">
                {Array.from({length: playerCount}, (_, i) => i + 1).map(playerIndex => (
                  <div key={playerIndex} className="p-4 border rounded-lg bg-white">
                    <div className="font-semibold text-center mb-2">
                      {players[`player${playerIndex}`]?.name || `Spieler ${playerIndex}`}
                    </div>
                    <div className="min-h-[40px] p-2 bg-gray-50 rounded border-2 border-dashed flex flex-wrap gap-2">
                      {players[`player${playerIndex}`]?.roles?.map((role, roleIndex) => (
                        <button
                          key={roleIndex}
                          type="button"
                          onClick={() => handleRoleRemoval(playerIndex, role)}
                          className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-red-500 transition"
                        >
                          {role} ×
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Spielwert & Bock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Spielwert</label>
                  <select
                    value={gameValue}
                    onChange={(e) => setGameValue(Number(e.target.value))}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {GAME_VALUES.map(value => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Bockrunde</label>
                  <button
                    type="button"
                    onClick={() => setBockTrigger(!bockTrigger)}
                    className={`w-full py-3 rounded-lg font-medium transition ${
                      bockTrigger
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {bockTrigger ? 'Ja' : 'Nein'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                Spiel speichern
              </button>
            </form>
          </div>
        )}

        {/* Abrechnung */}
        {games.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Aktuelle Abrechnung</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left font-semibold">Spieler</th>
                    <th className="p-3 text-right font-semibold">Punkte</th>
                    <th className="p-3 text-right font-semibold">Geld (€)</th>
                    <th className="p-3 text-right font-semibold">+/- (€)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(finalScores)
                    .sort(([, a], [, b]) => b.points - a.points)
                    .map(([name, scores]) => (
                      <tr key={name} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium">{name}</td>
                        <td className={`p-3 text-right font-bold ${
                          scores.points >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {scores.points >= 0 ? '+' : ''}{scores.points}
                        </td>
                        <td className="p-3 text-right">{scores.money.toFixed(2)}</td>
                        <td className={`p-3 text-right font-bold ${
                          scores.gewinnVerlust >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {scores.gewinnVerlust >= 0 ? '+' : ''}{scores.gewinnVerlust.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Spiel-Historie */}
        {games.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Spiel-Historie</h2>
            <div className="space-y-3">
              {games.slice().reverse().map((game) => (
                <div key={game.gameId} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold">Spiel #{game.gameNumber}</span>
                    <span className="text-sm text-gray-600">
                      Wert: {game.gameValue}
                      {game.bockTrigger && ' 🔥'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(game.players).map(([name, data]) => (
                      <div key={name} className="flex justify-between">
                        <span>{name}</span>
                        <span className={`font-bold ${
                          data.points >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {data.points >= 0 ? '+' : ''}{data.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto flex">
          <Link
            href="/"
            className="flex-1 flex flex-col items-center py-3 text-gray-600 hover:text-blue-600 transition"
          >
            <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-xs font-medium">Spieltage</span>
          </Link>
          <Link
            href="/stats"
            className="flex-1 flex flex-col items-center py-3 text-gray-600 hover:text-blue-600 transition"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-medium">Statistiken</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
