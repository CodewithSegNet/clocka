import React, { useEffect, useState } from 'react';
import { WifiOff, Cloud } from 'lucide-react';

export function OfflineIndicator() {
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Check if we're in offline mode by checking localStorage
    const checkOfflineMode = () => {
      const hasRecentErrors = sessionStorage.getItem('supabaseConnectionFailed');
      setShowIndicator(hasRecentErrors === 'true');
    };

    checkOfflineMode();
    
    // Check periodically
    const interval = setInterval(checkOfflineMode, 10000);

    return () => clearInterval(interval);
  }, []);

  if (!showIndicator) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3 shadow-lg max-w-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
          <WifiOff className="w-5 h-5 text-yellow-700" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-900 mb-1">
            Offline Mode
          </h3>
          <p className="text-xs text-yellow-800">
            Backend connection unavailable. Using local data. Changes will sync when connection is restored.
          </p>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem('supabaseConnectionFailed');
            setShowIndicator(false);
          }}
          className="text-yellow-600 hover:text-yellow-800"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
