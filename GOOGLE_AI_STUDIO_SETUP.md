# Hospital Bill Calculator - Google AI Studio Setup

This app is fully compatible with Google AI Studio (Google Colab) and any Node.js environment.

## Quick Start in Google Colab

```bash
# 1. Clone or upload your project
# 2. Install dependencies
npm install

# 3. Run the development server
npm run dev
```

The app will start on `http://localhost:5000`

In Colab, use ngrok or similar to expose the local port:
```bash
# Install ngrok in Colab
npm install -g ngrok

# In another Colab cell:
!ngrok http 5000
```

## Features

- ✅ Pure Node.js & Express backend
- ✅ React frontend with no external dependencies
- ✅ Local SQLite database (hospital.db)
- ✅ Zero Replit-specific code
- ✅ Portable to any environment

## Project Structure

```
├── server/           # Express backend
│   ├── index.ts     # Server entry point
│   ├── routes.ts    # API routes
│   ├── storage.ts   # Database operations
│   └── db.ts        # SQLite setup
├── client/          # React frontend
│   ├── src/
│   │   ├── pages/   # Page components
│   │   └── components/
│   └── index.html
├── shared/          # Shared types & schema
└── hospital.db      # SQLite database (auto-created)
```

## API Endpoints

- `GET /health` - Server health check
- `GET /api/health` - API health check
- `GET /api/medical-items` - Get all medical items
- `POST /api/bills` - Save a bill
- `GET /api/bills/:sessionId` - Get bill by session

## Environment Variables

None required! The app uses local SQLite by default.

## Troubleshooting

**Port 5000 already in use?**
Edit `server/index.ts` line 60 to use a different port:
```typescript
const port = process.env.PORT || 8080;
```

**Better-sqlite3 build issues?**
If running on Windows or macOS M1/M2, you may need:
```bash
npm install --build-from-source
```

## Building for Production

```bash
npm run build
npm run start
```

This creates an optimized production build in `dist/`
