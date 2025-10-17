# AI Music Customization Platform

## Overview

This is an AI-powered music customization platform that allows users to create custom music tracks by describing their desired style, mood, and other parameters. The platform features a modern, bilingual (Chinese/English) interface with a premium design aesthetic inspired by platforms like Spotify and Apple Music. Users can customize their music, manage orders, and complete payments through integrated payment providers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript as the primary UI framework
- Vite as the build tool and development server, providing fast HMR and optimized production builds
- Wouter for client-side routing, chosen over React Router for its lightweight footprint
- React Query (TanStack Query) for server state management and data fetching

**UI Component System**
- Radix UI primitives as the foundation for accessible, unstyled components
- shadcn/ui component library (New York style variant) built on top of Radix
- Tailwind CSS for utility-first styling with custom design tokens
- Class Variance Authority (CVA) for component variant management
- Custom theming system supporting light/dark modes via ThemeProvider context

**Design System**
- Color palette centered around purple (270° hue) and blue (220° hue) gradients
- Custom CSS variables for theming with support for opacity modifiers
- Gradient-based visual language to evoke music and sound waves
- Responsive design with mobile-first approach

**Internationalization**
- Custom i18n implementation via LanguageProvider context
- Support for Chinese (zh) and English (en) locales
- Locale persistence in localStorage
- Type-safe translations using TypeScript inference

**State Management Architecture**
- React Context API for global UI state (theme, language)
- React Query for server state with custom query client configuration
- Local component state using React hooks
- Form state managed via react-hook-form with Zod validation

### Backend Architecture

**Server Framework**
- Express.js as the HTTP server framework
- Node.js runtime with ES modules
- TypeScript for type safety across the stack
- Development mode with TSX for hot reloading

**API Design**
- RESTful endpoints under `/api` prefix
- JSON-based request/response format
- Custom error handling middleware
- Request logging with duration tracking

**Development & Production Split**
- Vite middleware integration in development for HMR
- Static file serving from dist/public in production
- Separate build process for client (Vite) and server (esbuild)
- Environment-based configuration via NODE_ENV

### Data Storage Solutions

**Database**
- PostgreSQL as the primary database (via Neon serverless)
- Drizzle ORM for type-safe database operations and migrations
- WebSocket connection support for serverless environments
- Schema-first approach with Drizzle Kit for migrations

**Database Schema**
- `users` table: user authentication with username/password
- `music_tracks` table: stores generated music metadata, audio URLs, and sharing settings
- UUID-based primary keys generated via `gen_random_uuid()`
- Foreign key relationships between users and their music tracks

**Storage Strategy**
- In-memory storage implementation (MemStorage) for development/demo
- Interface-based storage abstraction (IStorage) allowing easy swapping to database
- Sample data initialization for demonstration purposes
- Public music tracks system with leaderboard functionality

### Authentication & Authorization

**Current Implementation (October 2025)**
- ✅ Username/password authentication system (simplified)
- ✅ Session-based authentication using express-session middleware
- ✅ Cookie-based credentials with secure httpOnly cookies
- ✅ Username must be unique (enforced by database constraint)
- ✅ bcrypt password hashing for secure storage
- ✅ AuthProvider context for global user state management
- ✅ Protected routes and session persistence

**API Endpoints**
- POST /api/auth/register - User registration with username and password
- POST /api/auth/login - User login with username and password
- POST /api/auth/logout - User logout and session destruction
- GET /api/auth/me - Get current authenticated user

**Security Features**
- bcrypt password hashing (10 rounds)
- Express session with secure cookies
- CSRF protection via session configuration
- Input validation using Zod schemas
- Session expiry (7 days)
- HttpOnly cookies to prevent XSS attacks

### External Dependencies

**Payment Processing**
- Stripe integration via @stripe/stripe-js and @stripe/react-stripe-js
- Support for international credit card payments
- WeChat Pay integration placeholder (UI implemented)
- Payment method selection with visual feedback

**AI Music Generation**
- No direct AI service integration in current codebase
- Architecture prepared for external AI API integration
- Mock data and UI flows established for music generation process
- Audio playback via HTML5 Audio API with URL-based tracks

**Third-Party Services**
- Neon serverless PostgreSQL for database hosting
- WebSocket support for serverless database connections
- Sample audio from external sources (SoundHelix) for demonstration

**Development Tools**
- Replit-specific plugins for development experience (@replit/vite-plugin-*)
- Error overlay and cartographer for debugging
- Development banner for Replit environment

**UI Libraries**
- React Icons for icon sets (lucide-react, react-icons/si)
- date-fns for date manipulation
- cmdk for command palette functionality
- Various Radix UI primitives for accessible components

### Build & Deployment

**Recent Updates (October 2025)**
- ✅ Implemented session-based authentication with express-session middleware
- ✅ Fixed critical session initialization bug in server/index.ts
- ✅ Created music customization form with full i18n support
- ✅ Added comprehensive form validation (mood selection, description length)
- ✅ Implemented orders table schema with payment tracking fields
- ✅ Added Stripe payment intent endpoint at POST /api/create-payment-intent
- ✅ All validation errors displayed with proper localized messages
- ✅ Form data properly stored in sessionStorage for payment flow navigation
- ✅ Updated AuthResponse type to use string UUID instead of number
- ✅ Fixed all i18n hard-coding issues (duration units now use translation keys)
- ✅ Removed theme toggle button, app now defaults to light theme only
- ✅ Switched from MemStorage to DbStorage for persistent data storage
- ✅ **Simplified authentication to username + password only**
  - Removed email and phone fields from database schema
  - Username now required and must be unique
  - Registration/login forms simplified to username + password input
  - Updated all API endpoints and storage interfaces
  - Added password confirmation field in registration (requires password to be entered twice)
  - All auth tests passing successfully

**Build Process**
- Client build: Vite bundles React app to dist/public
- Server build: esbuild bundles Express server to dist/index.js
- TypeScript compilation check via tsc
- Database schema push via Drizzle Kit

**Environment Configuration**
- DATABASE_URL required for PostgreSQL connection
- STRIPE_SECRET_KEY and VITE_STRIPE_PUBLIC_KEY for payment processing
- SESSION_SECRET for session encryption
- Environment-specific paths and settings
- Production-optimized builds with code splitting
- Asset optimization and minification