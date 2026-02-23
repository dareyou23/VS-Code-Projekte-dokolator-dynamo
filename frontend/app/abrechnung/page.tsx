'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import type { GameData, Spieltag } from '@/lib/types';

// Feste Spieler-Reihenfolge für Abrechnung
const PLAYER_ORDER = ['Benno', 'Bernd', 'Gregor', 'Markus', 'Peter'];

export default function Abrechnung() {
  const [currentSpieltag, setCurrentSpieltag] = useState<Spieltag | null>(null);
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Editierbare Werte
  const [tageseinsatz, setTageseinsatz] = useState(15.00);
  const [punktwert, setPunktwert] = useState(0.05);
  
  // Edit-Modus für Inputs
  const [editingTageseinsatz, setEditingTageseinsatz] = useState(false);
  const [editingPunktwert, setEditingPunktwert] = useState(false);

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
        const sortedGames = (spieltagData.games || []).sort((a, b) => a.gameNumber - b.gameNumber);
        setGames(sortedGames);
      }
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  };

  // Berechne Endergebnisse für alle Spieler
  const calculateResults = () => {
    const results: { [key: string]: number } = {};
    
    PLAYER_ORDER.forEach(name => {
      const totalPoints = games.reduce((sum, game) => {
        return sum + (game.players[name]?.points || 0);
      }, 0);
      results[name] = totalPoints;
    });
    
    return results;
  };

  // Berechne Zahlungen
  const calculatePayments = () => {
    const results = calculateResults();
    const payments: { [key: string]: number } = {};
    
    // Finde den Gewinner (höchste Punktzahl)
    const maxPoints = Math.max(...Object.values(results));
    
    PLAYER_ORDER.forEach(name => {
      const points = results[name] || 0;
      
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

  const results = calculateResults();
  const payments = calculatePayments();
  
  // Finde Gewinner (höchste Punktzahl = niedrigste Zahlung) und Verlierer (niedrigste Punktzahl = höchste Zahlung)
  const sortedByPoints = PLAYER_ORDER.map(name => ({
    name,
    points: results[name],
    payment: payments[name]
  })).sort((a: { name: string; points: number; payment: number }, b: { name: string; points: number; payment: number }) => b.points - a.points);
  
  const winner = sortedByPoints[0]; // Höchste Punktzahl
  const loser = sortedByPoints[sortedByPoints.length - 1]; // Niedrigste Punktzahl

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f4f4' }}>
        <div style={{ fontSize: '20px', color: '#666' }}>Lade...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px', backgroundColor: '#f4f4f4', color: '#333', minHeight: '100vh' }}>
      <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header mit Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#0056b3', margin: 0 }}>💰 Abrechnung</h1>
          <Link href="/" style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '5px', fontSize: '14px' }}>
            ← Zurück zum Spiel
          </Link>
        </div>

        {!currentSpieltag ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>Kein aktiver Spieltag</p>
            <p>Starte einen Spieltag, um die Abrechnung zu sehen</p>
          </div>
        ) : (
          <>
            {/* Einstellungen */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '2px solid #e9ecef' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#495057' }}>⚙️ Einstellungen</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#495057' }}>
                    Tageseinsatz (€)
                  </label>
                  {editingTageseinsatz ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="number"
                        step="0.01"
                        value={tageseinsatz}
                        onChange={(e) => setTageseinsatz(parseFloat(e.target.value) || 0)}
                        style={{ flex: 1, padding: '8px', border: '2px solid #0056b3', borderRadius: '5px', fontSize: '16px' }}
                        autoFocus
                      />
                      <button
                        onClick={() => setEditingTageseinsatz(false)}
                        style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditingTageseinsatz(true)}
                      style={{ padding: '10px', backgroundColor: 'white', border: '2px solid #dee2e6', borderRadius: '5px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', color: '#0056b3' }}
                    >
                      {tageseinsatz.toFixed(2)} €
                    </div>
                  )}
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#495057' }}>
                    Punktwert (€)
                  </label>
                  {editingPunktwert ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="number"
                        step="0.01"
                        value={punktwert}
                        onChange={(e) => setPunktwert(parseFloat(e.target.value) || 0)}
                        style={{ flex: 1, padding: '8px', border: '2px solid #0056b3', borderRadius: '5px', fontSize: '16px' }}
                        autoFocus
                      />
                      <button
                        onClick={() => setEditingPunktwert(false)}
                        style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditingPunktwert(true)}
                      style={{ padding: '10px', backgroundColor: 'white', border: '2px solid #dee2e6', borderRadius: '5px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', color: '#0056b3' }}
                    >
                      {punktwert.toFixed(2)} €
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Abrechnungstabelle */}
            <div style={{ overflowX: 'auto', marginBottom: '30px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0056b3', color: 'white' }}>
                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '16px', fontWeight: 'bold' }}>Spieler</th>
                    {PLAYER_ORDER.map(name => (
                      <th key={name} style={{ padding: '15px', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>{name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Zeile 1: Ergebnis (Punkte) */}
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold', fontSize: '15px', borderBottom: '1px solid #dee2e6' }}>
                      📊 Ergebnis (Punkte)
                    </td>
                    {PLAYER_ORDER.map(name => {
                      const points = results[name] || 0;
                      return (
                        <td
                          key={name}
                          style={{
                            padding: '15px',
                            textAlign: 'center',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: points >= 0 ? '#28a745' : '#dc3545',
                            borderBottom: '1px solid #dee2e6'
                          }}
                        >
                          {points >= 0 ? '+' : ''}{points}
                        </td>
                      );
                    })}
                  </tr>
                  
                  {/* Zeile 2: Zu zahlen */}
                  <tr style={{ backgroundColor: 'white' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold', fontSize: '15px' }}>
                      💶 Zu zahlen
                    </td>
                    {PLAYER_ORDER.map(name => {
                      const payment = payments[name] || 0;
                      const isWinner = name === winner.name;
                      const isLoser = name === loser.name;
                      
                      return (
                        <td
                          key={name}
                          style={{
                            padding: '15px',
                            textAlign: 'center',
                            fontSize: '22px',
                            fontWeight: 'bold',
                            color: isWinner ? '#28a745' : isLoser ? '#dc3545' : '#6c757d',
                            backgroundColor: isWinner ? '#d4edda' : isLoser ? '#f8d7da' : 'white',
                            position: 'relative'
                          }}
                        >
                          {payment.toFixed(2)} €
                          {isWinner && <div style={{ fontSize: '12px', color: '#155724', marginTop: '5px' }}>🏆 Gewinner</div>}
                          {isLoser && <div style={{ fontSize: '12px', color: '#721c24', marginTop: '5px' }}>😢 Verlierer</div>}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Zusammenfassung */}
            <div style={{ backgroundColor: '#e7f3ff', padding: '20px', borderRadius: '8px', border: '2px solid #0056b3', marginBottom: '30px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#0056b3' }}>📋 Zusammenfassung</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', fontSize: '14px' }}>
                <div>
                  <div style={{ color: '#6c757d', marginBottom: '5px' }}>Anzahl Spiele:</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0056b3' }}>{games.length}</div>
                </div>
                <div>
                  <div style={{ color: '#6c757d', marginBottom: '5px' }}>Gesamteinsatz:</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0056b3' }}>
                    {(tageseinsatz * PLAYER_ORDER.length).toFixed(2)} €
                  </div>
                </div>
                <div>
                  <div style={{ color: '#6c757d', marginBottom: '5px' }}>Gesamtauszahlung:</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0056b3' }}>
                    {Object.values(payments).reduce((sum, p) => sum + p, 0).toFixed(2)} €
                  </div>
                </div>
              </div>
            </div>

            {/* Rollen-Statistik */}
            <div style={{ backgroundColor: '#fff9e6', padding: '20px', borderRadius: '8px', border: '2px solid #ffc107' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#856404' }}>🎭 Rollen-Statistik</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                <thead>
                  <tr style={{ backgroundColor: '#ffc107' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', border: '1px solid #ddd' }}>Rolle</th>
                    {PLAYER_ORDER.map(name => (
                      <th key={name} style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', border: '1px solid #ddd' }}>{name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['re', 'solo', 'hochzeit'].map((role, index) => {
                    const roleLabel = role === 're' ? 'Re' : role === 'solo' ? 'Solo' : 'Hochzeit';
                    const bgColor = index % 2 === 0 ? '#fff' : '#f8f9fa';
                    
                    return (
                      <tr key={role} style={{ backgroundColor: bgColor }}>
                        <td style={{ padding: '12px', fontWeight: 'bold', border: '1px solid #ddd' }}>{roleLabel}</td>
                        {PLAYER_ORDER.map(name => {
                          // Zähle wie oft dieser Spieler diese Rolle hatte
                          const count = games.reduce((sum, game) => {
                            const playerData = game.players[name];
                            if (!playerData) return sum;
                            
                            const roles = playerData.roles || [];
                            const hasRole = roles.some(r => 
                              r === role || 
                              r === `geber+${role}` ||
                              (role === 're' && (r === 're' || r === 'geber+re'))
                            );
                            
                            return sum + (hasRole ? 1 : 0);
                          }, 0);
                          
                          return (
                            <td key={name} style={{ padding: '12px', textAlign: 'center', fontSize: '16px', fontWeight: 'bold', color: '#0056b3', border: '1px solid #ddd' }}>
                              {count}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {/* Kontra-Zeile (alle Spiele ohne Re/Solo/Hochzeit) */}
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', border: '1px solid #ddd' }}>Kontra</td>
                    {PLAYER_ORDER.map(name => {
                      const count = games.reduce((sum, game) => {
                        const playerData = game.players[name];
                        if (!playerData) return sum;
                        
                        const roles = playerData.roles || [];
                        // Kontra = keine spezielle Rolle (nicht Re, Solo, Hochzeit, nur Geber oder leer)
                        const isKontra = roles.length === 0 || 
                                        (roles.length === 1 && roles[0] === 'geber') ||
                                        (!roles.some(r => r.includes('re') || r.includes('solo') || r.includes('hochzeit')));
                        
                        // Nur zählen wenn Spieler Punkte hat (also aktiv war)
                        return sum + (isKontra && playerData.points !== 0 ? 1 : 0);
                      }, 0);
                      
                      return (
                        <td key={name} style={{ padding: '12px', textAlign: 'center', fontSize: '16px', fontWeight: 'bold', color: '#0056b3', border: '1px solid #ddd' }}>
                          {count}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
