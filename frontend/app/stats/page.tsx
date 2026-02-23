'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface PlayerStats {
  playerName: string;
  totalGames: number;
  totalPoints: number;
  totalMoney: number;
  averagePoints: number;
  spieltageCount: number;
  lastPlayed: string;
}

export default function StatsPage() {
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [totalSpieltage, setTotalSpieltage] = useState(0);
  const [totalGames, setTotalGames] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data.stats || []);
      setTotalSpieltage(data.totalSpieltage || 0);
      setTotalGames(data.totalGames || 0);
    } catch (error) {
      console.error('Fehler:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Lade Statistiken...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Gesamt-Statistiken
          </h1>
          <div className="flex gap-4 text-sm text-gray-600">
            <span>📅 {totalSpieltage} Spieltage</span>
            <span>🎮 {totalGames} Spiele</span>
          </div>
        </div>

        {/* Rangliste */}
        {stats.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center text-gray-500">
            Noch keine Statistiken vorhanden.
            <br />
            Spiele dein erstes Spiel!
          </div>
        ) : (
          <div className="space-y-4">
            {stats.map((player, index) => (
              <div
                key={player.playerName}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  {/* Platzierung */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-700' :
                    index === 2 ? 'bg-orange-400 text-orange-900' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Name */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800">{player.playerName}</h3>
                    <p className="text-sm text-gray-600">
                      {player.totalGames} Spiele · {player.spieltageCount} Spieltage
                    </p>
                  </div>

                  {/* Punkte */}
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      player.totalPoints >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {player.totalPoints >= 0 ? '+' : ''}{player.totalPoints}
                    </div>
                    <div className="text-sm text-gray-600">Punkte</div>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Ø Punkte</div>
                    <div className={`font-bold ${
                      player.averagePoints >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {player.averagePoints.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Geld</div>
                    <div className={`font-bold ${
                      player.totalMoney >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {player.totalMoney >= 0 ? '+' : ''}{player.totalMoney.toFixed(2)}€
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Zuletzt</div>
                    <div className="font-medium text-gray-800">
                      {new Date(player.lastPlayed).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-2">ℹ️ Hinweis</h3>
          <p className="text-sm text-blue-800">
            Die Statistiken werden über alle Spieltage hinweg berechnet.
            Nur abgeschlossene Spieltage fließen in die Geld-Berechnung ein.
          </p>
        </div>
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
            className="flex-1 flex flex-col items-center py-3 text-blue-600 border-t-2 border-blue-600"
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
