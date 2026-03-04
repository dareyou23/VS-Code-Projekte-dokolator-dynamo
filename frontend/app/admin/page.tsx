'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function AdminPage() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const response = await api.listUsers('admin');
      if (response.success && response.data) {
        setAdmins(response.data.users);
      }
    } catch (err) {
      console.error('Failed to load admins:', err);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await api.createUser(newEmail, newPassword, 'admin');
      if (response.success) {
        setSuccess(`Admin ${newEmail} erfolgreich erstellt!`);
        setNewEmail('');
        setNewPassword('');
        await loadAdmins(); // await hinzugefügt
      } else {
        setError(response.error || 'Fehler beim Erstellen des Admins');
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen des Admins');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdmin = async (userId: string, email: string) => {
    if (!confirm(`Admin ${email} wirklich löschen?`)) return;

    try {
      const response = await api.deleteUser(userId);
      if (response.success) {
        setSuccess(`Admin ${email} gelöscht`);
        await loadAdmins(); // await hinzugefügt
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
        await loadAdmins();
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

  const handleResetPassword = (userId: string) => {
    setResetPasswordUserId(userId);
    setResetPassword('');
    setShowPassword(false);
    setError('');
    setSuccess('');
  };

  const handleSavePassword = async (userId: string, email: string) => {
    if (!resetPassword || resetPassword.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    try {
      const response = await api.adminResetPassword(userId, resetPassword);
      if (response.success) {
        setSuccess(`Passwort für ${email} erfolgreich geändert. Admin muss beim nächsten Login das Passwort ändern.`);
        setResetPasswordUserId(null);
        setResetPassword('');
      } else {
        setError(response.error || 'Fehler beim Ändern des Passworts');
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Ändern des Passworts');
    }
  };

  const handleCancelPasswordReset = () => {
    setResetPasswordUserId(null);
    setResetPassword('');
    setError('');
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px', backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#0056b3', margin: 0 }}>Admin-Verwaltung</h1>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link href="/users" style={{ padding: '10px 20px', backgroundColor: '#6f42c1', color: 'white', textDecoration: 'none', borderRadius: '5px', fontSize: '14px', fontWeight: 'bold' }}>
                👥 User-Verwaltung
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
            <h2 style={{ color: '#0056b3', marginBottom: '20px' }}>Neuen Admin hinzufügen</h2>
            <form onSubmit={handleAddAdmin}>
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
            <h2 style={{ color: '#0056b3', marginBottom: '20px' }}>Bestehende Admins ({admins.length})</h2>
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
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                      {editingUserId === admin.id ? (
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            style={{ flex: 1, padding: '6px', border: '1px solid #ccc', borderRadius: '3px' }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEmail(admin.id)}
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
                        admin.email
                      )}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                      <span style={{ padding: '4px 8px', backgroundColor: admin.aktiv ? '#e6ffe6' : '#ffe6e6', color: admin.aktiv ? '#28a745' : '#d32f2f', borderRadius: '3px', fontSize: '12px' }}>
                        {admin.aktiv ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                      {new Date(admin.createdAt).toLocaleDateString('de-DE')}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                      {editingUserId === admin.id ? null : resetPasswordUserId === admin.id ? (
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={resetPassword}
                              onChange={(e) => setResetPassword(e.target.value)}
                              placeholder="Neues Passwort (min. 8 Zeichen)"
                              style={{ width: '100%', padding: '6px 30px 6px 6px', border: '1px solid #ccc', borderRadius: '3px', fontSize: '12px' }}
                              autoFocus
                            />
                            <button
                              onClick={() => setShowPassword(!showPassword)}
                              style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                            >
                              {showPassword ? '🙈' : '👁️'}
                            </button>
                          </div>
                          <button
                            onClick={() => handleSavePassword(admin.id, admin.email)}
                            style={{ padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancelPasswordReset}
                            style={{ padding: '6px 12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleEditEmail(admin.id, admin.email)}
                            style={{ padding: '6px 12px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            E-Mail ändern
                          </button>
                          <button
                            onClick={() => handleResetPassword(admin.id)}
                            style={{ padding: '6px 12px', backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                          >
                            🔑 Passwort ändern
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(admin.id, admin.email)}
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
