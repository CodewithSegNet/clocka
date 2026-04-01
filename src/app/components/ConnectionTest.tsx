import { useState } from 'react';

/**
 * Connection Test Component
 * Use this to verify your Supabase Edge Function is deployed and working
 */
export function ConnectionTest() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [message, setMessage] = useState('');

  const testConnection = async () => {
    setStatus('testing');
    setMessage('Testing connection...');

    try {
      // Test the health endpoint
      const healthUrl = 'https://tfckmsqustixddizmtet.supabase.co/functions/v1/make-server-17b9cebd/health';
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'ok') {
          setStatus('success');
          setMessage('✅ Connected! Supabase Edge Function is working correctly.');
        } else {
          setStatus('failed');
          setMessage('⚠️ Connection established but unexpected response.');
        }
      } else {
        setStatus('failed');
        setMessage(`❌ Connection failed with status: ${response.status}`);
      }
    } catch (error: any) {
      setStatus('failed');
      setMessage(`❌ Connection failed: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">Backend Connection Test</h3>
        
        <button
          onClick={testConnection}
          disabled={status === 'testing'}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
        >
          {status === 'testing' ? 'Testing...' : 'Test Connection'}
        </button>

        {message && (
          <div className={`text-sm p-2 rounded ${
            status === 'success' ? 'bg-green-50 text-green-800' :
            status === 'failed' ? 'bg-red-50 text-red-800' :
            'bg-gray-50 text-gray-800'
          }`}>
            {message}
          </div>
        )}

        <details className="mt-3 text-xs text-gray-600">
          <summary className="cursor-pointer font-medium">Setup Instructions</summary>
          <div className="mt-2 space-y-1">
            <p>1. Create database table (see SUPABASE_SETUP_GUIDE.md)</p>
            <p>2. Deploy Edge Function</p>
            <p>3. Set environment variables</p>
            <p>4. Test with this button</p>
          </div>
        </details>
      </div>
    </div>
  );
}
