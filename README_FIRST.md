# 🎯 README - Baca Ini Dulu!

## Selamat datang di VCTest Project! 👋

Saya telah menganalisis project Anda secara menyeluruh dan membuat dokumentasi lengkap untuk membantu Anda. Berikut adalah file-file yang telah dibuat:

---

## 📚 Dokumentasi yang Telah Dibuat

### 1. **QUICK_START.md** ⭐ (Baca ini dulu jika terburu-buru)
   - Setup 5 menit
   - Command-command penting
   - Common errors & solutions
   - File/folder penting
   - Lebih singkat & praktis

### 2. **SETUP_GUIDE.md** (Panduan lengkap)
   - Analisis project menyeluruh
   - Penjelasan tech stack
   - Step-by-step setup detil
   - Prerequisites & instalasi tools
   - Database setup
   - Troubleshooting lengkap
   - Resource links

### 3. **SETUP_CHECKLIST.md** (Checklist interaktif)
   - Checklist untuk setiap step
   - Mudah untuk diikuti
   - Verifikasi progress
   - Troubleshooting checklist

### 4. **PROJECT_ANALYSIS.md** (Analisis mendalam)
   - Folder structure detil
   - Data flow & architecture
   - Database schema overview
   - Feature breakdown
   - Development workflow
   - Security features

### 5. **database-setup.sql** (Script database)
   - SQL commands untuk setup database
   - Extension setup
   - Schema creation
   - Copy-paste ke PostgreSQL

### 6. **setup.ps1** (Windows helper script)
   - PowerShell setup automation
   - Check prerequisites
   - Create .env files
   - Run untuk assist

---

## 🚀 Langkah-Langkah Setup (TL;DR)

### 1. **Install Prerequisites** (15-30 menit)
```bash
# 1. Install Node.js v18+
# Download dari https://nodejs.org/

# 2. Install pnpm global
npm install -g pnpm@10.26.2

# 3. Install PostgreSQL
# Download dari https://www.postgresql.org/download/windows/

# 4. Install Redis
# Download atau docker: docker run -d -p 6379:6379 redis
```

### 2. **Setup Database** (5 menit)
```bash
# Buka PostgreSQL pgAdmin atau CLI
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

### 3. **Setup Project** (10 menit)
```bash
# Navigate to project
cd e:\latihan\ coding\VCTest\VCTest

# Install dependencies
pnpm install

# Copy environment files
copy apps/api/.env.example apps/api/.env
copy apps/dashboard/.env.example apps/dashboard/.env
```

### 4. **Configure .env Files** (5 menit)
**File: `apps/api/.env`**
```bash
APP_URL=http://localhost:3000
PORT=3000
SECRET=your_random_secret_key_12345

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

### 5. **Jalankan Project** (instant)
```bash
# Pastikan PostgreSQL & Redis sudah running!

# Dari root folder
pnpm dev

# Atau terpisah:
# Terminal 1: cd apps/api && pnpm run start:dev
# Terminal 2: cd apps/dashboard && pnpm run dev
```

### 6. **Verify** (2 menit)
```bash
# Buka browser
http://localhost:3000

# Backend API seharusnya running
# Frontend seharusnya loading
# Check browser console - seharusnya no errors
```

---

## 📋 Project Info (Snapshot)

| Aspek | Detail |
|-------|--------|
| **Nama** | Volvecapital (VCTest) |
| **Versi** | 2.5.0 |
| **Type** | Monorepo (pnpm workspace) |
| **Backend** | NestJS 11 + TypeScript |
| **Frontend** | React 19 + Vite + TanStack |
| **Database** | PostgreSQL + Sequelize |
| **Cache** | Redis |
| **Real-time** | Socket.IO |
| **License** | AGPL-3.0-only |

### Tech Stack
- **Backend**: NestJS, TypeScript, PostgreSQL, Sequelize, Redis, Socket.IO, JWT, Winston
- **Frontend**: React, TypeScript, Vite, TanStack Router, TanStack Query, Tailwind, Radix UI
- **Tools**: pnpm, ESLint, Jest, Vitest, PostgreSQL migrations
- **Features**: Multi-tenant, Real-time updates, Task queue, Statistics, Email

---

## 🎯 Struktur Folder (Quick Reference)

```
VCTest/
├── apps/
│   ├── api/              Backend (NestJS)
│   │   ├── src/          Source code
│   │   ├── migrations/    Database migrations
│   │   ├── test/         E2E tests
│   │   ├── .env          Environment config (YOU CREATE)
│   │   └── package.json   Dependencies
│   │
│   └── dashboard/        Frontend (React)
│       ├── src/          Source code
│       ├── public/       Static files
│       ├── .env          Environment config (YOU CREATE)
│       └── package.json   Dependencies
│
├── packages/
│   ├── eslint-config/    Shared lint rules
│   └── shared-types/     Shared TypeScript types
│
├── SETUP_GUIDE.md        📖 Panduan lengkap
├── QUICK_START.md        ⚡ Setup cepat
├── SETUP_CHECKLIST.md    ✅ Checklist
├── PROJECT_ANALYSIS.md   🔍 Analisis mendalam
└── database-setup.sql    🗄️ Setup database
```

---

## 💡 Useful Commands

```bash
# Development
pnpm dev                 # Run all apps parallel
pnpm install            # Install dependencies
pnpm lint               # Fix linting
pnpm test               # Run tests

# Backend specific
cd apps/api
pnpm run start:dev      # Run backend watch mode
pnpm run build          # Build backend
pnpm test               # Run backend tests

# Frontend specific
cd apps/dashboard
pnpm run dev            # Run frontend dev
pnpm run build          # Build production
pnpm test               # Run frontend tests

# Production
pnpm run start:prod     # Run backend production
pnpm run serve          # Preview frontend build
```

---

## ⚠️ Sebelum Mulai

**PENTING - CHECKLIST PRE-SETUP:**

- [ ] Node.js v18+ terinstall (`node --version`)
- [ ] pnpm terinstall (`pnpm --version`)
- [ ] PostgreSQL terinstall & service running
- [ ] Redis terinstall & service running
- [ ] VS Code atau editor favorit (optional tapi recommended)

**JIKA BELUM INSTALL**, baca **SETUP_GUIDE.md** bagian "Prerequisites" untuk instalasi.

---

## 🐛 Error Common & Quick Fixes

| Error | Fix |
|-------|-----|
| `ECONNREFUSED 127.0.0.1:5432` | Start PostgreSQL service |
| `ECONNREFUSED 127.0.0.1:6379` | Start Redis service |
| `connect: permission denied` | Check database credentials di .env |
| `Port 3000 already in use` | `taskkill /PID <id> /F` atau ubah PORT |
| `Module not found` | Run `pnpm install` |
| `.env file not found` | Copy dari `.env.example` |

**Lihat SETUP_GUIDE.md section "Troubleshooting" untuk solusi lengkap.**

---

## 📞 Help & Support

Untuk bantuan lebih lanjut:

1. **Quick Setup**: Baca `QUICK_START.md`
2. **Detailed Guide**: Baca `SETUP_GUIDE.md`
3. **Step-by-step**: Follow `SETUP_CHECKLIST.md`
4. **Architecture**: Pelajari `PROJECT_ANALYSIS.md`
5. **Database**: Gunakan `database-setup.sql`

---

## 🎓 Learning Path

1. **Pahami struktur project** → Baca `PROJECT_ANALYSIS.md`
2. **Setup environment** → Follow `SETUP_GUIDE.md` atau `QUICK_START.md`
3. **Jalankan project** → Gunakan command di bagian ini
4. **Explore codebase** → Navigate ke `apps/api/src` dan `apps/dashboard/src`
5. **Baca module README** → Ada di `apps/api/README.md` dan `apps/dashboard/README.md`
6. **Develop features** → Follow folder structure yang ada

---

## 🎉 Next Steps

Setelah setup selesai:

1. ✅ Start `pnpm dev`
2. ✅ Akses http://localhost:3000
3. ✅ Jelajahi UI & API
4. ✅ Baca code di `src` folder
5. ✅ Mulai develop features

---

## 📊 Project Stats

- **Total Size**: Full-stack web application
- **Files**: 100+ source files
- **Components**: 20+ backend modules, multiple React components
- **Database**: 30+ tables across master & tenant schemas
- **Real-time**: WebSocket support via Socket.IO
- **Performance**: Redis caching, query optimization

---

## ✨ Project Features

✅ Multi-tenant account management  
✅ Product & variant management  
✅ Transaction tracking  
✅ Real-time updates via WebSocket  
✅ Email management & forwarding  
✅ Task queue system  
✅ Analytics & statistics  
✅ JWT authentication  
✅ Redis caching  
✅ Comprehensive logging  
✅ Database migrations  
✅ Responsive dashboard  

---

## 🔗 Important Reads

1. **Start**: `QUICK_START.md` (5 min read)
2. **Learn**: `PROJECT_ANALYSIS.md` (10 min read)
3. **Setup**: `SETUP_GUIDE.md` (20 min read)
4. **Verify**: `SETUP_CHECKLIST.md` (reference)

---

**Status**: ✅ Documentation Complete  
**Created**: April 24, 2026  
**For**: VCTest Project  

---

## 🚀 Ready? Mari Dimulai!

Buka `QUICK_START.md` untuk setup cepat, atau `SETUP_GUIDE.md` untuk panduan lengkap.

**Selamat mengoding!** 💻✨
