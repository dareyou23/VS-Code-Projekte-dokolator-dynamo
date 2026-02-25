'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('=== LOGIN START ===');
      console.log('Email:', email);
      console.log('apiClient:', apiClient);
      const response = await apiClient.login(email, password);
      console.log('=== LOGIN RESPONSE ===', response);
      
      if (response.success && response.data) {
        const { user } = response.data;
        
        // Check if password change is required
        if (user.passwordChangeRequired) {
          router.push('/passwort-aendern');
          return;
        }
        
        // Redirect based on role
        if (user.rolle === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        setError(response.error || 'Login fehlgeschlagen');
      }
    } catch (err) {
      console.error('=== LOGIN ERROR ===', err);
      setError('Verbindungsfehler. Bitte versuche es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f4f4' }}>
      <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', maxWidth: '500px', width: '100%', position: 'relative', overflow: 'visible' }}>
        <div style={{ textAlign: 'center', marginBottom: '-10px' }}>
          <h1 style={{ color: '#0056b3', margin: 0, fontSize: '36px', fontWeight: 'bold' }}>Dokolator Login</h1>
        </div>
        
        <div style={{ position: 'relative', marginBottom: '-180px', marginTop: '10px' }}>
          <img 
            src="/Doko-Runde.png" 
            alt="Doko-Runde" 
            style={{ 
              width: '100%',
              maxWidth: '500px',
              height: 'auto', 
              display: 'block',
              margin: '0 auto',
              position: 'relative',
              zIndex: 1
            }} 
          />
        </div>
        
        <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 2, paddingTop: '200px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>E-Mail:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px', backgroundColor: '#fff' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Passwort:</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', paddingRight: '40px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px', backgroundColor: '#fff' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#ffe6e6', color: '#d32f2f', borderRadius: '4px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px', backgroundColor: loading ? '#ccc' : '#0056b3', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  );
}
