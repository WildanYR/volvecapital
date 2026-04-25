# 📋 VCTest Project - Setup & Running Guide

## 🎯 Project Overview

**Project Name**: Volvecapital (VCTest)
**Version**: 2.5.0
**Description**: Manajemen Persewaan Akun (Account Rental Management System)
**License**: AGPL-3.0-only

### 📁 Project Structure
```
VCTest (Monorepo dengan pnpm workspace)
├── apps/
│   ├── api/              (Backend - NestJS)
│   ├── dashboard/        (Frontend - React + Vite + TanStack)
│   └── gas-global-config/ (Google Apps Script Config)
├── packages/
│   ├── eslint-config/    (Shared ESLint config)
│   └── shared-types/     (Shared TypeScript types)
```

---

## 🔧 Tech Stack

### Backend (API)
- **Framework**: NestJS 11.0.1
- **Language**: TypeScript 5.9.2
- **Database**: PostgreSQL dengan Sequelize ORM
- **Cache**: Redis (ioredis)
- **Real-time**: Socket.IO + WebSocket
- **Queue**: Task Queue System
- **Auth**: JWT (jsonwebtoken)
- **Logger**: Winston
- **Migration Tool**: Umzug
- **Testing**: Jest

### Frontend (Dashboard)
- **Framework**: React 19.0.0
- **Bundler**: Vite 6.3.5
- **Language**: TypeScript 5.7.2
- **Router**: TanStack Router
- **State Management**: TanStack React Query (v5)
- **Styling**: Tailwind CSS 4.0.6
- **UI Components**: Radix UI + shadcn/ui
- **Form**: TanStack React Form
- **Testing**: Vitest 3.0.5
- **Charts**: Recharts

### DevOps & Tools
- **Package Manager**: pnpm 10.26.2 (workspace)
- **Linting**: ESLint 9.39.2
- **Task Management**: umzug (database migrations)

---

## 📋 Prerequisites

### System Requirements
- **Node.js**: v18+ (recommended v22.18.5)
- **pnpm**: v10.26.2
- **PostgreSQL**: v12+ (for database)
- **Redis**: v6+ (for caching)

### Instalasi Tools

#### 1. Install Node.js & pnpm
```bash
# Download Node.js dari https://nodejs.org/
# Versi stable terbaru (v22+)

# Install pnpm secara global
npm install -g pnpm@10.26.2

# Verifikasi
node --version
npm --version
pnpm --version
```

#### 2. Install PostgreSQL
```bash
# Windows: Download dari https://www.postgresql.org/download/windows/
# Linux: sudo apt-get install postgresql postgresql-contrib
# macOS: brew install postgresql

# Setelah install, pastikan service PostgreSQL berjalan
# Windows: Services > PostgreSQL
# Linux/macOS: brew services start postgresql
```

#### 3. Install Redis
```bash
# Windows: Download dari https://github.com/microsoftarchive/redis/releases
#         Atau gunakan Docker: docker run -d -p 6379:6379 redis
# Linux: sudo apt-get install redis-server
# macOS: brew install redis

# Setelah install, pastikan service Redis berjalan
# Windows: Services > Redis
# Linux/macOS: brew services start redis
```

---

## 🚀 Step-by-Step Setup

### Step 1: Persiapkan Database PostgreSQL

```sql
-- Buka PostgreSQL CLI atau GUI (pgAdmin)
-- Jalankan perintah berikut:

-- Buat database master
CREATE DATABASE volvecapital
  WITH OWNER postgres
  ENCODING 'UTF8'
  LC_COLLATE 'en_US.UTF-8'
  LC_CTYPE 'en_US.UTF-8';

-- Koneksikan ke database baru
\c volvecapital

-- Verifikasi
\l -- list semua database
```

### Step 2: Clone & Setup Project

```bash
# 1. Navigate ke project folder
cd e:\latihan\ coding\VCTest\VCTest

# 2. Install dependencies menggunakan pnpm
pnpm install

# Status: pnpm akan install semua dependencies untuk semua workspace (api + dashboard)
```

### Step 3: Konfigurasi Environment Variables

#### A. Backend API (.env file)

```bash
# Navigasi ke folder api
cd apps/api

# Copy .env.example ke .env
cp .env.example .env

# Edit file .env dengan text editor (VS Code)
```

**Isi file `apps/api/.env`:**
```bash
# Application
APP_URL=http://localhost:3000
PORT=3000
SECRET=your_app_secret_key_change_this_to_random_string

# Database Master (untuk tenant management)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/volvecapital
DATABASE_MIGRATION_URL=postgres://postgres:postgres@localhost:5432/volvecapital

# Tenant Schemas (pisahkan dengan koma jika multiple)
TENANT_SCHEMAS=papapremium

# Redis Cache
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

```

#### B. Frontend Dashboard (.env file)

```bash
# Navigasi ke folder dashboard
cd ../dashboard

# Copy .env.example ke .env
cp .env.example .env

# Edit file .env
```

**Isi file `apps/dashboard/.env`:**
```bash
VITE_MASTER_URL=http://localhost:3000
```

### Step 4: Jalankan Database Migrations

```bash
# Kembali ke folder api
cd ../api

# Run database migrations (buat schema & tables)
# Option 1: Menggunakan npm script
pnpm run start:dev

# Option 2: Manual migration (jika script error)
# node migrate.js
```

**What happens during migration:**
- Create master database tables (tenant, task-queue, etc)
- Create tenant database schemas
- Create all required tables per tenant

---

## ✅ Running the Project

### Option 1: Parallel Development (Recommended)

```bash
# Dari root folder (e:\latihan coding\VCTest\VCTest)
cd e:\latihan\ coding\VCTest\VCTest

# Jalankan backend dan frontend secara bersamaan
pnpm dev

# Output:
# - Backend (API): http://localhost:3000
# - Frontend (Dashboard): http://localhost:3000 (dari vite config, port 3000)
```

### Option 2: Separate Terminals

#### Terminal 1: Backend API
```bash
cd e:\latihan\ coding\VCTest\VCTest\apps\api
pnpm run start:dev

# Server akan start di http://localhost:3000
# Watch mode aktif - auto-reload saat ada perubahan file
```

#### Terminal 2: Frontend Dashboard
```bash
cd e:\latihan\ coding\VCTest\VCTest\apps\dashboard
pnpm run dev

# Server akan start di http://localhost:3000
# Hot reload aktif - auto-refresh saat ada perubahan file
```

---

## 📍 Important Configuration Details

### Database Architecture

```
PostgreSQL
├── volvecapital (Master Database)
│   ├── tenant table
│   ├── task_queue table
│   ├── email_subject table
│   ├── syslog table
│   └── ...other master tables
│
└── papapremium (Tenant Schema - dalam database yang sama)
    ├── email table
    ├── product table
    ├── product_variant table
    ├── account table
    ├── account_user table
    ├── transaction table
    ├── transaction_item table
    ├── revenue_statistics table
    ├── product_sales_statistics table
    ├── peak_hour_statistics table
    ├── platform_statistics table
    └── ...other tenant tables
```

### Migration Files Location
- **Master Migrations**: `apps/api/migrations/master/`
- **Tenant Migrations**: `apps/api/migrations/tenant/`

### API Endpoints Structure
- **Base URL**: http://localhost:3000
- **Health Check**: GET `/`
- **WebSocket**: ws://localhost:3000/socket.io

### Frontend Setup
- **Framework**: React 19 + TypeScript
- **Routing**: TanStack Router (file-based routing in src/routes/)
- **Data Fetching**: TanStack React Query
- **Styling**: Tailwind CSS + Radix UI
- **State**: Local state + Query Cache

---

## 🧪 Testing

### Backend Unit Tests
```bash
cd apps/api

# Run unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:cov
```

### Backend E2E Tests
```bash
cd apps/api

# Run E2E tests
pnpm test:e2e
```

### Frontend Tests
```bash
cd apps/dashboard

# Run tests
pnpm test
```

---

## 🏗️ Building for Production

### Build Backend
```bash
cd apps/api

# Build TypeScript
pnpm run build

# Output akan berada di: dist/

# Jalankan production build
pnpm run start:prod
```

### Build Frontend
```bash
cd apps/dashboard

# Build untuk production
pnpm run build

# Output akan berada di: dist/

# Preview build secara lokal
pnpm run serve
```

### Build All
```bash
# Dari root folder
pnpm build
```

---

## 🐛 Troubleshooting

### Issue 1: Port Already in Use
```bash
# Jika port 3000 sudah digunakan
# Ubah PORT di .env atau di package.json script

# Lihat proses yang menggunakan port 3000
netstat -ano | findstr :3000

# Kill process (Windows PowerShell)
taskkill /PID <PID> /F
```

### Issue 2: Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:**
- Pastikan PostgreSQL service berjalan
- Verifikasi DATABASE_URL di .env
- Check user postgres dan password
- Pastikan database `volvecapital` sudah dibuat

### Issue 3: Redis Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution:**
- Pastikan Redis service berjalan
- Verifikasi REDIS_HOST dan REDIS_PORT di .env
- Gunakan `redis-cli` untuk test connection

### Issue 4: pnpm install Error
```bash
# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
pnpm install
```

### Issue 5: Migration Failed
```bash
# Check migration status
node migrate.js status

# Manual reset (HATI-HATI: akan delete semua data!)
# Backup database terlebih dahulu, kemudian:
# Uncomment reset logic di apps/api/migrate.js
node migrate.js reset
```

---

## 📦 Important Commands Summary

```bash
# Root level commands (workspace)
pnpm install              # Install all dependencies
pnpm dev                  # Start all apps in parallel
pnpm build                # Build all apps
pnpm test                 # Test all apps
pnpm lint                 # Lint all apps

# Backend specific
cd apps/api
pnpm run start:dev        # Start backend in watch mode
pnpm run build            # Build backend
pnpm test                 # Run backend tests

# Frontend specific
cd apps/dashboard
pnpm run dev              # Start frontend dev server
pnpm run build            # Build frontend for production
pnpm test                 # Run frontend tests
```

---

## 🔑 Key Files to Know

### Backend
- **Entry Point**: `apps/api/src/main.ts`
- **App Module**: `apps/api/src/app.module.ts`
- **Configs**: `apps/api/src/configs/`
- **Database**: `apps/api/src/database/`
- **Modules**: `apps/api/src/modules/`
- **Types**: `packages/shared-types/src/types/`

### Frontend
- **Entry Point**: `apps/dashboard/src/main.tsx`
- **Routes**: `apps/dashboard/src/routes/`
- **Components**: `apps/dashboard/src/components/`
- **Services**: `apps/dashboard/src/services/`
- **Hooks**: `apps/dashboard/src/hooks/`
- **Config**: `apps/dashboard/vite.config.js`

---

## 📚 Useful Resources

- **NestJS Docs**: https://docs.nestjs.com/
- **React Docs**: https://react.dev/
- **TanStack Router**: https://tanstack.com/router/latest
- **Tailwind CSS**: https://tailwindcss.com/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Redis**: https://redis.io/documentation
- **Sequelize**: https://sequelize.org/docs/v6/

---

## ✨ Project Features (Based on Code Analysis)

- ✅ Multi-tenant architecture dengan PostgreSQL
- ✅ User & Account Management
- ✅ Product & Product Variant Management
- ✅ Transaction & Transaction Item Management
- ✅ Email Management & Forwarding
- ✅ Real-time Updates dengan WebSocket
- ✅ Task Queue System
- ✅ Statistics & Analytics (Revenue, Sales, Peak Hours, Platform)
- ✅ JWT Authentication
- ✅ Redis Caching
- ✅ Comprehensive Logging dengan Winston
- ✅ Database Migrations
- ✅ Responsive Dashboard UI dengan shadcn/ui

---

## 🎓 Quick Checklist for Running

- [ ] Install Node.js v18+
- [ ] Install pnpm 10.26.2
- [ ] Install PostgreSQL v12+
- [ ] Install Redis v6+
- [ ] Create database `volvecapital`
- [ ] Clone/Extract project
- [ ] Run `pnpm install` di root folder
- [ ] Create `.env` di `apps/api` dari `.env.example`
- [ ] Create `.env` di `apps/dashboard` dari `.env.example`
- [ ] Run migrations (automatic saat `pnpm run start:dev`)
- [ ] Run `pnpm dev` atau jalankan backend & frontend terpisah
- [ ] Access http://localhost:3000

---

**Last Updated**: April 24, 2026
**Created for**: VCTest Project Analysis
