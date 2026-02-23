'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import type { Spieltag, GameData } from '@/lib/types';

const STANDARD_PLAYERS = ['Benno', 'Bernd', 'Gregor', 'Markus', 'Peter'];

interface SpieltagWithGames extends Spieltag {
  games?: GameData[];
}

export default function RollenHistoriePage() {
  const [spieltage, setSpieltage] = useState<SpieltagWithGames[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpieltage();
  }, []);

  const loadSpieltage = async () => {
    try {
      const data = await api.listSpieltage();
      console.log('Geladene Spieltage:', data);
      
      // Nur Spieltage mit den Standard-Spielern anzeigen
      const filteredSpieltage = (data.spieltage || []).filter((spieltag: Spieltag) => {
        const hasCorrectPlayers = spieltag.playerNames && 
                                  spieltag.playerNames.length === 5 && 
                                  spieltag.playerNames.every(name => STANDARD_PLAYERS.includes(name));
        return hasCorrectPlayers;
      });
      
      // Nach Datum sortieren (neueste zuerst)
      const sortedSpieltage = filteredSpieltage.sort((a: Spieltag, b: Spieltag) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      // Für jeden Spieltag die Spiele laden
      const spieltageWithGames = await Promise.all(
        sortedSpieltage.map(async (spieltag) => {
          try {
            const spieltagData = await api.getSpieltag(spieltag.spieltagId);
            return { ...spieltag, games: spieltagData.games || [] };
          } catch (error) {
            console.error(`Fehler beim Laden von Spieltag ${spieltag.spieltagId}:`, error);
            return { ...spieltag, games: [] };
          }
        })
      );
      
      setSpieltage(spieltageWithGames);
    } catch (error) {
      console.error('Fehler beim Laden der Spieltage:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRoleStats = (spieltag: SpieltagWithGames) => {
    const stats: { [key: string]: { re: number; solo: number; hochzeit: number; kontra: number } } = {};
    
    STANDARD_PLAYERS.forEach(name => {
      stats[name] = { re: 0, solo: 0, hochzeit: 0, kontra: 0 };
      
      (spieltag.games || []).forEach(game => {
        const playerData = game.players[name];
        if (!playerData) return;
        
        const roles = playerData.roles || [];
        
        // Re
        if (roles.some(r => r === 're' || r === 'geber+re')) {
          stats[name].re++;
        }
        // Solo
        else if (roles.some(r => r === 'solo' || r === 'geber+solo')) {
          stats[name].solo++;
        }
        // Hochzeit
        else if (roles.some(r => r === 'hochzeit' || r === 'geber+hochzeit')) {
          stats[name].hochzeit++;
        }
        // Kontra (keine spezielle Rolle, aber aktiv)
        else if (playerData.points !== 0) {
          stats[name].kontra++;
        }
      });
    });
    
    return stats;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f4f4' }}>
        <div style={{ fontSize: '20px', color: '#666' }}>Lade Rollen-Historie...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px', backgroundColor: '#f4f4f4', color: '#333' }}>
      <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', maxWidth: '1400px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ color: '#0056b3', margin: 0 }}>🎭 Rollen-Historie</h1>
          <Link href="/" style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '5px', fontSize: '14px', fontWeight: 'bold' }}>
            ← Zurück
          </Link>
        </div>

        {spieltage.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p style={{ fontSize: '18px' }}>Noch keine Spieltage mit Standard-Spielern vorhanden</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '600px', position: 'relative', border: '1px solid #ddd', borderRadius: '5px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f0f0f0' }}>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th rowSpan={2} style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', verticalAlign: 'middle', backgroundColor: '#f0f0f0' }}>Datum</th>
                  {STANDARD_PLAYERS.map(name => (
                    <th key={name} colSpan={4} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', backgroundColor: '#e6f7ff' }}>
                      <span style={{ color: '#0056b3', fontWeight: 'bold' }}>
                        {name}
                      </span>
                    </th>
                  ))}
                </tr>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  {STANDARD_PLAYERS.map(name => (
                    <>
                      <th key={`${name}-re`} style={{ border: '1px solid #ddd', borderLeft: '3px solid #0056b3', padding: '6px', textAlign: 'center', fontSize: '12px', backgroundColor: '#f0f0f0' }}>
                        Re
                      </th>
                      <th key={`${name}-solo`} style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', fontSize: '12px', backgroundColor: '#f0f0f0' }}>
                        So
                      </th>
                      <th key={`${name}-hochzeit`} style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', fontSize: '12px', backgroundColor: '#f0f0f0' }}>
                        Ho
                      </th>
                      <th key={`${name}-kontra`} style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', fontSize: '12px', backgroundColor: '#f0f0f0' }}>
                        Ko
                      </th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {spieltage.map((spieltag) => {
                  const date = new Date(spieltag.date);
                  const formattedDate = date.toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  });
                  
                  const stats = calculateRoleStats(spieltag);
                  
                  return (
                    <tr key={spieltag.spieltagId} style={{ backgroundColor: spieltag.status === 'active' ? '#e6f7ff' : '#fff' }}>
                      <td style={{ border: '1px solid #ddd', padding: '10px', whiteSpace: 'nowrap' }}>
                        {formattedDate}
                      </td>
                      {STANDARD_PLAYERS.map(name => {
                        const playerStats = stats[name];
                        return (
                          <>
                            <td key={`${name}-re`} style={{ 
                              border: '1px solid #ddd',
                              borderLeft: '3px solid #0056b3',
                              padding: '8px', 
                              textAlign: 'center',
                              fontWeight: 'bold',
                              color: '#0056b3',
                              backgroundColor: playerStats.re > 0 ? '#e6f7ff' : '#fff'
                            }}>
                              {playerStats.re}
                            </td>
                            <td key={`${name}-solo`} style={{ 
                              border: '1px solid #ddd', 
                              padding: '8px', 
                              textAlign: 'center',
                              fontWeight: 'bold',
                              color: '#dc3545',
                              backgroundColor: playerStats.solo > 0 ? '#ffe6e6' : '#fff'
                            }}>
                              {playerStats.solo}
                            </td>
                            <td key={`${name}-hochzeit`} style={{ 
                              border: '1px solid #ddd', 
                              padding: '8px', 
                              textAlign: 'center',
                              fontWeight: 'bold',
                              color: '#ff9800',
                              backgroundColor: playerStats.hochzeit > 0 ? '#fff0e6' : '#fff'
                            }}>
                              {playerStats.hochzeit}
                            </td>
                            <td key={`${name}-kontra`} style={{ 
                              border: '1px solid #ddd', 
                              padding: '8px', 
                              textAlign: 'center',
                              fontWeight: 'bold',
                              color: '#6c757d',
                              backgroundColor: playerStats.kontra > 0 ? '#f8f9fa' : '#fff'
                            }}>
                              {playerStats.kontra}
                            </td>
                          </>
                        );
                      })}
                    </tr>
                  );
                })}
                
                {/* Summen-Zeile */}
                {spieltage.length > 0 && (() => {
                  // Berechne Gesamtsummen über alle Spieltage
                  const totalStats: { [key: string]: { re: number; solo: number; hochzeit: number; kontra: number } } = {};
                  
                  STANDARD_PLAYERS.forEach(name => {
                    totalStats[name] = { re: 0, solo: 0, hochzeit: 0, kontra: 0 };
                    
                    spieltage.forEach(spieltag => {
                      const stats = calculateRoleStats(spieltag);
                      totalStats[name].re += stats[name].re;
                      totalStats[name].solo += stats[name].solo;
                      totalStats[name].hochzeit += stats[name].hochzeit;
                      totalStats[name].kontra += stats[name].kontra;
                    });
                  });
                  
                  return (
                    <tr style={{ backgroundColor: '#fff3cd', borderTop: '3px solid #ffc107' }}>
                      <td style={{ border: '1px solid #ddd', padding: '12px', fontWeight: 'bold', fontSize: '14px', color: '#856404' }}>
                        Σ Gesamt
                      </td>
                      {STANDARD_PLAYERS.map(name => {
                        const playerTotals = totalStats[name];
                        return (
                          <>
                            <td key={`${name}-re-total`} style={{ 
                              border: '1px solid #ddd',
                              borderLeft: '3px solid #0056b3',
                              padding: '10px', 
                              textAlign: 'center',
                              fontWeight: 'bold',
                              fontSize: '16px',
                              color: '#0056b3',
                              backgroundColor: '#e6f7ff'
                            }}>
                              {playerTotals.re}
                            </td>
                            <td key={`${name}-solo-total`} style={{ 
                              border: '1px solid #ddd', 
                              padding: '10px', 
                              textAlign: 'center',
                              fontWeight: 'bold',
                              fontSize: '16px',
                              color: '#dc3545',
                              backgroundColor: '#ffe6e6'
                            }}>
                              {playerTotals.solo}
                            </td>
                            <td key={`${name}-hochzeit-total`} style={{ 
                              border: '1px solid #ddd', 
                              padding: '10px', 
                              textAlign: 'center',
                              fontWeight: 'bold',
                              fontSize: '16px',
                              color: '#ff9800',
                              backgroundColor: '#fff0e6'
                            }}>
                              {playerTotals.hochzeit}
                            </td>
                            <td key={`${name}-kontra-total`} style={{ 
                              border: '1px solid #ddd', 
                              padding: '10px', 
                              textAlign: 'center',
                              fontWeight: 'bold',
                              fontSize: '16px',
                              color: '#6c757d',
                              backgroundColor: '#f8f9fa'
                            }}>
                              {playerTotals.kontra}
                            </td>
                          </>
                        );
                      })}
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
