# AI Music Customization Platform - Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing inspiration from premium music platforms (Spotify, Apple Music, SoundCloud) combined with modern Chinese web aesthetics. The design emphasizes emotional connection to music creation while maintaining professional trust for a payment-enabled platform.

**Core Principles**:
- Sonic Visual Language: Gradients and fluid shapes evoke music and sound waves
- Premium Feel: Convey quality to justify payment model
- Effortless Flow: From idea to payment to download should feel seamless
- Trust & Transparency: Clear pricing, order status, and progress indicators

---

## Color Palette

### Dark Mode (Primary)
- **Background Base**: 220 25% 8% (deep blue-black)
- **Surface**: 220 20% 12% (elevated dark surface)
- **Primary Brand**: 270 80% 60% (vibrant purple - from reference image)
- **Secondary Brand**: 220 90% 55% (electric blue)
- **Accent**: 280 75% 65% (lighter purple for CTAs)
- **Success**: 150 70% 50% (music generation complete)
- **Text Primary**: 220 15% 95%
- **Text Secondary**: 220 10% 70%

### Light Mode (Secondary)
- **Background**: 220 30% 98%
- **Surface**: 0 0% 100%
- **Primary**: 270 75% 55% (deeper purple for contrast)
- **Secondary**: 220 85% 50%
- **Text Primary**: 220 25% 15%

### Gradient System
- **Hero Gradient**: Linear from 270 80% 40% to 220 90% 50% (purple to blue, diagonal)
- **Card Accents**: Subtle radial gradients 270 60% 30% with 20% opacity
- **Interactive States**: Gradient shifts on hover (increase saturation by 10%)

---

## Typography

**Primary Font**: Inter or SF Pro Display (modern, clean readability)
**Accent Font**: Montserrat or Archivo (bold headlines with personality)

**Scale**:
- Display (Hero): 4xl to 6xl, font-bold, tracking-tight
- H1: 3xl to 4xl, font-bold  
- H2: 2xl to 3xl, font-semibold
- H3: xl to 2xl, font-semibold
- Body Large: lg, font-normal, leading-relaxed
- Body: base, font-normal, leading-relaxed
- Small/Captions: sm, font-medium, text-secondary
- Buttons: sm to base, font-semibold, tracking-wide, uppercase for primary CTAs

**Chinese Text**: Use system font stack with optimized fallbacks (PingFang SC, Microsoft YaHei)

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-6 to p-8
- Section spacing: py-16 to py-24
- Card gaps: gap-6 to gap-8
- Form fields: space-y-4 to space-y-6

**Grid System**:
- Container: max-w-7xl mx-auto px-6 lg:px-8
- Music Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Dashboard: grid-cols-1 lg:grid-cols-3 (sidebar + content)
- Forms: max-w-2xl for optimal readability

**Responsive Breakpoints**:
- Mobile: base (full-width components)
- Tablet: md (2-column grids)
- Desktop: lg (3-column, expanded spacing)

---

## Component Library

### Navigation
- **Top Bar**: Sticky header with backdrop blur, logo left, auth/user menu right
- **Mobile Menu**: Slide-in drawer with gradient overlay background
- **User Avatar**: Circular with online status indicator (green dot)

### Music Customization Form
- **Input Fields**: Dark surfaces with subtle borders (border-purple-500/30), focus states with glow effect
- **Style Selector**: Grid of cards with icon, label, and selection state (purple gradient border)
- **Mood Tags**: Pill-shaped chips, multi-select with check icons
- **Duration Slider**: Custom purple track with smooth animated thumb
- **Keywords Input**: Tag input with add/remove animations
- **Description**: Textarea with character counter (min 20, max 500 chars)

### Payment Section
- **Payment Method Cards**: Large cards with logos (Stripe, WeChat Pay), radio selection
- **Price Display**: Prominent with currency symbol, discount badges if applicable
- **Payment Button**: Large gradient button, pulse animation on hover
- **Security Badge**: Small lock icon + "Secure Payment" text below

### Order Management
- **Order Cards**: 
  - Header: Order ID + timestamp
  - Body: Music description preview (2 lines truncated)
  - Status Badge: Colored pills (pending=yellow, processing=blue, completed=green, failed=red)
  - Progress Bar: For processing orders with percentage
  - Action Buttons: Download (completed), Cancel (pending)
  
### Music Player Preview (Completed Orders)
- **Waveform Visualization**: Animated bars synced to audio
- **Controls**: Play/pause, progress scrubber, volume, download
- **Track Info**: Title (from description), duration, generation date

### Cards & Surfaces
- **Glassmorphic Cards**: backdrop-blur-xl with subtle borders and gradient overlays
- **Elevation**: Use box shadows (lg for elevated, xl for modals)
- **Hover States**: Lift effect (translate-y-[-2px]) + increased shadow

### Buttons
- **Primary CTA**: Gradient background (purple to blue), white text, rounded-lg, px-8 py-3
- **Secondary**: Outline with gradient border, hover fills gradient
- **Ghost**: Text-only with hover background fade-in
- **Icon Buttons**: Circular, subtle bg, hover scale(1.05)

### Loading States
- **Skeleton Screens**: Animated gradient shimmer on dark surfaces
- **Spinners**: Custom circular with gradient stroke
- **Progress Indicators**: Linear bars with gradient fill, smooth animations

### Notifications/Toasts
- **Success**: Green accent with check icon, slide-in from top-right
- **Error**: Red accent with alert icon
- **Info**: Blue accent with info icon
- **Position**: Fixed top-right, stack vertically

---

## Images

**Hero Section**:
- Large atmospheric image showing abstract music visualization (sound waves, equalizer bars, or particle effects)
- Apply gradient overlay (purple-blue) with 60% opacity for text readability
- Position: Background cover, center-center
- Alternative: AI-generated abstract art representing "music creation" or "sound waves"

**Feature Sections**:
- Icon illustrations for each feature (music note, payment shield, download cloud)
- Style: Line art icons with gradient fills matching brand colors
- Size: 48x48 to 64x64px

**User Dashboard**:
- Default avatar placeholder with user initials in gradient circle
- Music thumbnail placeholders: Waveform patterns or abstract gradients

**Empty States**:
- Illustration showing "No orders yet" - friendly character with headphones
- Style: Minimalist line art with purple accent color

---

## Animations

**Use Sparingly**:
- Page transitions: Subtle fade-in (200ms)
- Form validation: Shake animation for errors
- Music generation: Pulsing glow effect on processing cards
- Download success: Confetti micro-animation (1 second)
- Hover interactions: Scale and shadow changes (150ms ease-out)

**Avoid**: Auto-playing carousels, excessive scroll triggers, distracting background animations