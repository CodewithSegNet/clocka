import React, { useState, useEffect } from 'react';
import { X, HardDrive, Trash2, AlertTriangle } from 'lucide-react';
import { getStorageInfo, getStorageBreakdown, cleanupOldLogs } from '@/utils/imageCompression';
import { toast } from 'sonner';

interface StorageManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StorageManagement({ isOpen, onClose }: StorageManagementProps) {
  const [storageInfo, setStorageInfo] = useState(getStorageInfo());
  const [breakdown, setBreakdown] = useState(getStorageBreakdown());

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  const refreshData = () => {
    setStorageInfo(getStorageInfo());
    setBreakdown(getStorageBreakdown());
  };

  const handleCleanupLogs = () => {
    if (confirm('This will delete attendance logs older than 30 days. Continue?')) {
      const removed = cleanupOldLogs(30);
      toast.success(`Cleaned up ${removed} old logs`);
      refreshData();
    }
  };

  const handleClearAll = () => {
    if (confirm('⚠️ WARNING: This will delete ALL data including students, parents, and attendance logs. This action cannot be undone! Continue?')) {
      if (confirm('Are you absolutely sure? Type YES in the next prompt to confirm.')) {
        const confirmation = prompt('Type YES to confirm:');
        if (confirmation === 'YES') {
          localStorage.clear();
          toast.success('All data cleared');
          window.location.reload();
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
                <HardDrive className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Storage Management</h3>
                <p className="text-sm text-gray-600">Monitor and manage your localStorage usage</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/60 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Storage Overview */}
        <div className="p-6 border-b border-gray-200">
          <div className={`p-4 rounded-xl border-2 ${
            storageInfo.isFull ? 'bg-red-50 border-red-300' :
            storageInfo.isNearLimit ? 'bg-yellow-50 border-yellow-300' :
            'bg-green-50 border-green-300'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {storageInfo.isFull ? (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                ) : storageInfo.isNearLimit ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                ) : (
                  <HardDrive className="w-5 h-5 text-green-600" />
                )}
                <h4 className="font-semibold text-gray-900">Storage Usage</h4>
              </div>
              <span className={`text-2xl font-bold ${
                storageInfo.isFull ? 'text-red-600' :
                storageInfo.isNearLimit ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {storageInfo.usagePercent}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className={`h-3 rounded-full transition-all ${
                  storageInfo.isFull ? 'bg-red-500' :
                  storageInfo.isNearLimit ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(storageInfo.usagePercent, 100)}%` }}
              />
            </div>
            
            <p className="text-sm text-gray-600">
              {storageInfo.totalSizeMB} MB of ~{storageInfo.limitMB} MB used
            </p>
            
            {storageInfo.isFull && (
              <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-sm text-red-800 font-semibold">
                  ⚠️ Storage is FULL! New data cannot be saved.
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Please clean up old data or reduce photo sizes.
                </p>
              </div>
            )}
            
            {storageInfo.isNearLimit && !storageInfo.isFull && (
              <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                <p className="text-sm text-yellow-800 font-semibold">
                  ⚠️ Storage is almost full!
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Consider cleaning up data soon.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Storage Breakdown */}
        <div className="flex-1 overflow-y-auto p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Storage Breakdown</h4>
          <div className="space-y-2">
            {breakdown.map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.key}</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-sm font-semibold text-gray-900">{item.sizeMB} MB</p>
                  <p className="text-xs text-gray-600">{item.percent}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="space-y-3">
            <button
              onClick={handleCleanupLogs}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clean Up Old Logs (30+ days)
            </button>
            
            <button
              onClick={handleClearAll}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear ALL Data (Dangerous!)
            </button>
            
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
          
          <p className="text-xs text-gray-600 mt-4 text-center">
            💡 Tip: Use smaller photos to save storage space. Photos are automatically compressed to reduce size.
          </p>
        </div>
      </div>
    </div>
  );
}
