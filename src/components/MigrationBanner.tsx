import React, { useState } from 'react';
import { Database, Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { migrateToSupabase, isMigrated, testConnection } from '@/utils/supabaseApi';
import { toast } from 'sonner';

interface MigrationBannerProps {
  schoolCode: string;
  onMigrationComplete: () => void;
}

export default function MigrationBanner({ schoolCode, onMigrationComplete }: MigrationBannerProps) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [showBanner, setShowBanner] = useState(!isMigrated());

  if (!showBanner) return null;

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      const result = await migrateToSupabase(schoolCode);
      toast.success(`Migration successful! Migrated ${result.migrated.students} students, ${result.migrated.parents} parents, ${result.migrated.families} families, and ${result.migrated.logs} attendance logs.`);
      setShowBanner(false);
      onMigrationComplete();
    } catch (error: any) {
      console.error('Migration error:', error);
      toast.error(`Migration failed: ${error.message || 'Unknown error'}`);
      
      // Show detailed error to help with debugging
      alert(`Migration Error Details:\n\n${error.message || error}\n\nCheck browser console for more information.`);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 border-2 border-blue-700 rounded-xl p-6 mb-6 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Database className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upgrade to Cloud Database
          </h3>
          <p className="text-blue-100 text-sm mb-4 leading-relaxed">
            Your data is currently stored locally in your browser. Migrate to Supabase cloud database for:
          </p>
          <div className="grid md:grid-cols-2 gap-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-white">
              <CheckCircle className="w-4 h-4 text-green-300" />
              <span>Access from any device</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white">
              <CheckCircle className="w-4 h-4 text-green-300" />
              <span>Real-time sync</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white">
              <CheckCircle className="w-4 h-4 text-green-300" />
              <span>Unlimited storage</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white">
              <CheckCircle className="w-4 h-4 text-green-300" />
              <span>Better performance</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleMigrate}
              disabled={isMigrating}
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
            >
              {isMigrating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Migrate to Cloud
                </>
              )}
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="px-4 py-2 text-white/80 hover:text-white text-sm font-medium"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}