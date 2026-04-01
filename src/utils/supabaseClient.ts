// Supabase Real-time Client for Frontend
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '@/utils/supabase/info';

// Create Supabase client for real-time subscriptions
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Helper function to get school code
export const getSchoolCode = () => {
  return localStorage.getItem('schoolCode') || '';
};
