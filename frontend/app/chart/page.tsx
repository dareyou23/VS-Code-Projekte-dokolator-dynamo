'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GameData {
  gameId?: string;
  gameNumber: number;
  gameValue: number;
  bockTrigger: boolean;
  players: { [key: string]: { roles: string[]; points: number } };
  date: string;
}

interface Spieltag {
  spieltagId: string;
  date: string;
  playerNames: string[];
  status: 'active' | 'completed';
  startgeld: number;
  punktwert: number;
}

export default function ChartPage() {
  const [currentSpieltag, setCurrentSpieltag] = useState<Spieltag | null>(null);
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentSpieltag();
  }, []);

  const loadCurrentSpieltag = async () => {
    try {
      const data = await api.listSpieltage();
      const activeSpieltag = data.spieltage?.find((s: Spieltag) => s.status === 'active');
      
      if (activeSpieltag) {
        setCurrentSpieltag(activeSpieltag);
        
        const spieltagData = await api.getSpieltag(activeSpieltag.spieltagId);
        setGames(spieltagData.games || []);
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateChartData = () => {
    if (!currentSpieltag || games.length === 0) return [];

    const playerNames = currentSpieltag.playerNames.filter(n => n.trim());
    const cumulativeScores: { [key: string]: number } = {};
    
    playerNames.forEach(name => {
      cumulativeScores[name] = 0;
    });

    const chartData = [
      { game: 'Start', ...Object.fromEntries(playerNames.map(name => [name, 0])) }
    ];

    games.forEach((game, index) => {
      const dataPoint: any = { game: `Spiel ${index + 1}` };
      
      playerNames.forEach(name => {
        const gamePoints = game.players[name]?.points || 0;
        cumulativeScores[name] += gamePoints;
        dataPoint[name] = cumulativeScores[name];
      });
      
      chartData.push(dataPoint);
    });

    return chartData;
  };

  const chartData = calculateChartData();
  const playerNames = currentSpieltag?.playerNames.filter(n => n.trim()) || [];
  
  const colors = [
    '#ff6384',
    '#36a2eb',
    '#ffce56',
    '#4bc0c0',
    '#9966ff',
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f4f4' }}>
        <div style={{ fontSize: '20px', color: '#666' }}>Lade...</div>
      </div>
    );
  }

  if (!currentSpieltag || games.length === 0) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px', backgroundColor: '#f4f4f4', color: '#333' }}>
        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ color: '#0056b3', textAlign: 'center', marginBottom: '20px' }}>Punkteverlauf</h1>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
            Noch keine Spiele vorhanden.
          </p>
          <div style={{ textAlign: 'center' }}>
            <Link 
              href="/"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#0056b3',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              ← Zurück zur Spielerfassung
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px', backgroundColor: '#f4f4f4', color: '#333' }}>
      <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', maxWidth: '1200px', margin: '0 auto' }}>
        
        <h1 style={{ color: '#0056b3', textAlign: 'center', marginBottom: '30px' }}>Punkteverlauf</h1>

        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="game" />
            <YAxis label={{ value: 'Punkte', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            {playerNames.map((name, index) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <Link 
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#0056b3',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            ← Zurück zur Spielerfassung
          </Link>
        </div>
      </div>
    </div>
  );
}
