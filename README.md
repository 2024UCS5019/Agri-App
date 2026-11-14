# 🚜 Agri Tractor Fleet & Cloud Billing OS (Fleet Edition)

A luxury, high-performance agricultural tractor fleet management and billing web application designed for tractor drivers, operators, and landowners. Fully re-engineered with the modern tech stack specified:

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | **Next.js 14 (App Router) + TypeScript** | High-performance, server-driven & interactive UI with strict types |
| **Styling** | **Tailwind CSS (Obsidian & Emerald Theme)** | Modern, ultra-smooth responsive design with glassmorphic cards |
| **Typography** | **Sora (via `next/font/google`)** | Modern luxury geometric typography for agricultural telemetry |
| **Data Viz** | **Recharts** | Interactive revenue timelines, implement breakdown & recovery ratios |
| **Backend** | **Node.js + Express** | High-speed REST API with secure rate-limiting & Helmet headers |
| **Database** | **MongoDB Atlas + Mongoose** | Resilient cloud document database with offline hybrid fallback |
| **Auth & Security** | **JWT + bcrypt (cost factor 12)** | Timing-safe authentication, HttpOnly cookies, Google OAuth simulation |
| **Deployments** | **Vercel (Frontend) + Render (API)** | Production-ready configuration via `vercel.json` & `render.yaml` |

---

## 🌟 Key Features

1. **Precision Tractor Billing Deck**:
   - Live interactive digital timer (`00:00:00`) with Start, Pause, and Reset controls.
   - Agricultural implement selector chips:
     - Rotavator (₹1,200/hr)
     - Spring Cultivator with 5 to 15 tines selector (₹900 - ₹1,300/hr)
     - Combine Harvester (₹2,400/hr)
     - Disc Cultivator (₹1,100/hr)
     - Laser Land Leveller (₹1,500/hr)
   - Real-time automatic net total calculation.
   - Instant "Generate & Save Invoice" action.

2. **Telemetry & Financial Analytics (Recharts)**:
   - **Monthly Revenue & Field Hours**: Dual-axis smooth area chart tracking seasonal trends.
   - **Payment Status Distribution**: Donut chart with live settlement percentage.
   - **Implement Revenue Breakdown**: Categorized bar charts for all attached implements.

3. **Work Ledger & Searchable History**:
   - Live search by customer name, bill ID, phone, or implement type.
   - Filter by status (`Paid`, `Pending`) and implement.
   - **Instant Status Toggle**: Switch between Paid and Pending with optimistic UI updates.
   - **One-Click CSV Export**: Download the full ledger for accounting.

4. **Printable Luxury Agricultural Tax Invoice**:
   - Printable receipt modal (`window.print()`) formatted for both desktop screens and thermal/A4 printers.
   - Direct WhatsApp sharing link pre-formatted with invoice details.

5. **Driver & Fleet Telemetry**:
   - Operator credentials (Name: **Muthu**, Role: **Driver**, License: `TN-28-2022-0098234`).
   - Machinery specs (**Mahindra 575 DI Sarpanch**, 45 HP, Diesel meter, service indicator).
   - Implement health inventory.

6. **Secure Authentication & Google Account Chooser**:
   - Bcrypt hashing (cost factor 12).
   - Timing-safe error messaging.
   - Simulated interactive Google Account Chooser with quick sign-in as Logesh M (`logeshmuthu2004@gmail.com`) or any custom Google account.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18+ or v20+
- **MongoDB Atlas** connection string (optional; runs in resilient local offline mode automatically if disconnected)

### 2. Run the Express Backend
```bash
cd backend
npm install
npm run dev
# Backend starts on http://localhost:5000
```

### 3. Run the Next.js Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend starts on http://localhost:3000
```

Or from the project root:
```bash
npm run dev:backend
npm run dev:frontend
```

---

## 🚢 Production Deployment

### Frontend (Vercel)
1. Push repository to GitHub.
2. Import project in Vercel.
3. Set **Root Directory** to `frontend`.
4. Configure environment variable:
   - `NEXT_PUBLIC_API_URL`: `https://your-render-backend-url.onrender.com/api`
5. Deploy!

### Backend (Render)
1. In Render, select **New Web Service** connected to your repository.
2. Set **Root Directory** to `backend`.
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `node server.js`
5. Configure Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `your-mongodb-atlas-connection-string`
   - `JWT_SECRET`: `your-secure-jwt-random-secret`
   - `FRONTEND_URL`: `https://your-vercel-frontend-url.vercel.app`
6. Deploy!
