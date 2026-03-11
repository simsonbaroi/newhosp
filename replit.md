# Hospital Bill Calculator

## Overview
A professional medical billing calculator application for hospitals and clinics. Enables calculation of bills for outpatient and inpatient services with comprehensive database management.

## Project Scope
**Web Application Only** - Professional medical billing system focused on core functionality.
- ✅ Outpatient and Inpatient billing
- ✅ Database management for medical items
- ✅ Settings system for customization
- ✅ Responsive design (mobile & desktop)
- ❌ AI features (removed - simplified)
- ❌ Mobile native app (web-only)

## User Preferences
- Language: English
- Technical Level: Non-technical user interface
- Focus: Professional medical billing accuracy
- Currency: Bangladeshi Taka (৳)
- Color Scheme: Professional-level dark theme with glass morphism effects

## Technology Stack
**Frontend:**
- React 18 + TypeScript
- Tailwind CSS with dark theme
- shadcn/ui components (only essential: card, button, dialog, select, badge, input, toast, toast notifications)
- Wouter for routing
- TanStack Query for state management

**Backend:**
- Express.js
- SQLite (better-sqlite3)
- Drizzle ORM with Zod validation

**UI/UX:**
- Lucide React icons
- Glass-morphism design
- Mobile-first responsive layouts
- Smooth animations

## Project Structure
```
hospital-bill-calculator/
├── client/
│   ├── src/
│   │   ├── pages/          # Main pages (Index, Outpatient, Inpatient, Database, Settings)
│   │   ├── components/     # Layout, essential UI components
│   │   ├── hooks/          # Custom hooks (useToast, useMobileDetect, currency formatting)
│   │   ├── lib/            # Utilities, query client, database helpers
│   │   └── App.tsx         # Main router
│   └── index.html
├── server/
│   ├── index.ts            # Express server
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # In-memory data persistence
│   └── vite.ts             # Vite integration
├── shared/
│   ├── schema.ts           # Database schema (Drizzle)
│   └── categories.ts       # Medical categories (8 outpatient, 19 inpatient)
├── styled_standalone.html  # Mobile-first standalone app with all features
└── package.json
```

## Features Implemented
- **Outpatient Billing**: Categories include registration, Dr fees, medicines, lab, x-ray, physical therapy
- **Inpatient Billing**: Room charges, daily rates, registration, admission, ICU, surgery, procedures
- **Database Management**: Add/edit/delete medical items with category management
- **Settings Page** (6 comprehensive tabs):
  - Categories: Add/delete outpatient & inpatient categories
  - Buttons: Configure terminal quick-access buttons (outpatient/inpatient)
  - Appearance: 6 theme presets + custom HSL color slider
  - General: App name, logo/favicon upload
  - Database: SQL interface, export, re-seed defaults
  - System: System info & health status
- **Responsive Design**: Mobile-optimized navigation, split-pane calculator, floating bill drawer
- **Standalone HTML**: Complete app as single HTML file for quick previews

## Latest Updates (2026-03-11)
**Settings System & Full Theme System:**
- Settings button added to main navigation (right of Database)
- Full Settings.tsx page with 6 tabs (Categories, Buttons, Appearance, General, Database, System)
- Terminal buttons configuration: Create custom quick-access buttons for outpatient/inpatient
- **Light/Dark Mode Toggle**: Prominent button in main header (top-left, Sun/Moon icon)
  - Visible from every page - always accessible
  - Click to instantly toggle between light and dark modes
  - Professional medical color themes (MCH-Stable inspired)
- **Light Mode**: Clean white backgrounds (97% lightness), dark text (10% lightness), emerald accents
  - Perfect for daytime use and printing
  - High contrast for medical accuracy
  - Professional hospital appearance
- **Dark Mode**: Professional dark theme (6% background), light text (95%), emerald green accents with glass-morphism
  - Easy on eyes for night use
  - Professional medical appearance
- Theme presets: 6 pre-configured colors (Emerald, Cobalt, Amethyst, Rose, Amber, Slate) + custom HSL slider (0-360°)
- Additional toggle in Settings → Appearance tab for advanced users
- SQLite query interface: Run SQL queries, view results
- Database operations: Export, re-seed defaults, reset to defaults
- System monitoring: Database type, category count, button count, health status
- Button persistence: Terminal buttons saved to localStorage
- Theme persistence: Light/Dark mode saved to localStorage
- Logo/Favicon management: Upload custom branding

## How to Use Theme Toggle
1. Look for the **beautiful animated toggle button** in the top-left corner of the header
   - **☀️ Spinning Sun** when in dark mode
   - **🌙 Pulsing Moon** when in light mode
2. Click it to instantly switch between light and dark modes
3. Your preference is automatically saved and remembered on your next visit
4. Also available in Settings → Appearance tab for detailed theme customization

## Theme Default
- **Light Mode** is now the default (professional medical application theme, MCH-Stable inspired)
- Click to switch to dark mode
- Your choice is persistent across sessions

## Home Page Features
- **Responsive Hero Section** with improved typography and spacing
- **Beautiful Feature Cards** with icon backgrounds and hover effects
- **Statistics Section** showing categories and customization options
- **Animated Toggle Button** with smooth transitions
- **Professional Medical Theme** optimized for both light and dark modes

## Previous Cleanup (2026-03-10)
**Removed (No Feature Loss):**
- 38 unused UI component files (accordion, avatar, breadcrumb, calendar, carousel, chart, checkbox, collapsible, command, context-menu, dropdown-menu, form, hover-card, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, separator, sheet, sidebar, skeleton, slider, switch, table, tabs, textarea, toggle-group, toggle, tooltip)
- AIAnalytics.tsx (old AI feature, not used in current app)
- CupertinoDateTimePicker.tsx (mobile-only component)
- Deployment files: Dockerfile, docker-compose.yml, render.yaml
- Platform-specific docs: GOOGLE_AI_STUDIO_SETUP.md, RENDER_SETUP.md
- Outdated folders: docs/, mobile/
- Archive file: project_code.tar.gz
- Duplicate HTML: standalone_app.html

**Cleaned Up Dependencies:**
- Removed unused: react-router-dom, framer-motion, react-resizable-panels, next-themes, recharts, regression, simple-statistics, tw-animate-css, embla-carousel-react, p-limit, p-retry
- Kept only essential: React, TanStack Query, Express, Drizzle, Zod, Tailwind, Lucide, form libraries

**Simplified Documentation:**
- Consolidated README with essential info
- Cleaned .gitignore to necessary entries
- Removed CONTRIBUTING.md (not needed for single developer)

## Current App Size
- **UI Components**: 13 essential files only
- **Main Pages**: 5 pages (Index, Outpatient, Inpatient, Database, Settings)
- **Dependencies**: ~32 production packages (down from 50+)
- **Standalone File**: styled_standalone.html (37KB - includes all features)

## API Endpoints
- `GET /api/items` - Fetch medical items
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `GET /api/settings` - Fetch app settings
- `PUT /api/settings` - Update settings

## Development
```bash
npm install
npm run dev        # Start dev server on port 5000
npm run check      # Type checking
npm run build      # Build for production
npm start          # Run production build
```

## Deployment Options
- Railway, Render, or any Node.js hosting
- Docker support available if needed
- Standalone HTML for quick previews

## Future Considerations
- Could add data export/import (CSV, JSON)
- Could add print-to-PDF functionality
- Could add patient history tracking
- Could add billing reports and analytics

## Notes
- All data stored locally in SQLite (hospital.db)
- No external API dependencies
- No AI or ML features (kept simple and focused)
- No mobile native app (web is responsive and mobile-friendly)
- No authentication system (single-user/local use)
