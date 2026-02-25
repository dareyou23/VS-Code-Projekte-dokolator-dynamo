'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import type { GameData, Spieltag } from '@/lib/types';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Chart.js registrieren
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Feste Spieler-Reihenfolge
const PLAYER_ORDER = ['Benno', 'Bernd', 'Gregor', 'Markus', 'Peter'];

// Farben für die Spieler
const PLAYER_COLORS: { [key: string]: string } = {
  'Benno': '#FF6384',
  'Bernd': '#36A2EB',
  'Gregor': '#FFCE56',
  'Markus': '#4BC0C0',
  'Peter': '#9966FF'
};

export default function Grafik() {
  const [currentSpieltag, setCurrentSpieltag] = useState<Spieltag | null>(null);
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Abrechnungs-Werte
  const [tageseinsatz, setTageseinsatz] = useState(15.00);
  const [punktwert, setPunktwert] = useState(0.05);

  useEffect(() => {
    loadCurrentSpieltag();
  }, []);

  const loadCurrentSpieltag = async () => {
    try {
      const data = await api.listSpieltage();
      const activeSpieltag = data.spieltage?.find((s: Spieltag) => s.status === 'active');
      
      if (activeSpieltag) {
        setCurrentSpieltag(activeSpieltag);
        setTageseinsatz(activeSpieltag.startgeld || 15.00);
        setPunktwert(activeSpieltag.punktwert || 0.05);
        
        const spieltagData = await api.getSpieltag(activeSpieltag.spieltagId);
        const sortedGames = (spieltagData.games || []).sort((a: GameData, b: GameData) => a.gameNumber - b.gameNumber);
        setGames(sortedGames);
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  };

  // Berechne Chart-Daten
  const calculateChartData = () => {
    const labels = ['Start'];
    const playerData: { [key: string]: number[] } = {};
    
    // Initialisiere alle Spieler mit 0
    PLAYER_ORDER.forEach(name => {
      playerData[name] = [0];
    });
    
    // Kumulierte Punkte für jedes Spiel
    const cumulativeScores: { [key: string]: number } = {};
    PLAYER_ORDER.forEach(name => {
      cumulativeScores[name] = 0;
    });
    
    games.forEach((game) => {
      // Hochzeit hat 2 Zeilen mit gleicher gameNumber
      const isHochzeitSuche = game.hochzeitPhase === 'suche';
      const isHochzeitSpiel = game.hochzeitPhase === 'mit_partner' || game.hochzeitPhase === 'solo';
      
      // Label erstellen
      let label = `${game.gameNumber}`;
      if (isHochzeitSuche) {
        label += ' (H1)';
      } else if (isHochzeitSpiel) {
        label += ' (H2)';
      }
      
      labels.push(label);
      
      // Punkte addieren
      PLAYER_ORDER.forEach(name => {
        const points = game.players[name]?.points || 0;
        cumulativeScores[name] += points;
        playerData[name].push(cumulativeScores[name]);
      });
    });
    
    return { labels, playerData };
  };

  const { labels, playerData } = calculateChartData();
  
  // Berechne Zahlungen (wie in Abrechnung)
  const calculatePayments = () => {
    const payments: { [key: string]: number } = {};
    
    // Finde den Gewinner (höchste Punktzahl)
    const finalPoints: { [key: string]: number } = {};
    PLAYER_ORDER.forEach(name => {
      finalPoints[name] = playerData[name][playerData[name].length - 1] || 0;
    });
    
    const maxPoints = Math.max(...Object.values(finalPoints));
    
    PLAYER_ORDER.forEach(name => {
      const points = finalPoints[name];
      
      if (points === maxPoints) {
        // Gewinner zahlt nur den Sockelbetrag
        payments[name] = tageseinsatz;
      } else {
        // Andere zahlen: Sockelbetrag + (Differenz zum Gewinner × Punktwert)
        const differenz = maxPoints - points;
        payments[name] = tageseinsatz + (differenz * punktwert);
      }
    });
    
    return payments;
  };
  
  const payments = calculatePayments();
  
  // Chart.js Daten
  const chartData = {
    labels,
    datasets: PLAYER_ORDER.map(name => ({
      label: name,
      data: playerData[name],
      borderColor: PLAYER_COLORS[name],
      backgroundColor: PLAYER_COLORS[name],
      fill: false,
      tension: 0.1,
      pointRadius: 3,
      pointHoverRadius: 5
    }))
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const
      },
      title: {
        display: true,
        text: 'Kumulativer Punkteverlauf',
        font: {
          size: 18
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Spiel/Phase'
        },
        ticks: {
          autoSkip: true,
          maxRotation: 45,
          minRotation: 0,
          maxTicksLimit: 20
        }
      },
      y: {
        title: {
          display: true,
          text: 'Kumulierte Punkte'
        },
        beginAtZero: false
      }
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f4f4' }}>
        <div style={{ fontSize: '20px', color: '#666' }}>Lade...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'user']}>
      <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px', backgroundColor: '#f4f4f4', color: '#333', minHeight: '100vh' }}>
        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header mit Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#0056b3', margin: 0 }}>📊 Punkteverlauf</h1>
          <Link href="/" style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '5px', fontSize: '14px' }}>
            ← Zurück zum Spiel
          </Link>
        </div>

        {!currentSpieltag ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>Kein aktiver Spieltag</p>
            <p>Starte einen Spieltag, um den Punkteverlauf zu sehen</p>
          </div>
        ) : games.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>Noch keine Spiele</p>
            <p>Erfasse Spiele, um den Punkteverlauf zu sehen</p>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
              <div style={{ position: 'relative', height: '450px', width: '100%' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Legende mit aktuellen Punkten und Geldwerten */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '2px solid #e9ecef' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#495057' }}>📋 Aktuelle Punktestände & Zahlungen</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                {PLAYER_ORDER.map(name => {
                  const currentPoints = playerData[name][playerData[name].length - 1];
                  const payment = payments[name];
                  return (
                    <div key={name} style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '5px', border: `3px solid ${PLAYER_COLORS[name]}` }}>
                      <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px', fontWeight: 'bold' }}>{name}</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: currentPoints >= 0 ? '#28a745' : '#dc3545', marginBottom: '8px' }}>
                        {currentPoints >= 0 ? '+' : ''}{currentPoints}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0056b3', borderTop: '2px solid #e9ecef', paddingTop: '8px' }}>
                        {payment.toFixed(2)} €
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}
