# Hospital Bill Calculator - Replit Migration

## Overview
A professional medical billing calculator application for hospitals and clinics. The app allows users to calculate bills for both outpatient and inpatient services, with comprehensive database management for medical items and procedures.

## Recent Changes
- **2025-01-25**: Successfully migrated from Lovable to Replit environment
- **2025-01-25**: Implemented grid button layout for categories (6 buttons per row)
- **2025-01-25**: Enhanced button styling with left-aligned text and improved visual design
- **2025-01-25**: Applied comprehensive dark green theme across entire system
- **2025-01-25**: Updated navigation header with emerald gradient and enhanced styling
- **2025-01-25**: Modified category buttons to use emerald color scheme
- **2025-01-25**: Changed currency from Philippine Peso (₱) to Bangladeshi Taka (৳)
- **2025-01-25**: Fixed Outpatient button order: Registration, Dr. Fee, Medic Fee, Off-Charge, Laboratory, X-Ray, Medicine, Procedure, O.R, Physical therapy, Others
- **2025-01-25**: Implemented professional-level dark theme with glass morphism effects, backdrop blur, and neo-morphic shadows

## Project Architecture
- **Frontend**: React with TypeScript, using shadcn/ui components
- **Backend**: Express.js server with in-memory storage
- **Routing**: Currently using react-router-dom (needs migration to wouter)
- **Styling**: Tailwind CSS with custom medical theme
- **Data**: Local storage for bills, in-memory database for items

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