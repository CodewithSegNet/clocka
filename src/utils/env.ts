/**
 * Environment variable validation and access
 * Ensures all required env vars are present
 */

interface EnvConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  PROJECT_ID: string;
  MODE: string;
  DEV: boolean;
  PROD: boolean;
}

function validateEnv(): EnvConfig {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || '';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || `https://${projectId}.supabase.co`;

  // Validate in production
  if (import.meta.env.PROD) {
    if (!projectId || projectId === 'PASTE_YOUR_PROJECT_ID_HERE') {
      console.error('Missing or invalid VITE_SUPABASE_PROJECT_ID in production');
    }
    
    if (!anonKey || anonKey === 'PASTE_YOUR_SUPABASE_ANON_KEY_HERE') {
      console.error('Missing or invalid VITE_SUPABASE_ANON_KEY in production');
    }
  }

  return {
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: anonKey,
    PROJECT_ID: projectId,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD
  };
}

export const env = validateEnv();

export function isProduction(): boolean {
  return env.PROD;
}

export function isDevelopment(): boolean {
  return env.DEV;
}
