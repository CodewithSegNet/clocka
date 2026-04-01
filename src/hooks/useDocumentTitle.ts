import { useEffect } from 'react';

/**
 * Hook to set document title dynamically
 * Improves SEO and user experience
 */
export function useDocumentTitle(title: string, retainOnUnmount = false) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | Clocka` : 'Clocka - School Attendance SaaS';

    return () => {
      if (!retainOnUnmount) {
        document.title = prevTitle;
      }
    };
  }, [title, retainOnUnmount]);
}
