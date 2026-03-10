# Hospital Bill Calculator

A professional medical billing calculator for hospitals and clinics. Manage bills for outpatient and inpatient services with comprehensive database management.

## Features

- **Outpatient Billing**: Quick calculations for lab tests, x-rays, consultations
- **Inpatient Billing**: Manage admission fees, room charges, surgical procedures
- **Database Management**: Configure medical items, pricing, and categories
- **Settings**: Customize app appearance and billing settings
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Quick Start

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5000`

## Build for Production

```bash
npm run build
npm start
```

## Standalone HTML

For quick previews without a server, use the standalone HTML files:
- `styled_standalone.html` - Full-featured mobile-optimized version

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Wouter
- **Backend**: Express.js, SQLite (better-sqlite3)
- **Database**: Drizzle ORM
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form with Zod validation
- **State**: TanStack Query

## License

MIT
