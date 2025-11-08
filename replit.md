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
- **Schema**: `users`, `music_tracks`, `orders`, and `reviews` tables with UUIDs and foreign keys.
  - **musicTracks**: Supports bilingual content (titleEn, descriptionEn, genreEn) and showcase flag (isShowcase).
- **Storage Strategy**: Interface-based abstraction (`IStorage`) with in-memory (development) and PostgreSQL (production) implementations.
- **Object Storage**: Replit Object Storage (Google Cloud Storage backend) for music file uploads and hosting.
  - **Bucket**: Default bucket `repl-default-bucket-0fa1280d-8519-4770-95e7-9643dabcdb41` created automatically.
  - **File Management**: Admin-uploaded music files stored in private directory (`PRIVATE_OBJECT_DIR/music/`), with ACL-based access control.
  - **Upload System**: Presigned URL-based uploads via Uppy integration (max 100MB, supports MP3/WAV/M4A/FLAC/OGG).
  - **Access Control**: Files owned by admin uploader, public visibility for completed orders.
- **Public Assets**: Showcase music files stored in `client/public/showcase-music/` for direct access.

### Authentication & Authorization
- **Authentication**: Username/password, session-based using `express-session` with secure httpOnly cookies, bcrypt hashing, `AuthProvider` for global user state.
- **Authorization**: Protected routes, session persistence, user isolation for orders and reviews, admin role protection for `/api/admin/*` endpoints.

### Core Features
- **Music Customization**: Form with lyrics/keywords input, optional song title, voice type selection (male/female).
- **Music Showcase Gallery**: Public gallery displaying demo tracks with bilingual descriptions (CN/EN).
  - Showcase tracks marked with special badge, prioritized in display order.
  - 10-second audio preview with HTML5 Audio API.
  - Showcase tracks (3 total):
    1. "给鼎爷的歌" (Song for Dingye) - Pop/Light Rock/Tribute
    2. "给丽娟的歌" (Song for Lijuan) - Pop Ballad/Acoustic/Sentimental
    3. "夏日海风" (Summer Sea Breeze) - Light Music/Ocean Chill/Summer Pop
- **Order Management**: Users can view their own orders, admins can view all orders, update status, and upload music files.
- **Payment Processing**: Stripe integration for credit card payments, WeChat Pay placeholder, order creation via `/api/orders`.
- **User Profile**: Password change functionality with current password verification.
- **Music Playback & Download**: HTML5 Audio API for 10-second previews, download for completed orders.
- **Review System**: 5-star rating, optional comments, unique per order, server-side validation for order ownership.
- **Admin System**: Dashboard with statistics, order list with filtering, order detail page for drag-and-drop music file upload via Uppy and status management, showcase music management.

### Build & Deployment
- Client build with Vite, server build with esbuild, TypeScript compilation checks.
- Environment variables for database, Stripe keys, and session secret.

## External Dependencies

- **Payment Processing**: Stripe (`@stripe/stripe-js`, `@stripe/react-stripe-js`), WeChat Pay (UI placeholder).
- **Database Hosting**: Neon serverless PostgreSQL.
- **Object Storage**: Replit App Storage (Google Cloud Storage), `@google-cloud/storage` SDK.
- **File Upload**: Uppy (`@uppy/core`, `@uppy/react`, `@uppy/dashboard`, `@uppy/aws-s3`) for admin music file uploads.
- **Icon Library**: React Icons (lucide-react, react-icons/si).
- **Date Utilities**: `date-fns`.
- **Command Palette**: `cmdk`.
- **Contact Form**: Formspree (for contact form submission).
- **Development Tools**: Replit-specific plugins, error overlay, cartographer.

## Technical Implementation Details

### Object Storage Service (`server/objectStorage.ts`)
- **ObjectStorageService**: Singleton service managing music file operations.
  - `getObjectEntityUploadURL()`: Generates presigned PUT URLs for Uppy uploads.
  - `getObjectEntityFile()`: Retrieves file objects from storage paths.
  - `downloadObject()`: Streams files to HTTP responses with proper caching headers.
  - `normalizeObjectEntityPath()`: Converts storage URLs to normalized entity paths.
  - `trySetObjectEntityAclPolicy()`: Sets ACL policies for uploaded files.

### ACL System (`server/objectAcl.ts`)
- **Access Control**: Metadata-based ACL policy stored with each file.
  - **Owner**: User ID of file uploader (admin).
  - **Visibility**: `public` (accessible by all) or `private` (owner only).
  - **Permissions**: `READ` (view/download) and `WRITE` (modify/delete).

### API Endpoints for File Management
- `GET /objects/:objectPath(*)`: Serves uploaded music files with ACL-based access control and caching.
- `POST /api/objects/upload`: Generates presigned upload URL (admin only).
- `PUT /api/music-files`: Associates uploaded file with order, sets public ACL (admin only).

### API Endpoints for Music Showcase
- `GET /api/music/public`: Returns public music tracks, prioritizing showcase tracks.
- `POST /api/admin/showcase-music`: Adds new showcase music with bilingual metadata (admin only).