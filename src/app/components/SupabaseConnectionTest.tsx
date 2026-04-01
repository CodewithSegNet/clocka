import React, { useState, useEffect } from 'react';
import { testConnection } from '@/utils/supabaseApi';
import { projectId, publicAnonKey } from '@/utils/supabase/info';

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking');
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setStatus('checking');
    setError('');
    
    try {
      console.log('🔍 Testing Supabase connection...');
      console.log('📍 Project ID:', projectId);
      console.log('🔑 Anon Key:', publicAnonKey ? '✓ Present' : '✗ Missing');
      
      // Test the connection
      const result = await testConnection();
      
      console.log('✅ Connection test result:', result);
      setStatus('connected');
      setDetails(result);
    } catch (err: any) {
      console.error('❌ Connection test failed:', err);
      setStatus('disconnected');
      setError(err.message || 'Connection failed');
      
      // Check if it's a deployment issue
      if (err.message?.includes('Failed to fetch') || err.message?.includes('timeout')) {
        setDetails({
          issue: 'Edge Function not deployed or not responding',
          solution: 'The Supabase Edge Function needs to be deployed',
          url: `https://${projectId}.supabase.co/functions/v1/make-server-17b9cebd/test`
        });
      }
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl p-6 max-w-md z-50 border-2 border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Supabase Connection Status</h3>
        <button
          onClick={checkConnection}
          className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retest
        </button>
      </div>

      <div className="space-y-3">
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            status === 'connected' ? 'bg-green-500 animate-pulse' :
            status === 'disconnected' ? 'bg-red-500' :
            status === 'checking' ? 'bg-yellow-500 animate-pulse' :
            'bg-gray-500'
          }`} />
          <span className="font-medium">
            {status === 'connected' ? '✅ Connected' :
             status === 'disconnected' ? '❌ Disconnected' :
             status === 'checking' ? '🔄 Checking...' :
             '⚠️ Error'}
          </span>
        </div>

        {/* Configuration */}
        <div className="text-sm space-y-1 bg-gray-50 p-3 rounded">
          <div><strong>Project ID:</strong> {projectId}</div>
          <div><strong>Anon Key:</strong> {publicAnonKey ? '✓ Configured' : '✗ Missing'}</div>
          <div><strong>Endpoint:</strong> <code className="text-xs bg-white px-1">{`/functions/v1/make-server-17b9cebd`}</code></div>
        </div>

        {/* Error Details */}
        {error && (
          <div className="text-sm bg-red-50 border border-red-200 p-3 rounded">
            <strong className="text-red-700">Error:</strong>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Details */}
        {details && status === 'disconnected' && (
          <div className="text-sm bg-yellow-50 border border-yellow-200 p-3 rounded">
            <strong className="text-yellow-800">Issue:</strong>
            <p className="text-yellow-700 mt-1">{details.issue}</p>
            <p className="text-yellow-700 mt-2"><strong>Solution:</strong> {details.solution}</p>
            <p className="text-xs text-yellow-600 mt-2 font-mono break-all">{details.url}</p>
          </div>
        )}

        {details && status === 'connected' && (
          <div className="text-sm bg-green-50 border border-green-200 p-3 rounded">
            <strong className="text-green-800">✅ Backend is running!</strong>
            <pre className="text-xs mt-2 bg-white p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(details, null, 2)}
            </pre>
          </div>
        )}

        {/* Deployment Instructions */}
        {status === 'disconnected' && (
          <div className="text-xs bg-blue-50 border border-blue-200 p-3 rounded">
            <strong className="text-blue-800">📋 Deployment Steps:</strong>
            <ol className="mt-2 space-y-1 text-blue-700 list-decimal list-inside">
              <li>Open <a href={`https://supabase.com/dashboard/project/${projectId}`} target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a></li>
              <li>Navigate to "Edge Functions" section</li>
              <li>Deploy the <code className="bg-white px-1">make-server-17b9cebd</code> function</li>
              <li>Wait for deployment to complete (1-2 minutes)</li>
              <li>Click "Retest" above to verify connection</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
