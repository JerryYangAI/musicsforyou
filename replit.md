# 音为你 (Your Melody) - Music Customization Platform

## Overview
"Your Melody" (音为你) is a professional music customization platform enabling users to create bespoke music tracks by specifying style, mood, and other parameters. It features a modern, bilingual (Chinese/English) interface with a premium design aesthetic. The platform allows users to customize music, manage orders, and complete payments via integrated providers, aiming to deliver custom music surprises and play the melody of the user's heart.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework & Build**: React 18 with TypeScript, Vite for fast HMR, Wouter for lightweight routing, React Query for server state management.
- **UI Component System**: Radix UI primitives, shadcn/ui (New York style), Tailwind CSS for styling, Class Variance Authority (CVA) for component variants, custom theming with light/dark modes.
- **Design System**: Purple and blue gradient-based visual language, custom CSS variables for theming, responsive design with a mobile-first approach.
- **Internationalization**: Custom `LanguageProvider` for Chinese (zh) and English (en) locales, locale persistence, type-safe translations.
- **State Management**: React Context API for global UI state, React Query for server state, `react-hook-form` with Zod for form state and validation.

### Backend
- **Server Framework**: Node.js with Express.js, TypeScript for type safety.
- **API Design**: RESTful JSON API under `/api`, custom error handling, request logging.

### Data Storage
- **Database**: PostgreSQL (via Neon serverless) with Drizzle ORM for type-safe operations and migrations.
- **Schema**: `users` and `music_tracks` tables with UUIDs and foreign keys.
- **Storage Strategy**: Interface-based abstraction (`IStorage`) with in-memory (development) and PostgreSQL (production) implementations.

### Authentication & Authorization
- **Authentication**: Username/password, session-based using `express-session` with secure httpOnly cookies, bcrypt hashing, `AuthProvider` for global user state.
- **Authorization**: Protected routes, session persistence, user isolation for orders and reviews, admin role protection for `/api/admin/*` endpoints.

### Core Features
- **Music Customization**: Form with lyrics/keywords input, optional song title, voice type selection (male/female).
- **Order Management**: Users can view their own orders, admins can view all orders, update status, and upload music files.
- **Payment Processing**: Stripe integration for credit card payments, WeChat Pay placeholder, order creation via `/api/orders`.
- **User Profile**: Password change functionality with current password verification.
- **Music Playback & Download**: HTML5 Audio API for 10-second previews, download for completed orders.
- **Review System**: 5-star rating, optional comments, unique per order, server-side validation for order ownership.
- **Admin System**: Dashboard with statistics, order list with filtering, order detail page for music upload and status management.

### Build & Deployment
- Client build with Vite, server build with esbuild, TypeScript compilation checks.
- Environment variables for database, Stripe keys, and session secret.

## External Dependencies

- **Payment Processing**: Stripe (`@stripe/stripe-js`, `@stripe/react-stripe-js`), WeChat Pay (UI placeholder).
- **Database Hosting**: Neon serverless PostgreSQL.
- **Icon Library**: React Icons (lucide-react, react-icons/si).
- **Date Utilities**: `date-fns`.
- **Command Palette**: `cmdk`.
- **Contact Form**: Formspree (for contact form submission).
- **Development Tools**: Replit-specific plugins, error overlay, cartographer.