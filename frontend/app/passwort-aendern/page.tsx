'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function PasswordChangePage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Neue Passwörter stimmen nicht überein');
      return;
    }

    if (newPassword.length < 8) {
      setError('Neues Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    setIsLoading(true);

    try {
      await api.changePassword(currentPassword, newPassword);
      setSuccess('Passwort erfolgreich geändert!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Ändern des Passworts');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px', backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', maxWidth: '600px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#0056b3', margin: 0 }}>Passwort ändern</h1>
            <Link href="/" style={{ padding: '10px 20px', backgroundColor: '#0056b3', color: 'white', textDecoration: 'none', borderRadius: '5px', fontSize: '14px', fontWeight: 'bold' }}>
              🏠 Startseite
            </Link>
          </div>

          {error && (
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#ffe6e6', color: '#d32f2f', borderRadius: '4px' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e6ffe6', color: '#28a745', borderRadius: '4px' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Aktuelles Passwort:</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Neues Passwort:</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px' }}
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Mindestens 8 Zeichen
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Neues Passwort bestätigen:</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                />
                <span style={{ fontSize: '14px' }}>Passwörter anzeigen</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{ width: '100%', padding: '12px', backgroundColor: isLoading ? '#ccc' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              {isLoading ? 'Ändere Passwort...' : 'Passwort ändern'}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
