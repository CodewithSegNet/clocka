# 🎓 Clocka - School Attendance Management System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.12-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue)
![Vite](https://img.shields.io/badge/Vite-6.3.5-purple)

Modern, comprehensive school attendance SaaS platform with multi-tenant support, real-time tracking, and advanced security features.

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Deployment](#deployment)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

Clocka is a production-ready, multi-tenant SaaS platform designed for modern school attendance management. It features three-tier access control, real-time GPS tracking, facial verification, assignee management, and comprehensive reporting capabilities.

### Key Highlights

✅ **Multi-Tenant SaaS** - Each school gets unique branding and isolated data  
✅ **Three-Tier Access** - Super Admin, School Admin, and Parent portals  
✅ **Real-Time Tracking** - Live attendance monitoring with GPS verification  
✅ **Assignee System** - Secure delegate pickup with 24-hour access control  
✅ **Security Personnel** - Dedicated dashboard for gate management  
✅ **Offline Support** - Full functionality with localStorage fallbacks  
✅ **Production Ready** - Optimized builds, error tracking, and monitoring

## ✨ Features

### For Super Admins
- 🏫 Manage multiple schools and organizations
- 📊 System-wide analytics and reporting
- 👥 School administrator management
- 🔐 Platform-wide security controls

### For School Admins
- 👨‍🎓 Student and parent management
- 📈 Attendance analytics and reports
- 🔒 Security personnel management
- 📱 Custom school branding
- 💳 Payment integration (Paystack)

### For Parents
- ⏰ Quick clock-in/clock-out with PIN
- 📸 Facial verification capture
- 👤 Assignee delegation (up to 24 hours)
- 📱 Multi-child support
- 🔔 Real-time notifications
- 📊 Attendance history

### For Security Personnel
- 📋 Daily attendance log access
- 👥 Assignee credential verification
- 📄 PDF report generation
- 🔍 Real-time lookup capabilities

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript 5.7.3** - Type safety
- **Vite 6.3.5** - Build tool and dev server
- **React Router 7.12** - Client-side routing
- **Tailwind CSS 4.1** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Motion** - Smooth animations

### Backend
- **Supabase** - Database, auth, and storage
- **Supabase Edge Functions** - Serverless API (Hono)
- **PostgreSQL** - Primary database

### Development Tools
- **TypeScript** - Static type checking
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vite Plugin Compression** - Build optimization

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm/pnpm/yarn
- Supabase account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/clocka.git
cd clocka
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_PROJECT_ID=your-project-id
```

4. **Start development server**
```bash
npm run dev
```

5. **Open your browser**
```
http://localhost:3000
```

### Default Credentials

**Super Admin:**
- Email: superadmin@clocka.com
- Password: (set during initial setup)

**Test School Admin:**
- School Code: DEMO001
- Password: (set during school creation)

## 📁 Project Structure

```
clocka/
├── public/                 # Static assets
│   ├── manifest.json      # PWA manifest
│   ├── robots.txt         # SEO robots file
│   └── sitemap.xml        # SEO sitemap
├── src/
│   ├── app/               # Main application
│   │   ├── App.tsx        # Root component
│   │   └── components/    # Shared components
│   ├── components/        # Feature components
│   │   ├── ErrorBoundary.tsx
│   │   ├── OfflineIndicator.tsx
│   │   └── ...
│   ├── contexts/          # React contexts
│   │   ├── AuthContext.tsx
│   │   └── DataContext.tsx
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Route pages
│   │   ├── admin/         # Admin pages
│   │   ├── parent/        # Parent portal
│   │   ├── security/      # Security dashboard
│   │   └── super-admin/   # Super admin portal
│   ├── styles/            # Global styles
│   ├── utils/             # Utility functions
│   │   ├── env.ts         # Environment config
│   │   ├── logger.ts      # Logging utility
│   │   ├── performance.ts # Performance monitoring
│   │   └── security.ts    # Security utilities
│   └── main.tsx           # Application entry point
├── supabase/
│   └── functions/
│       └── server/        # Edge functions
├── .env.example           # Environment template
├── .eslintrc.js           # ESLint configuration
├── .prettierrc            # Prettier configuration
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
├── vercel.json            # Vercel deployment config
├── netlify.toml           # Netlify deployment config
├── DEPLOYMENT.md          # Deployment guide
└── README.md              # This file
```

## ⚙️ Configuration

### Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the frontend.

**Required:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_SUPABASE_PROJECT_ID` - Your Supabase project ID

**Optional:**
- `VITE_SENTRY_DSN` - Sentry error tracking DSN
- `VITE_GA_TRACKING_ID` - Google Analytics tracking ID
- `VITE_ENABLE_OFFLINE_MODE` - Enable/disable offline mode

### Build Configuration

The project uses Vite for building. Key configurations in `vite.config.ts`:

- **Code Splitting** - Automatic vendor chunk separation
- **Compression** - Gzip and Brotli compression
- **Source Maps** - Hidden in production for debugging
- **Tree Shaking** - Removes unused code

## 💻 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Lint code
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

### Code Quality

**TypeScript Strict Mode** - Enabled for maximum type safety

**ESLint Rules:**
- No unused variables
- No console.log in production
- React Hooks rules enforced
- TypeScript recommended rules

**Prettier:**
- 100 character line width
- Single quotes
- 2 space indentation
- Trailing commas (ES5)

### Adding New Features

1. Create feature branch: `git checkout -b feature/your-feature`
2. Implement with TypeScript types
3. Add tests if applicable
4. Run quality checks: `npm run type-check && npm run lint`
5. Submit pull request

## 🧪 Testing

### Manual Testing Checklist

- [ ] All authentication flows work
- [ ] Student/parent CRUD operations
- [ ] Attendance clock-in/out functionality
- [ ] Assignee system and expiration
- [ ] Security dashboard access
- [ ] Offline mode functionality
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

### Performance Testing

```bash
# Build and analyze bundle
npm run build

# Check bundle size
npx vite-bundle-visualizer
```

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

### Quick Deploy

**Vercel (Recommended):**
```bash
npm i -g vercel
vercel --prod
```

**Netlify:**
```bash
npm i -g netlify-cli
netlify deploy --prod
```

### Environment Setup

Set the following environment variables in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### Post-Deployment

1. Verify all routes are accessible
2. Test authentication flows
3. Check database connections
4. Monitor error logs
5. Set up uptime monitoring

## 🔒 Security

### Implemented Security Measures

✅ **XSS Protection** - Input sanitization and CSP headers  
✅ **CSRF Protection** - Token-based authentication  
✅ **SQL Injection Prevention** - Parameterized queries via Supabase  
✅ **Rate Limiting** - Client-side and server-side protection  
✅ **Secure Headers** - HSTS, X-Frame-Options, etc.  
✅ **Environment Variables** - Sensitive data never exposed  
✅ **Row-Level Security** - Supabase RLS policies  

### Security Best Practices

- Never commit `.env` files
- Rotate API keys regularly
- Use HTTPS in production
- Enable 2FA for admin accounts
- Regular security audits
- Monitor error logs for suspicious activity

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commit messages
4. Ensure all tests pass
5. Submit a pull request

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Write self-documenting code
- Add JSDoc comments for complex logic
- Keep components small and focused

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- React team for the amazing framework
- Supabase for the backend infrastructure
- Radix UI for accessible components
- Tailwind CSS for utility-first styling

## 📞 Support

- Documentation: [docs.clocka.app](https://docs.clocka.app)
- Email: support@clocka.app
- Issues: [GitHub Issues](https://github.com/yourusername/clocka/issues)

---

<div align="center">

**Built with ❤️ for modern education**

[⬆ Back to top](#-clocka---school-attendance-management-system)

</div>
