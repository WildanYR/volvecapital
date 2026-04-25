# ✅ VCTest Setup Checklist

## 📋 Pre-Setup Checklist

- [ ] **Node.js v18+** installed
  - [ ] Verify: `node --version`
  - [ ] Download: https://nodejs.org/

- [ ] **pnpm v10.26.2** installed
  - [ ] Verify: `pnpm --version`
  - [ ] Install: `npm install -g pnpm@10.26.2`

- [ ] **PostgreSQL v12+** installed
  - [ ] Verify: `psql --version` atau check Services
  - [ ] Download: https://www.postgresql.org/download/windows/
  - [ ] Service Status: Running ✓

- [ ] **Redis v6+** installed
  - [ ] Verify: `redis-cli --version` atau check Services
  - [ ] Download: https://github.com/microsoftarchive/redis/releases
  - [ ] Service Status: Running ✓

- [ ] **VS Code or IDE** (optional but recommended)
  - [ ] Recommended Extensions:
    - [ ] ESLint
    - [ ] Prettier
    - [ ] Thunder Client / REST Client
    - [ ] PostgreSQL Explorer (optional)

---

## 🗄️ Database Setup Checklist

- [ ] **PostgreSQL Running**
  - [ ] Check Windows Services or run: `psql -U postgres`
  
- [ ] **Create Database**
  ```sql
  CREATE DATABASE volvecapital WITH OWNER postgres ENCODING 'UTF8';
  ```
  - [ ] Database 'volvecapital' created ✓
  - [ ] Verify: `\l` in psql or check pgAdmin
  
- [ ] **Connect to Database**
  ```
  \c volvecapital
  ```
  - [ ] Connected ✓
  
- [ ] **Enable Extensions**
  ```sql
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  ```
  - [ ] uuid-ossp enabled ✓
  - [ ] pgcrypto enabled ✓
  
- [ ] **Create Tenant Schema**
  ```sql
  CREATE SCHEMA IF NOT EXISTS "papapremium";
  ```
  - [ ] Schema 'papapremium' created ✓

---

## 📥 Project Setup Checklist

- [ ] **Navigate to Project**
  ```powershell
  cd e:\latihan\ coding\VCTest\VCTest
  ```
  - [ ] In correct folder ✓
  
- [ ] **Verify Project Structure**
  - [ ] `package.json` exists
  - [ ] `pnpm-workspace.yaml` exists
  - [ ] `apps/api/` folder exists
  - [ ] `apps/dashboard/` folder exists

- [ ] **Install Dependencies**
  ```powershell
  pnpm install
  ```
  - [ ] Installation complete ✓
  - [ ] No errors ✓
  - [ ] Time: ~3-5 minutes
  
- [ ] **Verify Installation**
  ```powershell
  pnpm --version
  pnpm ls
  ```
  - [ ] All packages installed ✓

---

## 🔐 Environment Configuration Checklist

### Backend `.env` Setup
- [ ] **Create `apps/api/.env`**
  ```powershell
  copy apps/api/.env.example apps/api/.env
  ```
  - [ ] File created ✓
  
- [ ] **Edit `apps/api/.env`** (use VS Code or text editor)
  ```bash
  APP_URL=http://localhost:3000
  PORT=3000
  SECRET=your_random_secret_key_here_change_this
  
  DATABASE_URL=postgres://postgres:postgres@localhost:5432/volvecapital
  DATABASE_MIGRATION_URL=postgres://postgres:postgres@localhost:5432/volvecapital
  TENANT_SCHEMAS=papapremium
  
  REDIS_HOST=127.0.0.1
  REDIS_PORT=6379
  
  TELEGRAM_TOKEN=your_telegram_token_here
  ```
  - [ ] APP_URL configured ✓
  - [ ] PORT configured (3000) ✓
  - [ ] SECRET set (random string) ✓
  - [ ] DATABASE_URL correct ✓
  - [ ] REDIS settings correct ✓
  - [ ] TELEGRAM_TOKEN optional but can leave blank ✓
  - [ ] File saved ✓

### Frontend `.env` Setup
- [ ] **Create `apps/dashboard/.env`**
  ```powershell
  copy apps/dashboard/.env.example apps/dashboard/.env
  ```
  - [ ] File created ✓
  
- [ ] **Edit `apps/dashboard/.env`**
  ```bash
  VITE_MASTER_URL=http://localhost:3000
  ```
  - [ ] VITE_MASTER_URL set ✓
  - [ ] File saved ✓

---

## 🗄️ Database Migrations Checklist

- [ ] **PostgreSQL & Redis Running**
  - [ ] PostgreSQL service: Running ✓
  - [ ] Redis service: Running ✓
  
- [ ] **Run Backend (Auto-triggers Migrations)**
  ```powershell
  cd apps/api
  pnpm run start:dev
  ```
  - [ ] Backend started without errors ✓
  - [ ] Migrations completed ✓
  - [ ] Tables created in database ✓
  
- [ ] **Verify Database Tables**
  - [ ] Master tables created (in public schema)
    - [ ] `public.tenant`
    - [ ] `public.tele_notifier`
    - [ ] `public.task_queue`
    - [ ] `public.syslog`
  
  - [ ] Tenant tables created (in papapremium schema)
    - [ ] `papapremium.email`
    - [ ] `papapremium.product`
    - [ ] `papapremium.account`
    - [ ] `papapremium.transaction`
  
  Use pgAdmin or psql to verify:
  ```sql
  \dt public.*
  \dt papapremium.*
  ```

---

## 🚀 Running Project Checklist

### Option 1: Run All Together
- [ ] **From root folder**
  ```powershell
  cd e:\latihan\ coding\VCTest\VCTest
  ```
  
- [ ] **Start all services**
  ```powershell
  pnpm dev
  ```
  - [ ] Backend running ✓ (Port 3000)
  - [ ] Frontend running ✓ (Port 3000 from Vite)
  - [ ] No errors ✓

### Option 2: Run Separately
- [ ] **Terminal 1 - Backend API**
  ```powershell
  cd e:\latihan\ coding\VCTest\VCTest\apps\api
  pnpm run start:dev
  ```
  - [ ] Backend started ✓
  - [ ] Port 3000 ✓
  - [ ] Watch mode enabled ✓
  
- [ ] **Terminal 2 - Frontend Dashboard**
  ```powershell
  cd e:\latihan\ coding\VCTest\VCTest\apps\dashboard
  pnpm run dev
  ```
  - [ ] Frontend started ✓
  - [ ] Hot reload enabled ✓
  - [ ] Server ready ✓

---

## 🧪 Testing Checklist

- [ ] **Backend Health Check**
  ```powershell
  curl http://localhost:3000
  # atau buka di browser: http://localhost:3000
  ```
  - [ ] API responds ✓
  - [ ] No errors ✓

- [ ] **Frontend Access**
  ```
  Open browser: http://localhost:3000
  ```
  - [ ] Dashboard loads ✓
  - [ ] No console errors ✓
  - [ ] Can interact with UI ✓

- [ ] **Redis Connection**
  ```powershell
  redis-cli
  > PING
  # Should return: PONG
  ```
  - [ ] Redis responding ✓

- [ ] **Database Connection**
  ```powershell
  psql -U postgres -d volvecapital
  > SELECT COUNT(*) FROM public.tenant;
  ```
  - [ ] Database connected ✓
  - [ ] Can query tables ✓

---

## 📝 Quick Testing Commands

```bash
# Test Backend
curl -X GET http://localhost:3000

# Test with headers
curl -X GET http://localhost:3000 -H "Content-Type: application/json"

# Test Redis
redis-cli PING

# Test Database
psql -U postgres -d volvecapital -c "SELECT version();"

# Check running ports
netstat -ano | findstr :3000
netstat -ano | findstr :5432
netstat -ano | findstr :6379
```

---

## ⚠️ Troubleshooting Checklist

### Port Already in Use
- [ ] Check: `netstat -ano | findstr :3000`
- [ ] Kill process: `taskkill /PID <PID> /F`
- [ ] Or change PORT in `.env`

### Database Connection Failed
- [ ] [ ] PostgreSQL service running
- [ ] [ ] Database 'volvecapital' created
- [ ] [ ] User postgres has correct password
- [ ] [ ] DATABASE_URL in `.env` is correct
- [ ] [ ] No typos in connection string

### Redis Connection Failed
- [ ] Redis service running
- [ ] REDIS_HOST correct (127.0.0.1)
- [ ] REDIS_PORT correct (6379)
- [ ] Try: `redis-cli PING`

### Migration Failed
- [ ] [ ] Database exists and accessible
- [ ] [ ] Schema 'papapremium' created
- [ ] [ ] Extensions (uuid-ossp, pgcrypto) enabled
- [ ] [ ] Check logs for specific error
- [ ] [ ] Try reset: read SETUP_GUIDE.md

### pnpm install Failed
- [ ] Clear cache: `pnpm store prune`
- [ ] Remove node_modules: `rmdir /S node_modules`
- [ ] Retry: `pnpm install`

---

## ✨ Final Verification Checklist

- [ ] All tools installed & running
- [ ] Database created & configured
- [ ] Project dependencies installed
- [ ] Environment files created & configured
- [ ] Migrations completed
- [ ] Backend running without errors
- [ ] Frontend running without errors
- [ ] Can access http://localhost:3000
- [ ] Console shows no critical errors
- [ ] Database has expected tables

---

## 🎉 Setup Complete!

If all items are checked ✓, your VCTest project is ready!

### Next Steps:
1. Start developing features
2. Explore the codebase
3. Read SETUP_GUIDE.md for more details
4. Check QUICK_START.md for common commands
5. Refer to API & Dashboard README.md for specific docs

### Useful Links:
- Project Structure: See README.md files in apps/api and apps/dashboard
- Database Schema: Check migrations/ folder
- Code Structure: Explore src/ folder in api and dashboard
- Issues?: Check SETUP_GUIDE.md troubleshooting section

---

**Last Checked**: _______________  
**Setup by**: _______________  
**Status**: ✅ READY TO DEVELOP
