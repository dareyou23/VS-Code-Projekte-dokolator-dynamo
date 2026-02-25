'use client';

export default function SimpleTestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple Test</h1>
      <p>If you see this, React is working!</p>
      <button onClick={() => alert('Button works!')}>
        Test Button
      </button>
    </div>
  );
}
