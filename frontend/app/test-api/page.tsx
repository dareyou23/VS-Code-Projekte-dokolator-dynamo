'use client';

import { useState } from 'react';

export default function TestApiPage() {
  const [result, setResult] = useState<string>('');

  const testDirect = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      setResult(`Token: ${token ? 'Vorhanden' : 'FEHLT!'}\n\n`);
      
      const response = await fetch('https://x6qfjkcjzj.execute-api.eu-central-1.amazonaws.com/Prod/spieltage', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      setResult(prev => prev + `Status: ${response.status}\n\n`);
      
      const data = await response.json();
      setResult(prev => prev + `Response:\n${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      setResult(prev => prev + `Error: ${error.message}`);
    }
  };

  const testProxy = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      setResult(`Token: ${token ? 'Vorhanden' : 'FEHLT!'}\n\n`);
      
      const response = await fetch('/api/proxy/spieltage', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      setResult(prev => prev + `Status: ${response.status}\n\n`);
      
      const data = await response.json();
      setResult(prev => prev + `Response:\n${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      setResult(prev => prev + `Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>API Test</h1>
      <button onClick={testDirect} style={{ marginRight: '10px', padding: '10px' }}>
        Test Direct API
      </button>
      <button onClick={testProxy} style={{ padding: '10px' }}>
        Test Proxy API
      </button>
      <pre style={{ marginTop: '20px', background: '#f4f4f4', padding: '10px', borderRadius: '4px' }}>
        {result}
      </pre>
    </div>
  );
}
