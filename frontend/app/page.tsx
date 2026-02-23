'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { calculateReKontraScores, getActivePlayers } from '@/lib/gameLogic';
import { calculateSoloScores } from '@/lib/soloLogic';
import type { GameData, Spieltag } from '@/lib/types';

const GAME_VALUES = [8, 7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8];

export default function Home() {
  const [currentDate, setCurrentDate] = useState('');
  const [currentSpieltag, setCurrentSpieltag] = useState<Spieltag | null>(null);
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [playerCount, setPlayerCount] = useState(5);
  const [playerNames, setPlayerNames] = useState<string[]>(['Gregor', 'Bernd', 'Benno', 'Peter', 'Markus']);
  const [playerRoles, setPlayerRoles] = useState<string[]>(['geber', '', '', '', '']);
  const [gameValue, setGameValue] = useState<number | null>(null);
  const [customGameValue, setCustomGameValue] = useState('');

  useEffect(() => {
    const date = new Date();
    setCurrentDate(date.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
    
    loadCurrentSpieltag();
  }, []);

  const loadCurrentSpieltag = async () => {
    try {
      const data = await api.listSpieltage();
      const activeSpieltag = data.spieltage?.find((s: Spieltag) => s.status === 'active');
      
      if (activeSpieltag) {
        setCurrentSpieltag(activeSpieltag);
        setPlayerNames(activeSpieltag.playerNames);
        setPlayerCount(activeSpieltag.playerNames.length);
        
        const spieltagData = await api.getSpieltag(activeSpieltag.spieltagId);
        setGames(spieltagData.games || []);
        
        if (spieltagData.games && spieltagData.games.length > 0) {
          setNextDealerBasedOnLastGame(spieltagData.games, activeSpieltag.playerNames);
        } else {
          const newRoles = new Array(activeSpieltag.playerNames.length).fill('');
          newRoles[0] = 'geber';
          setPlayerRoles(newRoles);
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  };

  const setNextDealerBasedOnLastGame = (gamesData: GameData[], names: string[]) => {
    if (gamesData.length === 0) return;
    
    const lastGame = gamesData[gamesData.length - 1];
    let lastDealerName: string | null = null;
    
    for (const [playerName, playerData] of Object.entries(lastGame.players)) {
      if (playerData.roles.includes('geber')) {
        lastDealerName = playerName;
        break;
      }
    }
    
    if (!lastDealerName) return;
    
    const lastDealerIndex = names.indexOf(lastDealerName);
    if (lastDealerIndex === -1) return;
    
    const nextDealerIndex = (lastDealerIndex + 1) % names.length;
    
    const newRoles = new Array(names.length).fill('');
    newRoles[nextDealerIndex] = 'geber';
    setPlayerRoles(newRoles);
  };

  const handleNewGameDay = async () => {
    if (currentSpieltag && !confirm('Neuen Spieltag starten?')) {
      return;
    }
    
    const defaultPlayers = ['Gregor', 'Bernd', 'Benno', 'Peter', 'Markus'];
    
    try {
      const newSpieltag = await api.createSpieltag({
        date: new Date().toISOString(),
        startgeld: 10.00,
        punktwert: 0.05,
        playerNames: defaultPlayers,
      });
      
      setCurrentSpieltag(newSpieltag);
      setGames([]);
      setPlayerNames(defaultPlayers);
      setPlayerRoles(['geber', '', '', '', '']);
      setPlayerCount(5);
    } catch (error) {
      console.error('Fehler:', error);
      alert('Fehler beim Erstellen des Spieltags');
    }
  };

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    const newNames = [...playerNames];
    const newRoles = [...playerRoles];
    
    while (newNames.length < count) {
      newNames.push('');
      newRoles.push('');
    }
    
    setPlayerNames(newNames.slice(0, count));
    setPlayerRoles(newRoles.slice(0, count));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentSpieltag) {
      alert('Bitte erst einen Spieltag starten!');
      return;
    }

    const filledNames = playerNames.filter(n => n.trim());
    if (filledNames.length !== playerCount) {
      alert('Bitte alle Spielernamen eingeben.');
      return;
    }

    // Validierung: Spielwert muss ausgewählt sein
    if (gameValue === null || gameValue === undefined) {
      alert('Bitte einen Spielwert auswählen.');
      return;
    }

    // Rollen sammeln
    let geberName: string | null = null;
    const rePlayers: string[] = [];
    const soloPlayers: string[] = [];
    
    for (let i = 0; i < playerCount; i++) {
      const name = playerNames[i].trim();
      const role = playerRoles[i];
      
      if (role === 'geber' || role?.startsWith('geber+')) {
        geberName = name;
      }
      if (role === 're' || role === 'geber+re') {
        rePlayers.push(name);
      }
      if (role === 'solo' || role === 'geber+solo') {
        soloPlayers.push(name);
      }
    }

    // VALIDIERUNG (aus Referenz, Zeile 554-601)
    if (!geberName) {
      alert('Es muss ein Spieler als "Geber" ausgewählt sein.');
      return;
    }

    // Aktive Spieler ermitteln (bei 5 Spielern sitzt Geber aus)
    const activePlayers = getActivePlayers(playerNames.filter(n => n.trim()), geberName, playerCount);
    
    // Spieltyp ermitteln
    let gameType = 'normal';
    if (soloPlayers.length > 0) {
      gameType = 'solo';
    }
    
    let scores: Record<string, number> = {};
    
    if (gameType === 'solo') {
      // Solo-Validierung (aus Referenz, Zeile 580-586)
      if (soloPlayers.length !== 1) {
        alert('Solo: Genau 1 Solo-Spieler.');
        return;
      }
      if (rePlayers.length > 0) {
        alert('Solo: Keine Re-Spieler.');
        return;
      }
      if (!activePlayers.includes(soloPlayers[0])) {
        alert('Solo-Spieler muss aktiv sein (kann bei 5 Spielern nicht der Geber sein).');
        return;
      }
      
      // Solo-Punkte berechnen
      scores = calculateSoloScores(soloPlayers[0], activePlayers, gameValue);
    } else {
      // Normal Re/Kontra: GENAU 2 Re-Spieler benötigt (aus Referenz, Zeile 598)
      if (rePlayers.length !== 2) {
        alert('Normal: 2 Re-Spieler benötigt.');
        return;
      }

      // Re-Spieler müssen aktive Spieler sein (aus Referenz, Zeile 599-601)
      if (!rePlayers.every(rePlayer => activePlayers.includes(rePlayer))) {
        alert('Re-Spieler müssen aktive Spieler sein (können bei 5 Spielern nicht der Geber sein).');
        return;
      }
      
      // Punkte berechnen (EXAKT aus Referenz)
      scores = calculateReKontraScores(rePlayers, activePlayers, gameValue);
    }
    
    // Players-Objekt erstellen
    const playersWithPoints: { [key: string]: { roles: string[]; points: number } } = {};
    
    for (let i = 0; i < playerCount; i++) {
      const name = playerNames[i].trim();
      const role = playerRoles[i];
      
      if (!name) continue;
      
      const roles = role ? [role] : [];
      const points = scores[name] || 0;
      
      playersWithPoints[name] = { roles, points };
    }

    try {
      await api.addGame(currentSpieltag.spieltagId, {
        gameValue,
        bockTrigger: false,
        players: playersWithPoints
      });

      const spieltagData = await api.getSpieltag(currentSpieltag.spieltagId);
      setGames(spieltagData.games || []);

      // Geber rotieren
      const currentDealerIndex = playerRoles.findIndex(role => role === 'geber' || role?.startsWith('geber+'));
      const nextDealerIndex = currentDealerIndex !== -1 ? (currentDealerIndex + 1) % playerCount : 0;
      
      const newRoles = new Array(playerCount).fill('');
      newRoles[nextDealerIndex] = 'geber';
      setPlayerRoles(newRoles);
      
      // Spielwert zurücksetzen auf null (nicht auf '')
      setGameValue(null);
      setCustomGameValue('');
    } catch (error) {
      console.error('Fehler:', error);
      alert('Fehler beim Speichern des Spiels');
    }
  };

  const calculateFinalScores = () => {
    if (games.length === 0) return {};
    
    const finalScores: { [key: string]: { points: number } } = {};
    
    playerNames.forEach(name => {
      if (!name.trim()) return;
      
      const totalPoints = games.reduce((sum, game) => {
        return sum + (game.players[name]?.points || 0);
      }, 0);
      
      finalScores[name] = { points: totalPoints };
    });
    
    return finalScores;
  };

  const finalScores = calculateFinalScores();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f4f4' }}>
        <div style={{ fontSize: '20px', color: '#666' }}>Lade...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px', backgroundColor: '#f4f4f4', color: '#333' }}>
      <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', maxWidth: '1200px', margin: '0 auto' }}>
        
        <h1 style={{ color: '#0056b3', textAlign: 'center', marginBottom: '10px' }}>Dokolator - Schritt 2 Test</h1>
        <div style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          {currentDate}
        </div>
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginBottom: '20px' }}>
          Normal Re/Kontra + Solo - Kein Bock, Keine Hochzeit
        </div>

        <button
          onClick={handleNewGameDay}
          style={{
            display: 'block',
            width: 'auto',
            margin: '0 auto 25px auto',
            padding: '10px 15px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Neuen Spieltag starten
        </button>

        {!currentSpieltag ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>Noch kein aktiver Spieltag</p>
            <p>Klicke auf Neuen Spieltag starten um zu beginnen</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#0056b3', marginTop: '30px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                Spielerfassung
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Anzahl der Spieler:</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input type="radio" name="playerCount" checked={playerCount === 4} onChange={() => handlePlayerCountChange(4)} />
                      4 Spieler
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input type="radio" name="playerCount" checked={playerCount === 5} onChange={() => handlePlayerCountChange(5)} />
                      5 Spieler
                    </label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${playerCount}, 1fr)`, gap: '15px', marginBottom: '20px' }}>
                  {Array.from({ length: playerCount }, (_, i) => (
                    <div key={i} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Spieler {i + 1}:</label>
                      <input
                        type="text"
                        value={playerNames[i] || ''}
                        onChange={(e) => {
                          const newNames = [...playerNames];
                          newNames[i] = e.target.value;
                          setPlayerNames(newNames);
                        }}
                        required
                        style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                      
                      <div style={{ marginTop: '10px' }}>
                        <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Rolle:</h4>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                          <input
                            type="radio"
                            name="geber"
                            checked={playerRoles[i] === 'geber' || playerRoles[i]?.startsWith('geber+')}
                            onChange={() => {
                              const newRoles = [...playerRoles];
                              // Alle anderen Geber entfernen
                              for (let j = 0; j < newRoles.length; j++) {
                                if (j !== i && (newRoles[j] === 'geber' || newRoles[j]?.startsWith('geber+'))) {
                                  newRoles[j] = '';
                                }
                              }
                              newRoles[i] = 'geber';
                              setPlayerRoles(newRoles);
                            }}
                            style={{ marginRight: '5px' }}
                          />
                          Geber
                        </label>
                        
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                          <input
                            type="checkbox"
                            checked={playerRoles[i] === 're' || playerRoles[i] === 'geber+re'}
                            disabled={playerCount === 5 && (playerRoles[i] === 'geber' || playerRoles[i]?.startsWith('geber+'))}
                            onChange={(e) => {
                              const newRoles = [...playerRoles];
                              const isGeber = playerRoles[i] === 'geber' || playerRoles[i]?.startsWith('geber+');
                              if (e.target.checked) {
                                newRoles[i] = isGeber ? 'geber+re' : 're';
                              } else {
                                newRoles[i] = isGeber ? 'geber' : '';
                              }
                              setPlayerRoles(newRoles);
                            }}
                            style={{ marginRight: '5px' }}
                          />
                          Re {playerCount === 5 && (playerRoles[i] === 'geber' || playerRoles[i]?.startsWith('geber+')) && <span style={{ fontSize: '11px', color: '#999' }}>(Geber sitzt aus)</span>}
                        </label>
                        
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                          <input
                            type="checkbox"
                            checked={playerRoles[i] === 'solo' || playerRoles[i] === 'geber+solo'}
                            disabled={playerCount === 5 && (playerRoles[i] === 'geber' || playerRoles[i]?.startsWith('geber+'))}
                            onChange={(e) => {
                              const newRoles = [...playerRoles];
                              const isGeber = playerRoles[i] === 'geber' || playerRoles[i]?.startsWith('geber+');
                              if (e.target.checked) {
                                newRoles[i] = isGeber ? 'geber+solo' : 'solo';
                              } else {
                                newRoles[i] = isGeber ? 'geber' : '';
                              }
                              setPlayerRoles(newRoles);
                            }}
                            style={{ marginRight: '5px' }}
                          />
                          Solo {playerCount === 5 && (playerRoles[i] === 'geber' || playerRoles[i]?.startsWith('geber+')) && <span style={{ fontSize: '11px', color: '#999' }}>(Geber sitzt aus)</span>}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Spielwert:</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                    {GAME_VALUES.map(val => (
                      <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input
                          type="radio"
                          name="gameValue"
                          value={val}
                          checked={gameValue === val && !customGameValue}
                          onChange={() => {
                            setGameValue(val);
                            setCustomGameValue('');
                          }}
                        />
                        {val}
                      </label>
                    ))}
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="radio" name="gameValue" checked={!!customGameValue} onChange={() => {}} />
                      Custom:
                      <input
                        type="number"
                        value={customGameValue}
                        onChange={(e) => {
                          setCustomGameValue(e.target.value);
                          setGameValue(parseInt(e.target.value) || 0);
                        }}
                        style={{ width: '80px', padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                    </label>
                  </div>
                </div>

                <button type="submit" style={{ width: '100%', padding: '15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Spielrunde erfassen
                </button>
              </form>
            </div>

            {games.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h2 style={{ color: '#0056b3', marginTop: '30px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Spielverlauf</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f0f0f0' }}>
                        <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Spiel #</th>
                        <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Spielwert</th>
                        {playerNames.filter(n => n.trim()).map(name => (
                          <th key={name} style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>{name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {games.map((game) => (
                        <tr key={game.gameId || game.gameNumber}>
                          <td style={{ border: '1px solid #ddd', padding: '10px' }}>{game.gameNumber}</td>
                          <td style={{ border: '1px solid #ddd', padding: '10px' }}>{game.gameValue}</td>
                          {playerNames.filter(n => n.trim()).map(name => {
                            const points = game.players[name]?.points || 0;
                            return (
                              <td key={name} style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', fontWeight: 'bold', color: points >= 0 ? '#28a745' : '#dc3545' }}>
                                {points >= 0 ? '+' : ''}{points}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                        <td colSpan={2} style={{ border: '1px solid #ddd', padding: '10px' }}>GESAMT</td>
                        {playerNames.filter(n => n.trim()).map(name => {
                          const total = finalScores[name]?.points || 0;
                          return (
                            <td key={name} style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', color: total >= 0 ? '#28a745' : '#dc3545' }}>
                              {total >= 0 ? '+' : ''}{total}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
