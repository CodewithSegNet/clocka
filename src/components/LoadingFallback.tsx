import React from 'react';
import clockaLogo from 'figma:asset/c6c92aab0f7d59ff7afbce0ebd8b122d9715bdde.png';

export function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8 animate-bounce">
          <img 
            src={clockaLogo} 
            alt="Clocka" 
            className="w-24 h-24 mx-auto"
          />
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
        </div>
        
        <p className="text-gray-600 font-medium">Loading Clocka...</p>
      </div>
    </div>
  );
}

export function PageLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
