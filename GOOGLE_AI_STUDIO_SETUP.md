# Hospital Bill Calculator - Google AI Studio / Colab Setup

This app is **fully compatible** with Google AI Studio (Google Colab), Kaggle Notebooks, and any Node.js environment.

## How It Works

```
Express Server (port 5000)
    ↓
Vite Dev Server (middleware)
    ↓
React Frontend (served as HTML)
    ↓
SQLite Database (local file: hospital.db)
```

When you run `npm run dev`:
1. Express starts on port 5000
2. Vite injects middleware into Express
3. When you visit `http://localhost:5000`, Express serves the `index.html`
4. React loads and runs in the browser
5. All API calls go to the Express backend

## Quick Start in Google Colab

### Step 1: Install Node.js (if needed)
```bash
!curl https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
!source ~/.bashrc && nvm install 20
```

### Step 2: Upload Your Project
- Upload the entire project folder to Colab

### Step 3: Install Dependencies
```bash
%cd /path/to/project
!npm install
```

### Step 4: Run the Server
```bash
# This will start the dev server on localhost:5000
!npm run dev
```

### Step 5: Expose to the Internet (Optional)
```bash
# Install ngrok
!npm install -g ngrok

# Start ngrok in a new Colab cell
!ngrok http 5000
```

This gives you a public URL like `https://xxxx-xx-xxx-xxx-xx.ngrok.io` to access your app from anywhere.

## Files Served

When you visit `http://localhost:5000`:

```
client/index.html           ← Main HTML file
    ↓
client/src/main.tsx         ← React entry point
    ↓
client/src/App.tsx          ← Main app component
    ↓
client/src/pages/           ← Page components
    ↓
server/routes.ts            ← API endpoints
    ↓
server/db.ts & hospital.db  ← Local SQLite database
```

## API Endpoints

All these work in Google Colab without any configuration:

- `GET /` - Serves React frontend
- `GET /health` - Server health check
- `GET /api/health` - API health check
- `GET /api/medical-items` - List all medical items
- `POST /api/medical-items` - Add new medical item
- `GET /api/bills` - Get all bills
- `POST /api/bills` - Save a bill

## Project Structure

```
hospital-bill-calculator/
├── client/                    # React frontend
│   ├── index.html            # Main HTML (served by Express)
│   ├── src/
│   │   ├── main.tsx          # React entry point
│   │   ├── App.tsx           # Main component
│   │   ├── pages/
│   │   │   ├── Index.tsx     # Home page
│   │   │   ├── Outpatient.tsx
│   │   │   ├── Inpatient.tsx
│   │   │   └── Database.tsx
│   │   └── components/       # UI components
│   └── index.css
├── server/                    # Express backend
│   ├── index.ts             # Server startup
│   ├── routes.ts            # API routes
│   ├── storage.ts           # Database operations
│   ├── vite.ts              # Vite + Express integration
│   └── db.ts                # SQLite setup
├── shared/                    # Shared code
│   └── schema.ts            # Data types & database schema
├── package.json             # Dependencies
├── tsconfig.json
├── vite.config.ts           # Vite configuration
└── hospital.db              # SQLite database (auto-created)
```

## Troubleshooting

### Port 5000 Already in Use?
```bash
# Use a different port
PORT=8080 npm run dev
```

Then visit `http://localhost:8080`

### SQLite Build Issues on M1/M2 Mac?
```bash
npm install --build-from-source
```

### Can't Connect to Frontend?
1. Check that `npm run dev` shows `serving on port 5000`
2. Visit `http://localhost:5000` (not `localhost:5000`)
3. Check browser console (F12) for errors
4. Ensure `client/index.html` exists

### Production Build
```bash
npm run build
npm run start
```

This creates an optimized build in `dist/public`

## Environment Variables

None required! The app uses:
- Local SQLite database by default (hospital.db)
- Port 5000 by default (set `PORT` env var to change)
- Node.js development mode by default

## No External Dependencies

✅ Pure Node.js  
✅ Express backend  
✅ React frontend  
✅ SQLite database  
✅ Zero external APIs  
✅ Works offline  
✅ No Replit required  

## Ready to Deploy Anywhere

This app works on:
- ✅ Google Colab
- ✅ Kaggle Notebooks  
- ✅ Your local machine
- ✅ Any Linux/Mac/Windows server
- ✅ Docker containers
- ✅ Railway, Render, Heroku, etc.

Just run `npm install && npm run dev`!
