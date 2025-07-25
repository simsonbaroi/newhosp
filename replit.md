# Hospital Bill Calculator - Replit Migration

## Overview
A professional medical billing calculator application for hospitals and clinics. The app allows users to calculate bills for both outpatient and inpatient services, with comprehensive database management for medical items and procedures.

## Recent Changes
- **2025-01-25**: Started migration from Lovable to Replit environment
- **Migration Status**: In progress - fixing dependencies and routing

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

## Migration Tasks
- [ ] Install missing dependencies (react-router-dom, sonner)
- [ ] Migrate from react-router-dom to wouter for Replit compatibility
- [ ] Fix database initialization and local storage integration
- [ ] Ensure proper client/server separation
- [ ] Test all features work correctly in Replit environment