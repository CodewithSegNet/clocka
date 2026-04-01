import React, { useState } from 'react';
import { X, Copy, Check, Key, User, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ParentCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: {
    parentName: string;
    parentType: 'father' | 'mother';
    parentId: string;
    password: string;
  };
}

export default function ParentCredentialsModal({
  isOpen,
  onClose,
  credentials
}: ParentCredentialsModalProps) {
  const [copiedField, setCopiedField] = useState<'parentId' | 'password' | null>(null);

  // Don't render if modal is closed or credentials are invalid
  if (!isOpen || !credentials.parentId || !credentials.password) return null;

  const handleCopy = (text: string, field: 'parentId' | 'password') => {
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopiedField(field);
          toast.success(`${field === 'parentId' ? 'Parent ID' : 'Password'} copied to clipboard!`);
          setTimeout(() => setCopiedField(null), 2000);
        })
        .catch(() => {
          // Fallback if clipboard API fails
          fallbackCopy(text, field);
        });
    } else {
      // Use fallback for non-secure contexts or when clipboard API is blocked
      fallbackCopy(text, field);
    }
  };

  const fallbackCopy = (text: string, field: 'parentId' | 'password') => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopiedField(field);
        toast.success(`${field === 'parentId' ? 'Parent ID' : 'Password'} copied to clipboard!`);
        setTimeout(() => setCopiedField(null), 2000);
      } else {
        toast.error('Failed to copy. Please select and copy manually.');
      }
    } catch (err) {
      toast.error('Failed to copy. Please select and copy manually.');
    } finally {
      document.body.removeChild(textArea);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full pointer-events-auto animate-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-5 rounded-t-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold">Parent Account Created!</h2>
                </div>
                <p className="text-green-50">
                  {credentials.parentType === 'father' ? '👨 Father' : '👩 Mother'} • {credentials.parentName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Warning Banner */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900 mb-1">⚠️ Temporary Password</p>
                <p className="text-sm text-amber-800">
                  This password will only be shown once. Parents can change it anytime from their profile.
                  Please save or share these credentials securely with the parent.
                </p>
              </div>
            </div>

            {/* Parent ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Parent ID (Login Username)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={credentials.parentId}
                  readOnly
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border-2 border-gray-300 rounded-lg font-mono text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 select-all"
                />
                <button
                  onClick={() => handleCopy(credentials.parentId, 'parentId')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Copy Parent ID"
                >
                  {copiedField === 'parentId' ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Temporary Password
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={credentials.password}
                  readOnly
                  className="w-full px-4 py-3 pr-12 bg-green-50 border-2 border-green-400 rounded-lg font-mono text-lg font-bold text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 select-all"
                />
                <button
                  onClick={() => handleCopy(credentials.password, 'password')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-green-100 rounded-lg transition-colors"
                  title="Copy Password"
                >
                  {copiedField === 'password' ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-green-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">📝 Instructions for Parent:</p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Use the Parent ID above as your username</li>
                <li>Use the temporary password to login</li>
                <li>You can change your password anytime from your profile</li>
                <li>Choose a strong password that only you know</li>
              </ol>
            </div>

            {/* Security Notice */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600">
                🔒 <strong>Security Notice:</strong> School administrators cannot view or reset parent passwords 
                after the initial creation. Parents must keep their passwords secure.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex gap-3">
            <button
              onClick={() => {
                handleCopy(`Parent ID: ${credentials.parentId}\nPassword: ${credentials.password}`, 'parentId');
              }}
              className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold inline-flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Both
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}