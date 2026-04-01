/**
 * Analytics utility for production tracking
 * Integrates with Google Analytics, Sentry, and custom analytics
 */

import { logger } from './logger';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

interface UserProperties {
  userId?: string;
  userType?: 'parent' | 'admin' | 'super-admin' | 'security' | 'assignee';
  schoolCode?: string;
}

class Analytics {
  private isInitialized = false;
  private userProperties: UserProperties = {};

  /**
   * Initialize analytics services
   */
  initialize() {
    if (this.isInitialized) return;

    // Initialize Google Analytics (if enabled)
    if (import.meta.env.VITE_GA_TRACKING_ID) {
      this.initializeGA();
    }

    // Initialize Sentry (if enabled)
    if (import.meta.env.VITE_SENTRY_DSN && import.meta.env.PROD) {
      this.initializeSentry();
    }

    this.isInitialized = true;
    logger.info('Analytics initialized');
  }

  /**
   * Initialize Google Analytics
   */
  private initializeGA() {
    const gaId = import.meta.env.VITE_GA_TRACKING_ID;

    // Load GA script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    // Initialize GA
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).gtag = function () {
      (window as any).dataLayer.push(arguments);
    };
    (window as any).gtag('js', new Date());
    (window as any).gtag('config', gaId, {
      send_page_view: false, // We'll manually send page views
    });

    logger.info('Google Analytics initialized');
  }

  /**
   * Initialize Sentry
   */
  private async initializeSentry() {
    try {
      const Sentry = await import('@sentry/react');

      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        tracesSampleRate: 1.0,
        beforeSend(event) {
          // Filter out sensitive data
          if (event.request?.headers) {
            delete event.request.headers['Authorization'];
          }
          return event;
        },
      });

      logger.info('Sentry initialized');
    } catch (error) {
      logger.error('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Set user properties for tracking
   */
  setUser(properties: UserProperties) {
    this.userProperties = { ...this.userProperties, ...properties };

    // Set in GA
    if ((window as any).gtag) {
      (window as any).gtag('set', 'user_properties', {
        user_type: properties.userType,
        school_code: properties.schoolCode,
      });
    }

    // Set in Sentry
    if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
      import('@sentry/react').then((Sentry) => {
        Sentry.setUser({
          id: properties.userId,
          segment: properties.userType,
        });
      });
    }

    logger.info('User properties set:', properties);
  }

  /**
   * Clear user properties (on logout)
   */
  clearUser() {
    this.userProperties = {};

    if ((window as any).gtag) {
      (window as any).gtag('set', 'user_properties', {});
    }

    if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
      import('@sentry/react').then((Sentry) => {
        Sentry.setUser(null);
      });
    }
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title?: string) {
    if (!this.isInitialized) return;

    // GA page view
    if ((window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_path: path,
        page_title: title || document.title,
      });
    }

    logger.info('Page view tracked:', path);
  }

  /**
   * Track custom event
   */
  trackEvent({ category, action, label, value }: AnalyticsEvent) {
    if (!this.isInitialized) return;

    // GA event
    if ((window as any).gtag) {
      (window as any).gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }

    logger.info('Event tracked:', { category, action, label, value });
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: Record<string, any>) {
    logger.error('Error tracked:', error, context);

    // Send to Sentry in production
    if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
      import('@sentry/react').then((Sentry) => {
        Sentry.captureException(error, {
          contexts: { additional: context },
        });
      });
    }

    // Track as GA event
    this.trackEvent({
      category: 'Error',
      action: error.name,
      label: error.message,
    });
  }

  /**
   * Track timing metric
   */
  trackTiming(category: string, variable: string, value: number) {
    if (!this.isInitialized) return;

    if ((window as any).gtag) {
      (window as any).gtag('event', 'timing_complete', {
        name: variable,
        value: Math.round(value),
        event_category: category,
      });
    }

    logger.info('Timing tracked:', { category, variable, value });
  }

  /**
   * Track user action
   */
  trackUserAction(action: string, details?: Record<string, any>) {
    this.trackEvent({
      category: 'User Action',
      action,
      label: JSON.stringify(details),
    });
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Convenience functions
export const trackPageView = (path: string, title?: string) =>
  analytics.trackPageView(path, title);

export const trackEvent = (event: AnalyticsEvent) => analytics.trackEvent(event);

export const trackError = (error: Error, context?: Record<string, any>) =>
  analytics.trackError(error, context);

export const trackUserAction = (action: string, details?: Record<string, any>) =>
  analytics.trackUserAction(action, details);

export const setUser = (properties: UserProperties) => analytics.setUser(properties);

export const clearUser = () => analytics.clearUser();

// Initialize on module load
if (typeof window !== 'undefined') {
  analytics.initialize();
}
