/**
 * Health check utility for monitoring application and backend status
 */

import { supabase } from './supabaseClient';
import { logger } from './logger';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    frontend: boolean;
    backend: boolean;
    database: boolean;
    localStorage: boolean;
  };
  latency?: {
    database: number;
    backend: number;
  };
  version: string;
}

/**
 * Check if localStorage is available and working
 */
function checkLocalStorage(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check database connectivity and latency
 */
async function checkDatabase(): Promise<{ isHealthy: boolean; latency: number }> {
  const startTime = performance.now();

  try {
    // Simple query to test database connection
    const { error } = await supabase
      .from('kv_store_17b9cebd')
      .select('key')
      .limit(1);

    const latency = performance.now() - startTime;

    return {
      isHealthy: !error,
      latency,
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      isHealthy: false,
      latency: -1,
    };
  }
}

/**
 * Check backend API connectivity
 */
async function checkBackend(): Promise<{ isHealthy: boolean; latency: number }> {
  const startTime = performance.now();

  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Try to ping the backend server
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-17b9cebd/health`,
      {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      }
    );

    const latency = performance.now() - startTime;

    return {
      isHealthy: response.ok,
      latency,
    };
  } catch (error) {
    logger.warn('Backend health check failed:', error);
    return {
      isHealthy: false,
      latency: -1,
    };
  }
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthStatus> {
  const checks = {
    frontend: true, // If this code is running, frontend is healthy
    backend: false,
    database: false,
    localStorage: checkLocalStorage(),
  };

  const latency = {
    database: -1,
    backend: -1,
  };

  // Check database
  const dbHealth = await checkDatabase();
  checks.database = dbHealth.isHealthy;
  latency.database = dbHealth.latency;

  // Check backend
  const backendHealth = await checkBackend();
  checks.backend = backendHealth.isHealthy;
  latency.backend = backendHealth.latency;

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy';

  if (checks.frontend && checks.backend && checks.database && checks.localStorage) {
    status = 'healthy';
  } else if (checks.frontend && checks.localStorage) {
    // Can work in offline mode
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  const healthStatus: HealthStatus = {
    status,
    timestamp: new Date(),
    checks,
    latency: latency.database > 0 || latency.backend > 0 ? latency : undefined,
    version: '1.0.12',
  };

  logger.info('Health check completed:', healthStatus);

  return healthStatus;
}

/**
 * Start periodic health checks
 */
export function startHealthMonitoring(intervalMs: number = 60000) {
  // Perform initial check
  performHealthCheck();

  // Set up periodic checks (default: every 60 seconds)
  const intervalId = setInterval(() => {
    performHealthCheck();
  }, intervalMs);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
  };
}

/**
 * Check if system is in offline mode
 */
export async function isOffline(): Promise<boolean> {
  const health = await performHealthCheck();
  return health.status === 'degraded' || health.status === 'unhealthy';
}

/**
 * Get system status summary for display
 */
export async function getStatusSummary(): Promise<string> {
  const health = await performHealthCheck();

  switch (health.status) {
    case 'healthy':
      return 'All systems operational';
    case 'degraded':
      return 'Operating in offline mode';
    case 'unhealthy':
      return 'System experiencing issues';
    default:
      return 'Status unknown';
  }
}
