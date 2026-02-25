'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  rolle: string;
  aktiv: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  
  const { logout } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.listUsers('user');
      if (response.success && response.data) {
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await api.createUser(newEmail, newPassword, 'user');
      if (response.success) {
        setSuccess(`User ${newEmail} erfolgreich erstellt!`);
        setNewEmail('');
        setNewPassword('');
        await loadUsers(); // await hinzugefügt
      } else {
        setError(response.error || 'Fehler beim Erstellen des Users');
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen des Users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`User ${email} wirklich löschen?`)) return;

    try {
      const response = await api.deleteUser(userId);
      if (response.success) {
        setSuccess(`User ${email} gelöscht`);
        await loadUsers(); // await hinzugefügt
      } else {
        setError(response.error || 'Fehler beim Löschen');
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Löschen');
    }
  };

  const handleEditEmail = (userId: string, currentEmail: string) => {
    setEditingUserId(userId);
    setEditEmail(currentEmail);
    setError('');
    setSuccess('');
  };

  const handleSaveEmail = async (userId: string) => {
    if (!editEmail || !editEmail.includes('@')) {
      setError('Bitte gültige E-Mail-Adresse eingeben');
      return;
    }

    try {
      const response = await api.updateUser(userId, editEmail);
      if (response.success) {
        setSuccess('E-Mail-Adresse erfolgreich geändert');
        setEditingUserId(null);
        setEditEmail('');
        await loadUsers();
      } else {
        setError(response.error || 'Fehler beim Ändern der E-Mail');
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Ändern der E-Mail');
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditEmail('');
    setError('');
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px', backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#0056b3', margin: 0 }}>User-Verwaltung</h1>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link href="/admin" style={{ padding: '10px 20px', backgroundColor: '#6f42c1', color: 'white', textDecoration: 'none', borderRadius: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                👑 Admin-Verwaltung
              </Link>
              <Link href="/" style={{ padding: '10px 20px', backgroundColor: '#0056b3', color: 'white', textDecoration: 'none', borderRadius: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                🏠 Startseite
              </Link>
              <button onClick={logout} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
                Abmelden
              </button>
            </div>
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

          <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
            <h2 style={{ color: '#0056b3', marginBottom: '20px' }}>Neuen User hinzufügen</h2>
            <form onSubmit={handleAddUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>E-Mail:</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Passwort:</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{ padding: '10px 20px', backgroundColor: isLoading ? '#ccc' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer' }}
                >
                  {isLoading ? 'Erstelle...' : 'Hinzufügen'}
                </button>
              </div>
            </form>
          </div>

          <div>
            <h2 style={{ color: '#0056b3', marginBottom: '20px' }}>Bestehende Users ({users.length})</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>E-Mail</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Status</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Erstellt am</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', width: '180px' }}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                      {editingUserId === user.id ? (
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            style={{ flex: 1, padding: '6px', border: '1px solid #ccc', borderRadius: '3px' }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEmail(user.id)}
                            style={{ padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            style={{ padding: '6px 12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        user.email
                      )}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                      <span style={{ padding: '4px 8px', backgroundColor: user.aktiv ? '#e6ffe6' : '#ffe6e6', color: user.aktiv ? '#28a745' : '#d32f2f', borderRadius: '3px', fontSize: '12px' }}>
                        {user.aktiv ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                      {new Date(user.createdAt).toLocaleDateString('de-DE')}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                      {editingUserId === user.id ? null : (
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEditEmail(user.id, user.email)}
                            style={{ padding: '6px 12px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            E-Mail ändern
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Löschen
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
