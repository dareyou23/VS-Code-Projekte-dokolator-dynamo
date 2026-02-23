'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { calculateReKontraScores, getActivePlayers, updateBockState } from '@/lib/gameLogic';
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
  const [bockTrigger, setBockTrigger] = useState(false);
  
  // Edit-State
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  
  // Bock-State (wird vom Spieltag geladen)
  const [bockActive, setBockActive] = useState(0);
  const [bockPlayedInStreak, setBockPlayedInStreak] = useState(0);
  const [bockTotalInStreak, setBockTotalInStreak] = useState(0);

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
        
        // Bock-State laden
        setBockActive(activeSpieltag.bockRoundsActive || 0);
        setBockPlayedInStreak(activeSpieltag.bockGamesPlayedInStreak || 0);
        setBockTotalInStreak(activeSpieltag.totalBockGamesInStreak || 0);
        
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
      
      // Bock-State zurücksetzen
      setBockActive(0);
      setBockPlayedInStreak(0);
      setBockTotalInStreak(0);
      setBockTrigger(false);
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

  const startEditGame = (game: GameData) => {
    setEditingGameId(game.gameId || null);
    
    // Spieleranzahl setzen
    const gamePlayerCount = Object.keys(game.players).length;
    setPlayerCount(gamePlayerCount);
    
    // Spielernamen setzen
    const names = Object.keys(game.players);
    setPlayerNames(names);
    
    // Rollen setzen
    const roles = names.map(name => {
      const playerData = game.players[name];
      return playerData.roles.join('+') || '';
    });
    setPlayerRoles(roles);
    
    // Spielwert setzen
    setGameValue(game.gameValue);
    setCustomGameValue('');
    
    // Bock-Trigger setzen
    setBockTrigger(game.bockTrigger);
    
    // Zum Formular scrollen
    document.querySelector('.input-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingGameId(null);
    setGameValue(null);
    setCustomGameValue('');
    setBockTrigger(false);
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
    const hochzeitPlayers: string[] = [];
    
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
      if (role === 'hochzeit' || role === 'geber+hochzeit') {
        hochzeitPlayers.push(name);
      }
    }

    // VALIDIERUNG (aus Referenz, Zeile 554-601)
    if (!geberName) {
      alert('Es muss ein Spieler als "Geber" ausgewählt sein.');
      return;
    }

    // Aktive Spieler ermitteln (bei 5 Spielern sitzt Geber aus)
    const activePlayers = getActivePlayers(playerNames.filter(n => n.trim()), geberName, playerCount);
    
    // Bock-Multiplikator (aus Referenz, Zeile 930-940)
    const isBockRound = bockActive > 0;
    const bockMultiplier = isBockRound ? 2 : 1;
    const effectiveGameValue = gameValue * bockMultiplier;
    
    // Spieltyp ermitteln
    let gameType = 'normal';
    if (soloPlayers.length > 0) {
      gameType = 'solo';
    } else if (hochzeitPlayers.length > 0) {
      gameType = 'hochzeit';
    }
    
    let scores: Record<string, number> = {};
    
    if (gameType === 'solo') {
      // Solo-Validierung (aus Referenz, Zeile 580-586)
      if (soloPlayers.length !== 1) {
        alert('Solo: Genau 1 Solo-Spieler.');
        return;
      }
      if (rePlayers.length > 0 || hochzeitPlayers.length > 0) {
        alert('Solo: Keine Re/Hochzeit-Spieler.');
        return;
      }
      if (!activePlayers.includes(soloPlayers[0])) {
        alert('Solo-Spieler muss aktiv sein (kann bei 5 Spielern nicht der Geber sein).');
        return;
      }
      
      // Solo-Punkte berechnen (mit Bock-Multiplikator)
      scores = calculateSoloScores(soloPlayers[0], activePlayers, effectiveGameValue);
    } else if (gameType === 'hochzeit') {
      // Hochzeit-Validierung (aus Referenz, Zeile 587-596)
      if (hochzeitPlayers.length !== 1) {
        alert('Hochzeit: Genau 1 Hochzeit-Spieler.');
        return;
      }
      if (rePlayers.length > 1) {
        alert('Hochzeit: Max. 1 Re-Partner.');
        return;
      }
      if (rePlayers.length === 1 && hochzeitPlayers[0] === rePlayers[0]) {
        alert('Hochzeit: Spieler kann nicht eigener Partner sein.');
        return;
      }
      if (!activePlayers.includes(hochzeitPlayers[0])) {
        alert('Hochzeit-Spieler muss aktiv sein (kann bei 5 Spielern nicht der Geber sein).');
        return;
      }
      if (rePlayers.length === 1 && !activePlayers.includes(rePlayers[0])) {
        alert('Hochzeit-Partner muss aktiv sein (kann bei 5 Spielern nicht der Geber sein).');
        return;
      }
      
      // Hochzeit: ZWEI ZEILEN mit GLEICHER Spielnummer
      // Zeile 1: Suche (fester Wert 1, Solo-Berechnung) - MIT Bock-Multiplikator
      const searchValue = 1 * bockMultiplier;
      const searchScores = calculateSoloScores(hochzeitPlayers[0], activePlayers, searchValue);
      
      // Zeile 2: Spiel (User-Wert, Re/Kontra oder Solo) - MIT Bock-Multiplikator
      let gameScores: Record<string, number> = {};
      if (rePlayers.length === 1) {
        // MIT Partner: Re/Kontra mit [hochzeitSpieler, partner]
        gameScores = calculateReKontraScores([hochzeitPlayers[0], rePlayers[0]], activePlayers, effectiveGameValue);
      } else {
        // OHNE Partner: Solo
        gameScores = calculateSoloScores(hochzeitPlayers[0], activePlayers, effectiveGameValue);
      }
      
      // Players-Objekt für Zeile 1 (Suche)
      const playersSearch: { [key: string]: { roles: string[]; points: number } } = {};
      for (let i = 0; i < playerCount; i++) {
        const name = playerNames[i].trim();
        if (!name) continue;
        
        const roles = name === hochzeitPlayers[0] ? ['hochzeit'] : (name === geberName ? ['geber'] : []);
        const points = searchScores[name] || 0;
        playersSearch[name] = { roles, points };
      }
      
      // Players-Objekt für Zeile 2 (Spiel)
      const playersGame: { [key: string]: { roles: string[]; points: number } } = {};
      for (let i = 0; i < playerCount; i++) {
        const name = playerNames[i].trim();
        if (!name) continue;
        
        let roles: string[] = [];
        if (name === hochzeitPlayers[0]) {
          roles = ['hochzeit'];
        } else if (rePlayers.length === 1 && name === rePlayers[0]) {
          roles = ['re'];
        } else if (name === geberName) {
          roles = ['geber'];
        }
        
        const points = gameScores[name] || 0;
        playersGame[name] = { roles, points };
      }
      
      try {
        // Zeile 1: Suche speichern (neue gameNumber wird automatisch vergeben)
        const searchResult = await api.addGame(currentSpieltag.spieltagId, {
          gameValue: searchValue,
          bockTrigger: false, // Nur beim Hauptspiel (Zeile 2) triggern
          players: playersSearch,
          hochzeitPhase: 'suche' // Marker für Hochzeit-Suche
        });
        
        // Zeile 2: Spiel speichern (GLEICHE gameNumber wie Zeile 1!)
        await api.addGame(currentSpieltag.spieltagId, {
          gameValue: effectiveGameValue,
          bockTrigger, // Bock-Trigger beim Hauptspiel
          players: playersGame,
          hochzeitPhase: rePlayers.length === 1 ? 'mit_partner' : 'solo', // Marker für Hochzeit-Spiel
          gameNumber: searchResult.gameNumber // WICHTIG: Gleiche Nummer!
        });

        const spieltagData = await api.getSpieltag(currentSpieltag.spieltagId);
        setGames(spieltagData.games || []);

        // Bock-State aktualisieren (aus Referenz, Zeile 940-960)
        const newBockState = updateBockState(
          bockActive,
          bockPlayedInStreak,
          bockTotalInStreak,
          isBockRound,
          bockTrigger,
          playerCount // Anzahl Spieler (4 oder 5), nicht activePlayers!
        );
        
        setBockActive(newBockState.bockActive);
        setBockPlayedInStreak(newBockState.bockPlayedInStreak);
        setBockTotalInStreak(newBockState.bockTotalInStreak);

        // Geber rotieren
        const currentDealerIndex = playerRoles.findIndex(role => role === 'geber' || role?.startsWith('geber+'));
        const nextDealerIndex = currentDealerIndex !== -1 ? (currentDealerIndex + 1) % playerCount : 0;
        
        const newRoles = new Array(playerCount).fill('');
        newRoles[nextDealerIndex] = 'geber';
        setPlayerRoles(newRoles);
        
        // Spielwert und Bock-Trigger zurücksetzen
        setGameValue(null);
        setCustomGameValue('');
        setBockTrigger(false);
      } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler beim Speichern des Hochzeit-Spiels');
      }
      return; // Wichtig: Hier return, damit der normale Flow nicht weiterläuft
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
      
      // Punkte berechnen (EXAKT aus Referenz) - MIT Bock-Multiplikator
      scores = calculateReKontraScores(rePlayers, activePlayers, effectiveGameValue);
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
      if (editingGameId) {
        // UPDATE: Bestehendes Spiel aktualisieren
        const gameToUpdate = games.find(g => g.gameId === editingGameId);
        if (!gameToUpdate) {
          alert('Spiel nicht gefunden');
          return;
        }
        
        await api.updateGame(currentSpieltag.spieltagId, editingGameId, {
          gameNumber: gameToUpdate.gameNumber,
          gameValue,
          bockTrigger,
          players: playersWithPoints,
          hochzeitPhase: gameToUpdate.hochzeitPhase,
          date: gameToUpdate.date,
          timestamp: gameToUpdate.timestamp,
          createdAt: gameToUpdate.date
        });
        
        setEditingGameId(null);
      } else {
        // CREATE: Neues Spiel hinzufügen
        await api.addGame(currentSpieltag.spieltagId, {
          gameValue,
          bockTrigger,
          players: playersWithPoints
        });
      }

      const spieltagData = await api.getSpieltag(currentSpieltag.spieltagId);
      setGames(spieltagData.games || []);

      if (!editingGameId) {
        // Nur bei neuem Spiel: Bock-State aktualisieren und Geber rotieren
        const newBockState = updateBockState(
          bockActive,
          bockPlayedInStreak,
          bockTotalInStreak,
          isBockRound,
          bockTrigger,
          playerCount
        );
        
        setBockActive(newBockState.bockActive);
        setBockPlayedInStreak(newBockState.bockPlayedInStreak);
        setBockTotalInStreak(newBockState.bockTotalInStreak);

        // Geber rotieren
        const currentDealerIndex = playerRoles.findIndex(role => role === 'geber' || role?.startsWith('geber+'));
        const nextDealerIndex = currentDealerIndex !== -1 ? (currentDealerIndex + 1) % playerCount : 0;
        
        const newRoles = new Array(playerCount).fill('');
        newRoles[nextDealerIndex] = 'geber';
        setPlayerRoles(newRoles);
      }
      
      // Spielwert und Bock-Trigger zurücksetzen
      setGameValue(null);
      setCustomGameValue('');
      setBockTrigger(false);
    } catch (error) {
      console.error('Fehler:', error);
      alert(editingGameId ? 'Fehler beim Aktualisieren des Spiels' : 'Fehler beim Speichern des Spiels');
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
        
        <h1 style={{ color: '#0056b3', textAlign: 'center', marginBottom: '10px' }}>Dokolator - Vollversion</h1>
        <div style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          {currentDate}
        </div>
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginBottom: '20px' }}>
          Normal Re/Kontra + Solo + Hochzeit + Bock
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
                            checked={playerRoles[i] === 'hochzeit' || playerRoles[i] === 'geber+hochzeit'}
                            disabled={playerCount === 5 && (playerRoles[i] === 'geber' || playerRoles[i]?.startsWith('geber+'))}
                            onChange={(e) => {
                              const newRoles = [...playerRoles];
                              const isGeber = playerRoles[i] === 'geber' || playerRoles[i]?.startsWith('geber+');
                              if (e.target.checked) {
                                newRoles[i] = isGeber ? 'geber+hochzeit' : 'hochzeit';
                              } else {
                                newRoles[i] = isGeber ? 'geber' : '';
                              }
                              setPlayerRoles(newRoles);
                            }}
                            style={{ marginRight: '5px' }}
                          />
                          Hochzeit {playerCount === 5 && (playerRoles[i] === 'geber' || playerRoles[i]?.startsWith('geber+')) && <span style={{ fontSize: '11px', color: '#999' }}>(Geber sitzt aus)</span>}
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

                <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#fff9e6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <h3 style={{ fontSize: '16px', margin: 0 }}>Bockrunde:</h3>
                      {bockActive > 0 && (
                        <div style={{ padding: '8px 12px', backgroundColor: '#ffe6e6', borderRadius: '4px', fontWeight: 'bold', color: '#d32f2f', fontSize: '14px' }}>
                          ⚠️ Aktiv: {bockPlayedInStreak + 1}/{bockTotalInStreak} (noch {bockActive} Spiele)
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setBockTrigger(!bockTrigger)}
                      style={{
                        padding: '12px 20px',
                        backgroundColor: bockTrigger ? '#d32f2f' : '#ff9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {bockTrigger ? '✓ Bockrunde wird ausgelöst' : 'Bockrunde auslösen'} ({playerCount} Spiele)
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{ flex: 1, padding: '15px', backgroundColor: editingGameId ? '#ffc107' : '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {editingGameId ? 'Änderungen speichern' : 'Spielrunde erfassen'}
                  </button>
                  {editingGameId && (
                    <button type="button" onClick={cancelEdit} style={{ padding: '15px 30px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Abbrechen
                    </button>
                  )}
                </div>
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
                        <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>Bock</th>
                        {playerNames.filter(n => n.trim()).map(name => (
                          <th key={name} style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>{name}</th>
                        ))}
                        <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', width: '60px' }}>✍️</th>
                      </tr>
                    </thead>
                    <tbody>
                      {games.map((game, gameIndex) => {
                        // Kumulierte Punkte bis zu diesem Spiel berechnen
                        const cumulativeScores: { [key: string]: number } = {};
                        playerNames.filter(n => n.trim()).forEach(name => {
                          cumulativeScores[name] = games.slice(0, gameIndex + 1).reduce((sum, g) => {
                            return sum + (g.players[name]?.points || 0);
                          }, 0);
                        });
                        
                        // Bock-State für dieses Spiel berechnen
                        let bockStateForGame = { active: 0, playedInStreak: 0, totalInStreak: 0 };
                        for (let i = 0; i <= gameIndex; i++) {
                          const g = games[i];
                          const isBockRound = bockStateForGame.active > 0;
                          
                          // Anzahl Spieler für dieses Spiel (4 oder 5)
                          const playerCountForGame = Object.keys(g.players).length;
                          
                          // WICHTIG: Hochzeit-Suche zählt NICHT als Bockrunde!
                          const isHochzeitSuche = g.hochzeitPhase === 'suche';
                          
                          // Bock-State aktualisieren (nur wenn NICHT Hochzeit-Suche)
                          if (isBockRound && !isHochzeitSuche) {
                            bockStateForGame.active--;
                            bockStateForGame.playedInStreak++;
                          }
                          
                          if (g.bockTrigger) {
                            if (bockStateForGame.active === 0) {
                              bockStateForGame.playedInStreak = 0;
                              bockStateForGame.totalInStreak = playerCountForGame;
                            } else {
                              bockStateForGame.totalInStreak += playerCountForGame;
                            }
                            bockStateForGame.active += playerCountForGame;
                          }
                          
                          if (bockStateForGame.active === 0 && bockStateForGame.playedInStreak >= bockStateForGame.totalInStreak && bockStateForGame.totalInStreak > 0) {
                            bockStateForGame.playedInStreak = 0;
                            bockStateForGame.totalInStreak = 0;
                          }
                        }
                        
                        // Bock-Anzeige für DIESES Spiel (vor dem Update)
                        let bockDisplay = '-';
                        // Rückwärts rechnen: War dieses Spiel eine Bockrunde?
                        let tempState = { active: 0, playedInStreak: 0, totalInStreak: 0 };
                        for (let i = 0; i < gameIndex; i++) {
                          const g = games[i];
                          const isBockRound = tempState.active > 0;
                          const playerCountForGame = Object.keys(g.players).length;
                          
                          // WICHTIG: Hochzeit-Suche zählt NICHT als Bockrunde!
                          const isHochzeitSuche = g.hochzeitPhase === 'suche';
                          
                          if (isBockRound && !isHochzeitSuche) {
                            tempState.active--;
                            tempState.playedInStreak++;
                          }
                          
                          if (g.bockTrigger) {
                            if (tempState.active === 0) {
                              tempState.playedInStreak = 0;
                              tempState.totalInStreak = playerCountForGame;
                            } else {
                              tempState.totalInStreak += playerCountForGame;
                            }
                            tempState.active += playerCountForGame;
                          }
                          
                          if (tempState.active === 0 && tempState.playedInStreak >= tempState.totalInStreak && tempState.totalInStreak > 0) {
                            tempState.playedInStreak = 0;
                            tempState.totalInStreak = 0;
                          }
                        }
                        
                        // Jetzt prüfen: Ist DAS AKTUELLE Spiel eine Bockrunde?
                        if (tempState.active > 0 && tempState.totalInStreak > 0) {
                          bockDisplay = `${tempState.playedInStreak + 1}/${tempState.totalInStreak}`;
                        }
                        
                        return (
                          <tr key={game.gameId || `${game.gameNumber}-${gameIndex}`}>
                            <td style={{ border: '1px solid #ddd', padding: '10px' }}>{game.gameNumber}</td>
                            <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                              {game.gameValue}
                              {game.hochzeitPhase === 'suche' && ' (H Suche)'}
                              {game.hochzeitPhase === 'mit_partner' && ' (H m.P.)'}
                              {game.hochzeitPhase === 'solo' && ' (H Solo)'}
                            </td>
                            <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', fontWeight: bockDisplay !== '-' ? 'bold' : 'normal', color: bockDisplay !== '-' ? '#d32f2f' : '#666' }}>
                              {bockDisplay}
                            </td>
                            {playerNames.filter(n => n.trim()).map(name => {
                              const cumulative = cumulativeScores[name] || 0;
                              const playerData = game.players[name];
                              const roles = playerData?.roles || [];
                              
                              // Rolle ermitteln (aus Referenz, Zeile 656-680)
                              let roleChar = '-';
                              let bgColor = '#fff';
                              const isGeber = roles.includes('geber') || roles.some(r => r.startsWith('geber+'));
                              
                              // Priorität: Solo > Re > Hochzeit > Kontra
                              if (roles.includes('solo') || roles.includes('geber+solo')) {
                                roleChar = 'S';
                                bgColor = '#ffe6e6';
                              } else if (roles.includes('re') || roles.includes('geber+re')) {
                                roleChar = 'R';
                                bgColor = '#e6f7ff';
                              } else if (roles.includes('hochzeit') || roles.includes('geber+hochzeit')) {
                                roleChar = 'H';
                                bgColor = '#fff0e6';
                              } else if (roles.includes('geber')) {
                                // Bei 5 Spielern sitzt Geber aus (wenn Punkte = 0)
                                if (playerCount === 5 && playerData.points === 0) {
                                  roleChar = '⌀';
                                  bgColor = '#f8f9fa';
                                } else {
                                  roleChar = 'G';
                                  bgColor = '#fff0e6';
                                }
                              } else if (playerData && playerData.points !== 0) {
                                // Kontra (aktiver Spieler ohne spezielle Rolle)
                                roleChar = 'K';
                                bgColor = '#fff0e6';
                              }
                              
                              // Im 4-Spieler-Modus: Geber-Indikator hinzufügen (wenn Geber eine andere Rolle hat)
                              if (playerCount === 4 && isGeber && roleChar !== 'G') {
                                roleChar = '⌀+' + roleChar;
                              }
                              
                              return (
                                <td key={name} style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', backgroundColor: bgColor }}>
                                  <span style={{ fontWeight: 'normal', marginRight: '5px' }}>{roleChar}</span>
                                  <span style={{ fontWeight: 'bold', color: cumulative >= 0 ? '#28a745' : '#dc3545' }}>
                                    {cumulative >= 0 ? '+' : ''}{cumulative}
                                  </span>
                                </td>
                              );
                            })}
                            <td style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'center' }}>
                              <button
                                onClick={() => startEditGame(game)}
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '16px',
                                  backgroundColor: '#ffc107',
                                  color: '#333',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s'
                                }}
                                title={`Spiel ${game.gameNumber} bearbeiten`}
                              >
                                ✍️
                              </button>
                            </td>
                          </tr>
                        );
                      })}
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
