# Hospital Bill Calculator - Replit Migration

## Overview
A professional medical billing calculator application for hospitals and clinics. The app allows users to calculate bills for both outpatient and inpatient services, with comprehensive database management for medical items and procedures.

## Recent Changes
- **2025-01-25**: Successfully migrated from Replit Agent to standard Replit environment
- **2025-01-25**: Converted from PostgreSQL to in-memory storage for Replit compatibility
- **2025-01-25**: Fixed all TypeScript and LSP errors in storage system
- **2025-01-25**: Implemented complete API routes for medical items and bills management
- **2025-01-25**: Set up TanStack Query client for frontend API calls
- **2025-01-25**: FIXED: Comprehensive color system with consistent dark green medical theme
- **2025-01-25**: FIXED: Button contrast issues - white buttons with white labels resolved
- **2025-01-25**: Added medical-themed button variants (medical, medical-outline, medical-ghost)
- **2025-01-25**: Updated all components to use consistent medical color palette
- **2025-01-25**: Enhanced navigation header with proper medical gradient and contrast
- **2025-01-25**: Implemented glass morphism effects for cards with hover animations
- **2025-01-25**: Simplified currency system to use only Bangladeshi Taka (৳) as requested
- **2025-01-25**: Updated Outpatient calculator with complete API integration and Taka formatting
- **2025-01-25**: Updated Inpatient calculator with matching design, daily rates, and Taka system
- **2025-01-25**: Removed unnecessary multi-currency complexity per user preference
- **2025-01-25**: COMPLETED: Full migration from Replit Agent to standard Replit environment
- **2025-01-25**: Enhanced Outpatient categories with Registration Fees, Dr. Fees, and Medic Fee
- **2025-01-25**: Removed search functionality for Registration Fees, Dr. Fees, and Medic Fee categories
- **2025-01-25**: Added more detailed medical items for the three primary fee categories
- **2025-01-25**: Implemented carousel navigation for Outpatient categories with left/right arrows
- **2025-01-25**: Added focused view mode where selected category appears centered with navigation controls
- **2025-01-25**: Added X button to exit carousel mode and return to grid view
- **2025-01-25**: Enhanced carousel with preview buttons showing previous/next category names
- **2025-01-25**: Added intuitive navigation with clickable preview buttons for better user experience
- **2025-01-25**: Improved carousel alignment with left/right aligned preview buttons
- **2025-01-25**: Hidden global search bar in carousel mode for cleaner focused interface
- **2025-01-25**: Implemented identical carousel navigation system for Inpatient categories
- **2025-01-25**: Added same preview buttons, arrow navigation, and X button functionality to Inpatient
- **2025-01-25**: Implemented carousel navigation system for Database page category browsing
- **2025-01-25**: Added focused category view with preview buttons and navigation controls for Database management
- **2025-01-25**: ENFORCED: Complete Taka-only currency system - removed all non-Taka references
- **2025-01-25**: Standardized all price displays to use ৳ symbol with consistent formatting
- **2025-01-25**: Added persistent "Add Items" button to Database carousel for easy item creation
- **2025-01-25**: Enhanced Database navigation with always-active add functionality in both grid and carousel modes
- **2025-01-25**: UPDATED: Moved "Add Items" to appear under carousel categories for current category context
- **2025-01-25**: Pre-populates category field when adding items from carousel view for better workflow
- **2025-01-25**: CLEANED: Removed duplicate "Add Item" button from carousel - using existing button before search
- **2025-01-25**: CORRECTED: Removed "Add Item" from grid view, kept it in carousel view for category-specific item creation

## Project Architecture
- **Frontend**: React with TypeScript, using shadcn/ui components and wouter for routing
- **Backend**: Express.js server with in-memory storage (MemoryStorage class)
- **API**: Complete REST API with medical items and bills endpoints
- **Styling**: Tailwind CSS with professional dark green medical theme
- **Data Management**: TanStack Query for server state, in-memory storage for persistence
- **Theme**: Glass morphism effects, consistent medical color palette, proper contrast ratios

## Key Features
- Outpatient bill calculation with 10+ categories
- Inpatient bill calculation with 19+ categories and daily rates
- Database management for medical items and procedures
- Real-time search and filtering
- Bill persistence in local storage

## User Preferences
- Language: English
- Technical Level: Non-technical user interface
- Focus: Professional medical billing accuracy
- Currency: Bangladeshi Taka (৳)
- Color Scheme: Professional-level dark theme with glass morphism effects
- UI Design: Glass cards with backdrop blur, neo-morphic shadows, and emerald accents
- UI Layout: Grid button layout for categories (6 buttons per row preferred)
- Button Style: Left-aligned text, rounded corners, enhanced shadows and hover effects
- Navigation: Dark gradient header with glass effects and emerald accents
- Total Section: Dark green color scheme with emerald gradient background

## Migration Tasks - COMPLETED
- [x] Install missing dependencies (react-router-dom, sonner)
- [x] Migrate from react-router-dom to wouter for Replit compatibility
- [x] Fix database initialization and local storage integration
- [x] Ensure proper client/server separation
- [x] Test all features work correctly in Replit environment
- [x] Implement user-requested grid button layout for categories