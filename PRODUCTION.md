# Clocka - Production Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
Ensure all environment variables are properly configured:

```bash
# .env.production
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_URL=https://your_project_id.supabase.co
```

### 2. Build Optimization
The production build includes:
- ✅ Code splitting and lazy loading
- ✅ Tree shaking and minification
- ✅ Console.log removal in production
- ✅ Optimized vendor chunks
- ✅ Compressed assets

### 3. Security Features
- ✅ Error boundaries for graceful error handling
- ✅ Input sanitization utilities
- ✅ XSS prevention
- ✅ Clickjacking protection
- ✅ Rate limiting helpers

### 4. Performance Features
- ✅ Lazy loading routes
- ✅ React.Suspense with loading fallbacks
- ✅ Offline mode support
- ✅ LocalStorage caching
- ✅ Web Vitals monitoring

---

## 🚀 Build Commands

### Development
```bash
npm run dev
# or
pnpm dev
```

### Production Build
```bash
npm run build
# or
pnpm build
```

### Preview Production Build
```bash
npm run preview
# or
pnpm preview
```

---

## 📦 Production Build Output

After running `npm run build`, you'll get:

```
dist/
├── assets/
│   ├── index-[hash].js      # Main app bundle
│   ├── react-vendor-[hash].js    # React libraries
│   ├── ui-vendor-[hash].js       # UI libraries
│   ├── supabase-vendor-[hash].js # Supabase SDK
│   └── *.css                # Styles
└── index.html               # Entry point
```

---

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option 2: Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

### Option 3: Custom Server
Upload the `dist/` folder to your web server and configure:

**Nginx Example:**
```nginx
server {
    listen 80;
    server_name clocka.example.com;
    root /var/www/clocka/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🔒 Security Considerations

### 1. Environment Variables
- ✅ Never commit `.env` files to Git
- ✅ Use environment-specific configs
- ✅ Rotate API keys regularly

### 2. Supabase Security
- ✅ Enable Row Level Security (RLS) on all tables
- ✅ Use service role key only on backend
- ✅ Configure CORS properly
- ✅ Set up proper auth policies

### 3. Frontend Security
- ✅ Sanitize all user inputs
- ✅ Validate data before submission
- ✅ Use HTTPS in production
- ✅ Implement Content Security Policy (CSP)

---

## 📊 Monitoring & Analytics

### Error Tracking
Consider integrating error tracking services:

```typescript
// Example: Sentry integration
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

### Analytics
Add analytics tracking:

```typescript
// Example: Google Analytics
import ReactGA from 'react-ga4';

if (import.meta.env.PROD) {
  ReactGA.initialize('your-ga-id');
}
```

---

## ⚡ Performance Optimization

### 1. Image Optimization
- Use WebP format when possible
- Implement lazy loading for images
- Use appropriate image sizes

### 2. Code Splitting
Already implemented via React.lazy() for all routes

### 3. Caching Strategy
- Static assets: 1 year cache
- API responses: LocalStorage fallback
- Service Worker (optional): Consider adding PWA support

---

## 🧪 Testing Before Deployment

### 1. Build Test
```bash
npm run build && npm run preview
```

### 2. Checklist
- [ ] All routes work correctly
- [ ] Authentication flows work
- [ ] Forms submit properly
- [ ] Images load correctly
- [ ] No console errors in production build
- [ ] Responsive on mobile devices
- [ ] Offline mode works
- [ ] Error boundaries catch errors

---

## 🔄 Post-Deployment

### 1. Monitoring
- Monitor error rates
- Track page load times
- Check API response times
- Monitor user sessions

### 2. Regular Maintenance
- Update dependencies monthly
- Review security advisories
- Monitor Supabase usage
- Backup data regularly

---

## 📱 PWA Support (Optional)

To enable Progressive Web App features:

1. Add `vite-plugin-pwa` to vite.config.ts
2. Create service worker
3. Add web app manifest
4. Enable offline caching

---

## 🆘 Troubleshooting

### Issue: Build fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Issue: Environment variables not working
- Ensure they start with `VITE_`
- Restart dev server after changes
- Check `.env.production` exists

### Issue: Routes return 404
- Configure server for SPA routing
- Ensure `index.html` fallback is set

---

## 📞 Support

For production issues:
1. Check error logs in browser console
2. Review Supabase Edge Function logs
3. Check network requests in DevTools
4. Review error boundary reports

---

## 🎯 Performance Targets

Target metrics for production:

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

Monitor these using Lighthouse or Web Vitals.

---

**Production Build Version:** v1.0.12
**Last Updated:** February 2026
