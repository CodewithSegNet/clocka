/**
 * Performance monitoring utilities
 * Tracks Core Web Vitals and app performance
 */

import { logger } from './logger';

// Report Web Vitals (CLS, FID, FCP, LCP, TTFB)
export function reportWebVitals(onPerfEntry?: (metric: any) => void) {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    }).catch((error) => {
      logger.warn('Failed to load web-vitals:', error);
    });
  }
}

// Performance timing API wrapper
export function measurePerformance(name: string, startTime: number) {
  const duration = performance.now() - startTime;
  
  if (import.meta.env.DEV) {
    logger.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
  }
  
  // Mark performance in browser DevTools
  if (performance.mark) {
    performance.mark(name);
  }
  
  return duration;
}

// Measure component render time
export function measureRender(componentName: string) {
  const startTime = performance.now();
  
  return () => {
    measurePerformance(`Render: ${componentName}`, startTime);
  };
}

// Track route changes
export function trackRouteChange(route: string) {
  if (import.meta.env.DEV) {
    logger.log(`🧭 Route changed: ${route}`);
  }
  
  // TODO: Send to analytics service in production
  // Example: analytics.page(route);
}

// Measure API call performance
export function measureApiCall(endpoint: string) {
  const startTime = performance.now();
  
  return {
    end: () => measurePerformance(`API: ${endpoint}`, startTime)
  };
}

// Log performance metrics
export function logPerformanceMetrics() {
  if (import.meta.env.DEV && performance.getEntriesByType) {
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    
    if (navigationEntries.length > 0) {
      const navigation = navigationEntries[0];
      
      logger.group('Performance Metrics');
      logger.log('DNS Lookup:', `${(navigation.domainLookupEnd - navigation.domainLookupStart).toFixed(2)}ms`);
      logger.log('TCP Connection:', `${(navigation.connectEnd - navigation.connectStart).toFixed(2)}ms`);
      logger.log('Request Time:', `${(navigation.responseEnd - navigation.requestStart).toFixed(2)}ms`);
      logger.log('DOM Content Loaded:', `${(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart).toFixed(2)}ms`);
      logger.log('Page Load Time:', `${(navigation.loadEventEnd - navigation.loadEventStart).toFixed(2)}ms`);
      logger.groupEnd();
    }
  }
}

// Initialize performance monitoring
export function initPerformanceMonitoring() {
  if (typeof window !== 'undefined') {
    // Log metrics when page is fully loaded
    window.addEventListener('load', () => {
      setTimeout(() => {
        logPerformanceMetrics();
        
        // Report web vitals to console in dev
        if (import.meta.env.DEV) {
          reportWebVitals((metric) => {
            logger.log(`📊 ${metric.name}:`, metric.value.toFixed(2));
          });
        }
      }, 0);
    });
  }
}
