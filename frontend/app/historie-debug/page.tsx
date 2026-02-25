'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';

export default function HistorieDebugPage() {
  const { isAuthenticated, currentUser, isLoading, accessToken } = useAuth();
  const [apiResult, setApiResult] = useState<string>('');

  useEffect(() => {
    console.log('HistorieDebug mounted');
    console.log('isLoading:', isLoading);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('currentUser:', currentUser);
    console.log('accessToken:', accessToken ? 'EXISTS' : 'MISSING');
  }, [isLoading, isAuthenticated, currentUser, accessToken]);

  const testAPI = async () => {
    try {
      setApiResult('Loading...');
      const response = await fetch('https://x6qfjkcjzj.execute-api.eu-central-1.amazonaws.com/Prod/spieltage', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      const data = await response.json();
      setApiResult(JSON.stringify(data, null, 2));
    } catch (error: any) {
      setApiResult(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Historie Debug</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f4f4f4', borderRadius: '4px' }}>
        <h2>Auth Status:</h2>
        <p>Loading: {isLoading ? 'YES' : 'NO'}</p>
        <p>Authenticated: {isAuthenticated ? 'YES' : 'NO'}</p>
        <p>User: {currentUser ? currentUser.email : 'NONE'}</p>
        <p>Token: {accessToken ? 'EXISTS' : 'MISSING'}</p>
      </div>

      <button onClick={testAPI} style={{ padding: '10px 20px', fontSize: '16px' }}>
        Test API
      </button>

      <pre style={{ marginTop: '20px', background: '#f4f4f4', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
        {apiResult}
      </pre>
    </div>
  );
}
