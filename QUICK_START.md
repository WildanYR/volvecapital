# 🚀 QUICK START GUIDE

## Minimum Setup (5 Menit)

### 1️⃣ Pastikan Tools Sudah Terinstall
```powershell
# Cek versi tools
node --version        # harus v18+
pnpm --version        # harus 10.26.2
psql --version        # PostgreSQL harus installed
redis-cli --version   # Redis harus installed
```

### 2️⃣ Buat Database
```powershell
# Buka PostgreSQL CLI atau pgAdmin GUI
# Jalankan script ini:

CREATE DATABASE volvecapital
  WITH OWNER postgres
  ENCODING 'UTF8'
  LC_COLLATE 'en_US.UTF-8'
  LC_CTYPE 'en_US.UTF-8';

-- Connect ke database
\c volvecapital

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tenant schema
CREATE SCHEMA IF NOT EXISTS "papapremium";
```

### 3️⃣ Setup Project
```powershell
cd e:\latihan\ coding\VCTest\VCTest

# Install dependencies
pnpm install
```

### 4️⃣ Configure Environment Files
**File: `apps/api/.env`**
```bash
APP_URL=http://localhost:3000
PORT=3000
SECRET=your_random_secret_key_here_12345

DATABASE_URL=postgres://postgres:postgres@localhost:5432/volvecapital
DATABASE_MIGRATION_URL=postgres://postgres:postgres@localhost:5432/volvecapital
TENANT_SCHEMAS=papapremium

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

```

**File: `apps/dashboard/.env`**
```bash
VITE_MASTER_URL=http://localhost:3000
```

### 5️⃣ Jalankan Project
```powershell
# Pastikan PostgreSQL & Redis sudah berjalan

# Dari root folder
pnpm dev

# Atau jalankan terpisah:

# Terminal 1 - Backend
cd apps/api
pnpm run start:dev

# Terminal 2 - Frontend
cd apps/dashboard
pnpm run dev
```

### 6️⃣ Akses Aplikasi
```
API Backend: http://localhost:3000
Frontend Dashboard: http://localhost:3000 (dari vite port 3000)
```

---

## ⚠️ Umum Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `connect ECONNREFUSED 127.0.0.1:5432` | PostgreSQL tidak running | Start PostgreSQL service |
| `connect ECONNREFUSED 127.0.0.1:6379` | Redis tidak running | Start Redis service |
| `Password authentication failed` | Database credentials salah | Check DATABASE_URL di .env |
| `Port 3000 already in use` | Port sudah dipakai | Kill process atau ubah PORT |
| `ENOENT: no such file or directory` | File .env tidak ada | Copy dari .env.example |

---

## 📍 File & Folder Penting

```
VCTest/
├── SETUP_GUIDE.md ............ Panduan lengkap
├── database-setup.sql ........ Script database
├── setup.ps1 ................ Setup helper script
├── package.json ............. Workspace config
├── pnpm-workspace.yaml ....... pnpm workspace
│
├── apps/
│   ├── api/ ................. Backend (NestJS)
│   │   ├── .env ............. EDIT INI ⭐
│   │   ├── src/
│   │   │   ├── main.ts ....... Entry point
│   │   │   ├── app.module.ts . App configuration
│   │   │   ├── configs/ ...... Config files
│   │   │   ├── modules/ ...... Feature modules
│   │   │   └── database/ ..... DB connection
│   │   ├── migrations/ ....... Database migrations
│   │   │   ├── master/ ....... Master DB migrations
│   │   │   └── tenant/ ....... Tenant DB migrations
│   │   └── package.json ...... Backend dependencies
│   │
│   ├── dashboard/ ........... Frontend (React + Vite)
│   │   ├── .env ............. EDIT INI ⭐
│   │   ├── src/
│   │   │   ├── main.tsx ...... Entry point
│   │   │   ├── routes/ ....... Page components
│   │   │   ├── components/ ... UI components
│   │   │   ├── services/ ..... API calls
│   │   │   └── hooks/ ........ Custom hooks
│   │   ├── vite.config.js ... Build config
│   │   └── package.json ...... Frontend dependencies
│   │
│   └── gas-global-config/ ... Google Apps Script (optional)
│
└── packages/
    ├── eslint-config/ ....... Shared lint config
    └── shared-types/ ........ Shared TS types
```

---

## 🎯 Common Commands

```bash
# Development
pnpm dev                    # Run all apps parallel
pnpm run -r dev             # Same as above

# Backend only
cd apps/api
pnpm run start:dev          # Run with hot-reload
pnpm run build              # Compile TypeScript
pnpm test                   # Run unit tests

# Frontend only
cd apps/dashboard
pnpm run dev                # Run dev server
pnpm run build              # Build for production
pnpm test                   # Run tests

# Production
pnpm build                  # Build all apps
cd apps/api && pnpm run start:prod
cd apps/dashboard && pnpm run serve

# Other
pnpm lint                   # Fix linting issues
pnpm test                   # Run all tests
```

---

## 🔍 Health Check Endpoints

Setelah setup complete, test endpoints ini:

```bash
# Health check API
curl http://localhost:3000

# Check API response (jika ada handler di root)
# Response: {"message":"Hello World"} atau similar

# WebSocket connection
# ws://localhost:3000/socket.io

# Frontend (buka di browser)
# http://localhost:3000
```

---

## 📚 Tech Stack Quick Reference

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend** | NestJS | 11.0.1 |
| **Frontend** | React | 19.0.0 |
| **Database** | PostgreSQL + Sequelize | 6.37.7 |
| **Cache** | Redis | 5.9.2 (ioredis) |
| **Real-time** | Socket.IO | 4.8.1 |
| **Router (FE)** | TanStack Router | 1.130.2 |
| **Query (FE)** | TanStack React Query | 5.66.5 |
| **Styling** | Tailwind CSS | 4.0.6 |
| **Build** | Vite | 6.3.5 |
| **Package Manager** | pnpm | 10.26.2 |
| **Testing** | Jest/Vitest | 29.7.0/3.0.5 |

---

## 🆘 Bantuan Lebih Lanjut

1. **Setup Detail**: Baca `SETUP_GUIDE.md`
2. **Database Issues**: Lihat `database-setup.sql`
3. **Error Troubleshooting**: Lihat bagian Troubleshooting di SETUP_GUIDE.md
4. **Code Questions**: Lihat README.md di masing-masing folder (api/, dashboard/)

---

**Created**: April 24, 2026  
**For**: VCTest Project  
**Status**: ✅ Ready to Use
