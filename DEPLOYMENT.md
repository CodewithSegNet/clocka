# Clocka - Production Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
Ensure all required environment variables are set:

```bash
# Required
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_PROJECT_ID=your-project-id

# Optional
VITE_SENTRY_DSN=your-sentry-dsn
VITE_GA_TRACKING_ID=your-google-analytics-id
```

Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

### 2. Code Quality Checks

Run type checking:
```bash
npm run type-check
```

Run linting:
```bash
npm run lint
```

Format code:
```bash
npm run format
```

### 3. Build for Production

Create production build:
```bash
npm run build
```

Preview production build locally:
```bash
npm run preview
```

## 🚀 Deployment Platforms

### Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments.

**Environment Variables in Vercel:**
- Go to Project Settings → Environment Variables
- Add all required variables from `.env.example`

### Netlify

1. Install Netlify CLI:
```bash
npm i -g netlify-cli
```

2. Deploy:
```bash
netlify deploy --prod
```

Or use the `netlify.toml` configuration file (already included).

**Build Settings:**
- Build command: `npm run build`
- Publish directory: `dist`

### AWS S3 + CloudFront

1. Build the app:
```bash
npm run build
```

2. Upload `dist` folder to S3 bucket

3. Configure CloudFront:
   - Origin: Your S3 bucket
   - Error Pages: Redirect 404 to `/index.html` (for SPA routing)

## 🔒 Security Considerations

### 1. Environment Variables
- Never commit `.env` files to version control
- Use environment-specific variables for different stages
- Rotate API keys regularly

### 2. CORS Configuration
Update Supabase CORS settings to allow only your production domain:
```
https://yourdomain.com
https://www.yourdomain.com
```

### 3. Content Security Policy
Review and update CSP headers in `index.html` based on your needs.

### 4. API Rate Limiting
Implement rate limiting on Supabase Edge Functions:
```typescript
// In /supabase/functions/server/index.tsx
import { rateLimiter } from './middleware/rateLimiter'
app.use('*', rateLimiter())
```

## 📊 Performance Optimization

### 1. Enable Compression
The build process automatically creates `.gz` and `.br` compressed files. Ensure your hosting platform serves these.

### 2. CDN Configuration
- Use CDN for static assets
- Set appropriate cache headers
- Enable HTTP/2

### 3. Image Optimization
- Compress images before uploading
- Use WebP format where possible
- Implement lazy loading (already configured)

## 🔍 Monitoring & Analytics

### 1. Error Tracking (Sentry)
Install Sentry:
```bash
npm install @sentry/react
```

Initialize in `/src/main.tsx`:
```typescript
import * as Sentry from '@sentry/react';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 1.0,
  });
}
```

### 2. Analytics (Google Analytics)
Add GA script to `index.html` or use `react-ga4` package.

### 3. Performance Monitoring
Already configured in `/src/utils/performance.ts`. Extend as needed.

## 🗄️ Database Management

### 1. Supabase Production Setup
- Enable RLS (Row Level Security) policies
- Set up database backups
- Configure connection pooling
- Review and optimize indexes

### 2. Migration Strategy
- Test all migrations in staging first
- Use Supabase CLI for migrations:
```bash
supabase migration new migration_name
supabase db push
```

## 🧪 Testing in Production

### 1. Smoke Tests
After deployment, verify:
- [ ] Landing page loads correctly
- [ ] All authentication flows work
- [ ] Super Admin can log in
- [ ] School Admin can manage students
- [ ] Parents can register and log in
- [ ] Attendance logging works
- [ ] Assignee system functions
- [ ] Security dashboard is accessible

### 2. Performance Tests
- Run Lighthouse audit
- Check Core Web Vitals
- Test on slow 3G connection
- Verify mobile responsiveness

## 🔄 CI/CD Pipeline

### GitHub Actions Example
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Type check
        run: npm run type-check
        
      - name: Lint
        run: npm run lint
        
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_SUPABASE_PROJECT_ID: ${{ secrets.VITE_SUPABASE_PROJECT_ID }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 📝 Post-Deployment

### 1. Monitoring
- Set up uptime monitoring (e.g., UptimeRobot)
- Configure alerting for errors
- Monitor database performance

### 2. Documentation
- Update user documentation
- Create admin guides
- Document API endpoints

### 3. Backup Strategy
- Daily database backups
- Store backups in multiple locations
- Test restoration process

## 🚨 Rollback Plan

If issues occur after deployment:

1. **Vercel/Netlify**: Use platform's rollback feature
2. **Manual**: Deploy previous version from git
3. **Database**: Have migration rollback scripts ready

## 📞 Support & Maintenance

### Regular Tasks
- Monitor error rates
- Review performance metrics
- Update dependencies monthly
- Security audits quarterly
- Database optimization as needed

### Emergency Contacts
Document your team's contact information and escalation procedures.

---

## 🎯 Production Readiness Score

Before going live, ensure you've completed:

- [x] Environment variables configured
- [x] Code quality checks passing
- [x] Production build successful
- [x] Security measures implemented
- [x] Performance optimized
- [x] Error tracking configured
- [x] Database secured
- [x] Backup strategy in place
- [x] Monitoring set up
- [x] Documentation updated

## 📚 Additional Resources

- [Vite Production Build Guide](https://vitejs.dev/guide/build.html)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Web Vitals](https://web.dev/vitals/)

---

**Last Updated:** February 10, 2026  
**Version:** 1.0.12
