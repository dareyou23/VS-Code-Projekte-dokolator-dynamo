'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import type { Spieltag, GameData } from '@/lib/types';

const STANDARD_PLAYERS = ['Benno', 'Bernd', 'Gregor', 'Markus', 'Peter'];

interface SpieltagWithGames extends Spieltag {
  games?: GameData[];
  entnahme?: number; // Entnahme aus der Kasse
}

export default function HistoriePage() {
  const [spieltage, setSpieltage] = useState<SpieltagWithGames[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEntnahme, setEditingEntnahme] = useState<string | null>(null);
  const [entnahmeValue, setEntnahmeValue] = useState<string>('');

  useEffect(() => {
    loadSpieltage();
  }, []);

  const loadSpieltage = async () => {
    try {
      console.log('=== loadSpieltage START ===');
      
      const data = await api.listSpieltage();
      console.log('API Response:', data);
      
      if (!data || !data.spieltage) {
        console.error('No spieltage data');
        return;
      }
      
      console.log('Spieltage array:', data.spieltage);
      console.log('Anzahl Spieltage:', data.spieltage?.length || 0);
      
      // Nur Spieltage mit den Standard-Spielern anzeigen
      const filteredSpieltage = (data.spieltage || []).filter((spieltag: Spieltag) => {
        const hasCorrectPlayers = spieltag.playerNames && 
                                  spieltag.playerNames.length === 5 && 
                                  spieltag.playerNames.every(name => STANDARD_PLAYERS.includes(name));
        console.log(`Spieltag ${spieltag.spieltagId}: Spieler=${JSON.stringify(spieltag.playerNames)}, Filter=${hasCorrectPlayers}`);
        return hasCorrectPlayers;
      });
      
      console.log('Gefilterte Spieltage:', filteredSpieltage.length);
      console.log('=== loadSpieltage END ===');
      
      // Nach Datum sortieren (neueste zuerst)
      const sortedSpieltage = filteredSpieltage.sort((a: Spieltag, b: Spieltag) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      // Für jeden Spieltag die Spiele laden
      const spieltageWithGames = await Promise.all(
        sortedSpieltage.map(async (spieltag) => {
          try {
            const response = await apiClient.getSpieltag(spieltag.spieltagId);
            if (response.success && response.data) {
              const spieltagData = response.data as any;
              console.log(`Spiele für ${spieltag.spieltagId}:`, spieltagData.games?.length || 0);
              return { ...spieltag, games: spieltagData.games || [] };
            }
            return { ...spieltag, games: [] };
          } catch (error) {
            console.error(`Fehler beim Laden von Spieltag ${spieltag.spieltagId}:`, error);
            return { ...spieltag, games: [] };
          }
        })
      );
      
      console.log('Spieltage mit Spielen:', spieltageWithGames);
      setSpieltage(spieltageWithGames);
    } catch (error) {
      console.error('Fehler beim Laden der Spieltage:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPlayerNameCorrect = (name: string) => {
    return STANDARD_PLAYERS.includes(name);
  };

  const calculatePlayerStats = (spieltag: SpieltagWithGames) => {
    const stats: { [key: string]: { points: number; payment: number } } = {};
    
    // Punkte berechnen
    STANDARD_PLAYERS.forEach(name => {
      const totalPoints = (spieltag.games || []).reduce((sum, game) => {
        return sum + (game.players[name]?.points || 0);
      }, 0);
      stats[name] = { points: totalPoints, payment: 0 };
    });
    
    // Zahlungen berechnen
    const maxPoints = Math.max(...Object.values(stats).map(s => s.points));
    const tageseinsatz = spieltag.startgeld || 15.00;
    const punktwert = spieltag.punktwert || 0.05;
    
    STANDARD_PLAYERS.forEach(name => {
      const points = stats[name].points;
      const payment = points === maxPoints 
        ? tageseinsatz 
        : tageseinsatz + ((maxPoints - points) * punktwert);
      stats[name].payment = payment;
    });
    
    return stats;
  };

  const handleEntnahmeClick = (spieltagId: string, currentEntnahme?: number) => {
    setEditingEntnahme(spieltagId);
    setEntnahmeValue(currentEntnahme ? currentEntnahme.toString() : '');
  };

  const handleEntnahmeSave = async (spieltagId: string) => {
    const value = parseFloat(entnahmeValue) || 0;
    
    try {
      // In DynamoDB speichern
      await apiClient.updateEntnahme(spieltagId, value);
      
      // Lokalen State aktualisieren
      setSpieltage(prev => {
        const updated = prev.map(s => 
          s.spieltagId === spieltagId ? { ...s, entnahme: value } : s
        );
        return [...updated]; // Neues Array erzwingen für Re-Render
      });
      
      setEditingEntnahme(null);
      setEntnahmeValue('');
    } catch (error) {
      console.error('Fehler beim Speichern der Entnahme:', error);
      alert('Fehler beim Speichern der Entnahme');
    }
  };

  const handleEntnahmeCancel = () => {
    setEditingEntnahme(null);
    setEntnahmeValue('');
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'user']}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f4f4' }}>
          <div style={{ fontSize: '20px', color: '#666' }}>Lade Historie...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'user']}>
      <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px', backgroundColor: '#f4f4f4', color: '#333' }}>
        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', maxWidth: '1400px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ color: '#0056b3', margin: 0 }}>Spieltag-Historie</h1>
            <Link href="/" style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '5px', fontSize: '14px', fontWeight: 'bold' }}>
              ← Zurück
            </Link>
        </div>

        {spieltage.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p style={{ fontSize: '18px' }}>Noch keine Spieltage mit Standard-Spielern vorhanden</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th rowSpan={2} style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', verticalAlign: 'middle' }}>Datum</th>
                  {STANDARD_PLAYERS.map(name => (
                    <th key={name} colSpan={2} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', backgroundColor: '#e6f7ff' }}>
                      <span style={{ color: isPlayerNameCorrect(name) ? '#0056b3' : '#dc3545', fontWeight: 'bold' }}>
                        {name}
                      </span>
                    </th>
                  ))}
                  <th rowSpan={2} style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', verticalAlign: 'middle', backgroundColor: '#e7f3ff' }}>
                    Tageswert
                  </th>
                  <th rowSpan={2} style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', verticalAlign: 'middle', backgroundColor: '#fff3cd' }}>
                    Gesamt
                  </th>
                  <th rowSpan={2} style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', verticalAlign: 'middle', backgroundColor: '#d4edda' }}>
                    Kasse
                  </th>
                </tr>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  {STANDARD_PLAYERS.map(name => (
                    <>
                      <th key={`${name}-points`} style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', fontSize: '12px' }}>
                        Punkte
                      </th>
                      <th key={`${name}-payment`} style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', fontSize: '12px' }}>
                        Zahlung
                      </th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {spieltage.map((spieltag, index) => {
                  const date = new Date(spieltag.date);
                  const formattedDate = date.toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  });
                  
                  const stats = calculatePlayerStats(spieltag);
                  const totalPayment = Object.values(stats).reduce((sum, s) => sum + s.payment, 0);
                  
                  // Kumulierte Gesamtsumme berechnen (von neuesten bis zu diesem Spieltag)
                  let cumulativeTotal = 0;
                  for (let i = 0; i <= index; i++) {
                    const s = spieltage[i];
                    const sStats = calculatePlayerStats(s);
                    const sTotal = Object.values(sStats).reduce((sum, st) => sum + st.payment, 0);
                    cumulativeTotal += sTotal;
                  }
                  
                  // Kassenstand berechnen (seit letzter Entnahme)
                  let kassenstand = 0;
                  for (let i = 0; i <= index; i++) {
                    const s = spieltage[i];
                    const sStats = calculatePlayerStats(s);
                    const sTotal = Object.values(sStats).reduce((sum, st) => sum + st.payment, 0);
                    kassenstand += sTotal;
                    
                    // Entnahme/Einzahlung berücksichtigen
                    // Positiv = Entnahme (reduziert Kasse), Negativ = Einzahlung (erhöht Kasse)
                    if (s.entnahme) {
                      kassenstand -= s.entnahme;
                    }
                  }
                  
                  return (
                    <tr key={spieltag.spieltagId} style={{ backgroundColor: spieltag.status === 'active' ? '#e6f7ff' : '#fff' }}>
                      <td style={{ border: '1px solid #ddd', padding: '10px', whiteSpace: 'nowrap' }}>
                        {formattedDate}
                      </td>
                      {STANDARD_PLAYERS.map(name => {
                        const playerStats = stats[name];
                        return (
                          <>
                            <td key={`${name}-points`} style={{ 
                              border: '1px solid #ddd', 
                              padding: '8px', 
                              textAlign: 'center',
                              fontWeight: 'bold',
                              color: playerStats.points >= 0 ? '#28a745' : '#dc3545'
                            }}>
                              {playerStats.points >= 0 ? '+' : ''}{playerStats.points}
                            </td>
                            <td key={`${name}-payment`} style={{ 
                              border: '1px solid #ddd', 
                              padding: '8px', 
                              textAlign: 'center',
                              color: '#0056b3'
                            }}>
                              {playerStats.payment.toFixed(2)} €
                            </td>
                          </>
                        );
                      })}
                      <td style={{ 
                        border: '1px solid #ddd', 
                        padding: '10px', 
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        color: '#0056b3',
                        backgroundColor: '#e7f3ff'
                      }}>
                        {totalPayment.toFixed(2)} €
                      </td>
                      <td style={{ 
                        border: '1px solid #ddd', 
                        padding: '10px', 
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        color: '#0056b3',
                        backgroundColor: '#fff3cd'
                      }}>
                        {cumulativeTotal.toFixed(2)} €
                      </td>
                      <td style={{ 
                        border: '1px solid #ddd', 
                        padding: '10px', 
                        textAlign: 'center',
                        backgroundColor: '#d4edda'
                      }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#155724', marginBottom: '5px' }}>
                          {kassenstand.toFixed(2)} €
                        </div>
                        {spieltag.entnahme && spieltag.entnahme > 0 && (
                          <div style={{ fontSize: '12px', color: '#dc3545', marginBottom: '5px' }}>
                            Entnahme: -{spieltag.entnahme.toFixed(2)} €
                          </div>
                        )}
                        {spieltag.entnahme && spieltag.entnahme < 0 && (
                          <div style={{ fontSize: '12px', color: '#28a745', marginBottom: '5px' }}>
                            Einzahlung: +{Math.abs(spieltag.entnahme).toFixed(2)} €
                          </div>
                        )}
                        {editingEntnahme === spieltag.spieltagId ? (
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '5px' }}>
                            <input
                              type="number"
                              step="0.01"
                              value={entnahmeValue}
                              onChange={(e) => setEntnahmeValue(e.target.value)}
                              placeholder="Betrag"
                              style={{ width: '80px', padding: '4px', border: '1px solid #ccc', borderRadius: '3px' }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleEntnahmeSave(spieltag.spieltagId)}
                              style={{ padding: '4px 8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              ✓
                            </button>
                            <button
                              onClick={handleEntnahmeCancel}
                              style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              ✗
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEntnahmeClick(spieltag.spieltagId, spieltag.entnahme)}
                            style={{ 
                              padding: '4px 12px', 
                              backgroundColor: '#17a2b8', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '3px', 
                              cursor: 'pointer',
                              fontSize: '12px',
                              marginTop: '5px'
                            }}
                          >
                            {spieltag.entnahme ? 'Ändern' : 'Entnahme/Einzahlung'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}
