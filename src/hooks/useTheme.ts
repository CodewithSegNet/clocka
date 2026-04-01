import { useEffect } from 'react';

export const useTheme = () => {
  useEffect(() => {
    const applyTheme = () => {
      const savedTheme = localStorage.getItem('dashboardTheme');
      
      if (savedTheme) {
        try {
          const theme = JSON.parse(savedTheme);
          
          // Check if it's the new theme system (dark/light) or old system (color objects)
          if (typeof theme === 'string' && (theme === 'dark' || theme === 'light')) {
            // New dark/light theme system
            const root = document.documentElement;
            
            if (theme === 'dark') {
              // Apply dark theme
              root.classList.add('dark');
              root.style.setProperty('--bg-primary', '#1f2937');
              root.style.setProperty('--bg-secondary', '#111827');
              root.style.setProperty('--text-primary', '#f9fafb');
              root.style.setProperty('--text-secondary', '#d1d5db');
              root.style.setProperty('--border-color', '#374151');
            } else {
              // Apply light theme
              root.classList.remove('dark');
              root.style.setProperty('--bg-primary', '#ffffff');
              root.style.setProperty('--bg-secondary', '#f9fafb');
              root.style.setProperty('--text-primary', '#111827');
              root.style.setProperty('--text-secondary', '#6b7280');
              root.style.setProperty('--border-color', '#e5e7eb');
            }
            
            // Create dynamic style tag for theme-based classes
            let styleTag = document.getElementById('dynamic-theme-styles');
            if (!styleTag) {
              styleTag = document.createElement('style');
              styleTag.id = 'dynamic-theme-styles';
              document.head.appendChild(styleTag);
            }
            
            // Add dynamic CSS rules for dark/light theme
            if (theme === 'dark') {
              styleTag.textContent = `
                /* Dark Theme - Global Overrides */
                body { background-color: #0f172a !important; color: #f1f5f9 !important; }
                
                /* Override white backgrounds */
                .bg-white { background-color: #1e293b !important; }
                .bg-gray-50 { background-color: #0f172a !important; }
                .bg-gray-100 { background-color: #1e293b !important; }
                .bg-gray-200 { background-color: #334155 !important; }
                
                /* Override text colors */
                .text-gray-900 { color: #f1f5f9 !important; }
                .text-gray-800 { color: #e2e8f0 !important; }
                .text-gray-700 { color: #cbd5e1 !important; }
                .text-gray-600 { color: #94a3b8 !important; }
                .text-gray-500 { color: #64748b !important; }
                
                /* Override borders */
                .border-gray-200 { border-color: #334155 !important; }
                .border-gray-300 { border-color: #475569 !important; }
                
                /* Cards and containers */
                [class*="bg-gradient-to"] { 
                  background: linear-gradient(to bottom right, #1e293b, #0f172a) !important; 
                }
                
                /* Inputs */
                input, select, textarea {
                  background-color: #0f172a !important;
                  color: #f1f5f9 !important;
                  border-color: #475569 !important;
                }
                
                /* Buttons with bg-white */
                button.bg-white {
                  background-color: #1e293b !important;
                  color: #f1f5f9 !important;
                }
                
                /* Hover states - Toned down for better text contrast */
                .hover\\:bg-gray-50:hover { background-color: #1e293b !important; }
                .hover\\:bg-gray-100:hover { background-color: #293548 !important; }
                .hover\\:bg-indigo-50:hover { background-color: #1e293b !important; }
                .hover\\:bg-purple-50:hover { background-color: #2d1b3d !important; }
                .hover\\:bg-green-50:hover { background-color: #1a2e25 !important; }
                .hover\\:bg-blue-50:hover { background-color: #1a2942 !important; }
                .hover\\:bg-orange-50:hover { background-color: #2d2418 !important; }
                .hover\\:bg-pink-50:hover { background-color: #2d1a27 !important; }
                .hover\\:bg-violet-50:hover { background-color: #261b33 !important; }
                .hover\\:bg-red-50:hover { background-color: #2d1a1e !important; }
                
                /* Border hover states - Subtle highlights */
                .hover\\:border-indigo-400:hover { border-color: #6366f1 !important; }
                .hover\\:border-purple-400:hover { border-color: #a78bfa !important; }
                .hover\\:border-green-400:hover { border-color: #4ade80 !important; }
                .hover\\:border-blue-400:hover { border-color: #60a5fa !important; }
                .hover\\:border-pink-400:hover { border-color: #f472b6 !important; }
                .hover\\:border-violet-400:hover { border-color: #a78bfa !important; }
                
                /* Specific color gradients for cards */
                .from-indigo-50, .from-purple-50, .from-green-50, 
                .from-blue-50, .from-orange-50, .from-pink-50, 
                .from-violet-50, .from-yellow-50 {
                  background: #1e293b !important;
                }
                
                /* Gradient backgrounds for colored sections - More subtle */
                .bg-gradient-to-br.from-indigo-50 { background: linear-gradient(to bottom right, #1e3a5f, #1e293b) !important; }
                .bg-gradient-to-br.from-purple-50 { background: linear-gradient(to bottom right, #2d1b3d, #1e293b) !important; }
                .bg-gradient-to-br.from-green-50 { background: linear-gradient(to bottom right, #1a3d2e, #1e293b) !important; }
                .bg-gradient-to-br.from-blue-50 { background: linear-gradient(to bottom right, #1a3a52, #1e293b) !important; }
                .bg-gradient-to-br.from-orange-50 { background: linear-gradient(to bottom right, #3d2818, #1e293b) !important; }
                .bg-gradient-to-br.from-pink-50 { background: linear-gradient(to bottom right, #3d1a2f, #1e293b) !important; }
                .bg-gradient-to-br.from-violet-50 { background: linear-gradient(to bottom right, #2d1b42, #1e293b) !important; }
                
                /* Purple/Indigo backgrounds for selected items - Better contrast */
                .bg-purple-100 { background-color: #3d2d5a !important; }
                .from-purple-100 { background: #3d2d5a !important; }
                .bg-indigo-100 { background-color: #2d3d5a !important; }
                .to-indigo-100 { background: #2d3d5a !important; }
                .bg-gradient-to-r.from-purple-100.to-indigo-100 { 
                  background: linear-gradient(to right, #3d2d5a, #2d3d5a) !important; 
                }
                
                /* Purple text colors for contrast */
                .text-purple-900 { color: #e9d5ff !important; }
                .text-purple-500 { color: #a78bfa !important; }
                
                /* Border colors for purple elements */
                .border-purple-300 { border-color: #6b46c1 !important; }
                
                /* Violet backgrounds - Better contrast */
                .bg-violet-50 { background-color: #1e1a2e !important; }
                .border-violet-200 { border-color: #5b21b6 !important; }
                .border-violet-600 { border-color: #7c3aed !important; }
                
                /* Keep accent colors vibrant */
                .bg-indigo-600, .bg-purple-600, .bg-green-600, 
                .bg-blue-600, .bg-orange-600, .bg-pink-600,
                .bg-violet-600, .bg-red-500, .bg-emerald-500 {
                  /* Keep these colors as is */
                }
              `;
            } else {
              styleTag.textContent = `
                /* Light Theme */
                body { background-color: #ffffff !important; color: #111827 !important; }
                .theme-bg { background-color: #ffffff !important; }
                .theme-bg-card { background-color: #f9fafb !important; }
                .theme-text { color: #111827 !important; }
                .theme-text-muted { color: #6b7280 !important; }
                .theme-border { border-color: #e5e7eb !important; }
              `;
            }
          } else if (typeof theme === 'object') {
            // Old color-based theme system (for backward compatibility)
            const root = document.documentElement;
            
            // Admin Dashboard Colors
            root.style.setProperty('--admin-primary', theme.adminPrimaryColor || '#4f46e5');
            root.style.setProperty('--admin-secondary', theme.adminSecondaryColor || '#818cf8');
            
            // Parent Portal Colors
            root.style.setProperty('--parent-primary', theme.parentPrimaryColor || '#10b981');
            root.style.setProperty('--parent-secondary', theme.parentSecondaryColor || '#34d399');
            
            // Create dynamic style tag for theme-based classes
            let styleTag = document.getElementById('dynamic-theme-styles');
            if (!styleTag) {
              styleTag = document.createElement('style');
              styleTag.id = 'dynamic-theme-styles';
              document.head.appendChild(styleTag);
            }
            
            // Add dynamic CSS rules for admin dashboard
            styleTag.textContent = `
              /* Admin Dashboard Theme Colors */
              .admin-bg-primary { background-color: ${theme.adminPrimaryColor} !important; }
              .admin-bg-primary-light { background-color: ${theme.adminPrimaryColor}20 !important; }
              .admin-text-primary { color: ${theme.adminPrimaryColor} !important; }
              .admin-border-primary { border-color: ${theme.adminPrimaryColor} !important; }
              .admin-hover-bg-primary:hover { background-color: ${theme.adminPrimaryColor} !important; }
              .admin-hover-text-primary:hover { color: ${theme.adminPrimaryColor} !important; }
              .admin-hover-border-primary:hover { border-color: ${theme.adminPrimaryColor} !important; }
              
              /* Parent Portal Theme Colors */
              .parent-bg-primary { background-color: ${theme.parentPrimaryColor} !important; }
              .parent-bg-primary-light { background-color: ${theme.parentPrimaryColor}20 !important; }
              .parent-text-primary { color: ${theme.parentPrimaryColor} !important; }
              .parent-border-primary { border-color: ${theme.parentPrimaryColor} !important; }
              .parent-hover-bg-primary:hover { background-color: ${theme.parentPrimaryColor} !important; }
              .parent-hover-text-primary:hover { color: ${theme.parentPrimaryColor} !important; }
              .parent-gradient-primary { background: linear-gradient(135deg, ${theme.parentPrimaryColor}, ${theme.parentSecondaryColor}) !important; }
            `;
          }
        } catch (error) {
          console.error('Error applying theme:', error);
        }
      } else {
        // Default to light theme if no theme is saved
        const root = document.documentElement;
        root.classList.remove('dark');
      }
    };

    // Apply theme on mount
    applyTheme();

    // Listen for storage changes (when theme is updated)
    const handleStorageChange = () => {
      applyTheme();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab updates
    window.addEventListener('themeUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeUpdated', handleStorageChange);
    };
  }, []);
};