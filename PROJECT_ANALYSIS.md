# 🏗️ VCTest Project Architecture & Analysis

**Date**: April 24, 2026  
**Version**: 2.5.0  
**Type**: Full-Stack Monorepo (pnpm workspace)

---

## 📊 Project Overview

**VCTest (Volvecapital)** adalah platform manajemen persewaan akun yang dibangun dengan teknologi modern. Sistem ini menggunakan arsitektur multi-tenant dengan PostgreSQL dan real-time WebSocket untuk update data.

### Key Information
- **Description**: Manajemen Persewaan Akun (Account Rental Management)
- **Author**: WildanYR
- **License**: AGPL-3.0-only
- **Package Manager**: pnpm 10.26.2 (workspace)

---

## 🗂️ Folder Structure Details

```
VCTest/
│
├── 📄 Root Configuration Files
│   ├── package.json ..................... Workspace root config
│   ├── pnpm-workspace.yaml .............. Monorepo workspace config
│   ├── pnpm-lock.yaml .................. Dependency lock file
│   └── README.md ....................... Project readme
│
├── 📚 Documentation (Created for you)
│   ├── SETUP_GUIDE.md .................. Complete setup guide
│   ├── QUICK_START.md .................. 5-minute quick start
│   ├── SETUP_CHECKLIST.md .............. Interactive checklist
│   ├── database-setup.sql .............. Database initialization
│   ├── setup.ps1 ....................... Windows setup helper
│   └── PROJECT_ANALYSIS.md ............. This file
│
├── 📦 apps/
│   │
│   ├── 🔴 api/ (Backend - NestJS)
│   │   ├── src/
│   │   │   ├── main.ts ................. Application entry point
│   │   │   ├── app.module.ts ........... Root module configuration
│   │   │   ├── app.controller.ts ....... Root API controller
│   │   │   ├── app.service.ts ......... Core business logic
│   │   │   │
│   │   │   ├── configs/ ............... Configuration modules
│   │   │   │   ├── app.config.ts ....... Application config
│   │   │   │   ├── database.config.ts .. Database connection
│   │   │   │   ├── redis.config.ts ..... Redis cache config
│   │   │   │   ├── token.config.ts ..... JWT token config
│   │   │   │
│   │   │   ├── constants/ ............. Application constants
│   │   │   │
│   │   │   ├── database/ .............. Database setup
│   │   │   │   ├── database.module.ts .. Database module
│   │   │   │   └── database.service.ts . Connection manager
│   │   │   │
│   │   │   ├── exceptions/ ............ Custom exceptions
│   │   │   │   └── invalid-data.exception.ts
│   │   │   │
│   │   │   ├── filters/ ............... Exception handlers
│   │   │   │   └── exception.filter.ts
│   │   │   │
│   │   │   ├── guards/ ................ Authentication guards
│   │   │   │   └── vc-auth.guard.ts
│   │   │   │
│   │   │   ├── modules/ ............... Feature modules
│   │   │   │   ├── account/
│   │   │   │   ├── account-profile/
│   │   │   │   ├── account-user/
│   │   │   │   ├── product/
│   │   │   │   ├── product-variant/
│   │   │   │   ├── platform-product/
│   │   │   │   ├── email/
│   │   │   │   ├── email-forward/
│   │   │   │   ├── transaction/
│   │   │   │   ├── task-queue/
│   │   │   │   ├── socket/
│   │   │   │   ├── cron/ (Scheduled jobs)
│   │   │   │   ├── statistic/
│   │   │   │   ├── tenant/
│   │   │   │   ├── logger/
│   │   │   │   ├── redis/
│   │   │   │   └── utility/
│   │   │   │
│   │   │   ├── pipes/ ................. Validation pipes
│   │   │   │
│   │   │   └── types/ ................. Type definitions
│   │   │
│   │   ├── migrations/
│   │   │   ├── config.ts .............. Migration configuration
│   │   │   ├── migrator.ts ............ Migration executor
│   │   │   ├── master/
│   │   │   │   ├── 001-create-tenant-table.ts
│   │   │   │   ├── 003-create-task-queue-table.ts
│   │   │   │   ├── 004-create-email-subject-table.ts
│   │   │   │   ├── 005-create-syslog-table.ts
│   │   │   │   └── 006-add-attempt-to-task-queue-table.ts
│   │   │   │
│   │   │   └── tenant/ (Sample tenant schema 'papapremium')
│   │   │       ├── 000-create-updated-at-touch-function.ts
│   │   │       ├── 001-create-email-table.ts
│   │   │       ├── 002-create-product-table.ts
│   │   │       ├── 003-create-product-variant-table.ts
│   │   │       ├── 004-create-platform-product-table.ts
│   │   │       ├── 005-create-account-table.ts
│   │   │       ├── 006-create-account-profile-table.ts
│   │   │       ├── 007-create-account-user-table.ts
│   │   │       ├── 008-create-account-modifier-table.ts
│   │   │       ├── 009-create-transaction-table.ts
│   │   │       ├── 010-create-transaction-item-table.ts
│   │   │       ├── 011-create-revenue-statistics-table.ts
│   │   │       ├── 012-create-product-sales-statistics-table.ts
│   │   │       ├── 013-create-peak-hour-statistics-table.ts
│   │   │       ├── 014-create-platform-statistics-table.ts
│   │   │       ├── 015-add-label-column-to-account.ts
│   │   │       └── ... (more migrations)
│   │   │
│   │   ├── test/
│   │   │   ├── app.e2e-spec.ts ........ E2E tests
│   │   │   └── jest-e2e.json ......... Jest E2E config
│   │   │
│   │   ├── .env.example .............. Environment template
│   │   ├── .env ...................... Environment (you create this)
│   │   ├── package.json .............. Backend dependencies
│   │   ├── tsconfig.json ............. TypeScript config
│   │   ├── tsconfig.build.json ....... Build config
│   │   ├── jest.config.js ............ Jest testing config
│   │   ├── nest-cli.json ............. NestJS CLI config
│   │   ├── README.md ................. Backend specific docs
│   │   ├── aggregate.sql ............. SQL aggregation queries
│   │   ├── api-opt.md ................ API optimization notes
│   │   ├── token-test.js ............. Token testing utility
│   │   ├── migrate.js ................ Migration runner script
│   │   └── eslint.config.mjs ......... ESLint configuration
│   │
│   ├── 🟢 dashboard/ (Frontend - React + Vite)
│   │   ├── src/
│   │   │   ├── main.tsx .............. Application entry point
│   │   │   ├── styles.css ............ Global styles
│   │   │   ├── routeTree.gen.ts ...... Auto-generated routing
│   │   │   │
│   │   │   ├── components/ ........... Reusable UI components
│   │   │   │   └── (UI component files)
│   │   │   │
│   │   │   ├── routes/ ............... Page/Route components
│   │   │   │   ├── __root.tsx ........ Root layout
│   │   │   │   ├── index.tsx ......... Home page
│   │   │   │   └── (other pages)
│   │   │   │
│   │   │   ├── services/ ............. API client services
│   │   │   │   └── (API call utilities)
│   │   │   │
│   │   │   ├── hooks/ ................ Custom React hooks
│   │   │   │   └── (useQuery, useMutation, etc.)
│   │   │   │
│   │   │   ├── lib/ .................. Utility functions
│   │   │   │
│   │   │   ├── context-providers/ .... Context providers
│   │   │   │
│   │   │   ├── constants/ ............ App constants
│   │   │   │
│   │   │   └── types/ ................ Type definitions
│   │   │
│   │   ├── public/
│   │   │   ├── manifest.json ......... PWA manifest
│   │   │   └── robots.txt ............ SEO robots
│   │   │
│   │   ├── .env.example .............. Environment template
│   │   ├── .env ...................... Environment (you create this)
│   │   ├── package.json .............. Frontend dependencies
│   │   ├── tsconfig.json ............. TypeScript config
│   │   ├── vite.config.js ............ Vite build config
│   │   ├── components.json ........... shadcn/ui config
│   │   ├── index.html ................ HTML entry point
│   │   ├── README.md ................. Frontend specific docs
│   │   ├── fe-opt.md ................. FE optimization notes
│   │   ├── eslint.config.mjs ......... ESLint configuration
│   │   └── tailwind.config.js ........ Tailwind CSS config (if exists)
│   │
│   └── 🌐 gas-global-config/ (Google Apps Script - Optional)
│       ├── app-server-new
│       ├── main.go
│       ├── go.mod
│       ├── gas-gmail-hook.js
│       ├── gas-global-config
│       ├── script.js
│       └── data.json
│
└── 📦 packages/ (Shared code)
    ├── eslint-config/ .............. Shared ESLint rules
    │   ├── package.json
    │   ├── react.config.mjs ........ React ESLint config
    │   └── typescript.config.mjs ... TypeScript ESLint config
    │
    └── shared-types/ ............... Shared TypeScript types
        ├── package.json
        └── src/
            ├── types/ .............. Shared type definitions
            └── constants/ .......... Shared constants
```

---

## 🔄 Data Flow & Architecture

### 1. Multi-Tenant Architecture
```
PostgreSQL Database (volvecapital)
├── public schema (Master)
│   ├── tenant (Tenant metadata)
│   ├── task_queue (Background jobs)
│   ├── email_subject (Email templates)
│   └── syslog (System logs)
│
└── papapremium schema (Tenant-specific)
    ├── account (Account management)
    ├── product (Product catalog)
    ├── account_user (Users per account)
    ├── transaction (Financial transactions)
    ├── email (Email management)
    ├── statistics (Analytics data)
    └── ... (other tenant tables)
```

### 2. Request Flow
```
Frontend (React + Vite)
    ↓
[TanStack Router] → Route handling
    ↓
[API Service] → HTTP request
    ↓
Backend API (NestJS)
    ↓
[Express middleware] → Request processing
    ↓
[Guard] → JWT authentication
    ↓
[Controller] → Request routing
    ↓
[Service] → Business logic
    ↓
[Database] → Sequelize ORM
    ↓
[PostgreSQL] → Data persistence
    ↓
[Response] → JSON response
    ↓
[TanStack React Query] → Cache & state
    ↓
Frontend UI → Display data
```

### 3. Real-time Communication
```
Frontend
    ↓
[Socket.IO Client]
    ↓
WebSocket Connection (ws://localhost:3000)
    ↓
Backend
    ↓
[Socket.IO Server] → Event handling
    ↓
[Service] → Process event
    ↓
[Database] → Update data
    ↓
[Broadcast] → Send to all connected clients
    ↓
Frontend → Instant UI update
```

### 4. Background Job Processing
```
Task Queue (PostgreSQL)
    ↓
[Cron Module] → Scheduled tasks
    ↓
[Task Queue Service] → Job processing
    ↓
[Specific handlers]
    ├── Email sending
    ├── Statistics calculation
    └── Other async tasks
```

---

## 🔧 Key Features Breakdown

### Backend Features

| Feature | Location | Technology |
|---------|----------|------------|
| **Authentication** | `src/guards/vc-auth.guard.ts` | JWT + Bearer tokens |
| **Database** | `src/database/` | PostgreSQL + Sequelize |
| **Caching** | `src/modules/redis/` | Redis + ioredis |
| **Real-time** | `src/modules/socket/` | Socket.IO + WebSocket |
| **Email** | `src/modules/email/` | Custom email service |
| **Tasks** | `src/modules/task-queue/` | Job queue system |
| **Statistics** | `src/modules/statistic/` | Analytics + aggregation |
| **Logging** | `src/modules/logger/` | Winston logger |
| **Scheduling** | `src/modules/cron/` | @nestjs/schedule |

### Frontend Features

| Feature | Technology | Purpose |
|---------|-----------|---------|
| **Routing** | TanStack Router v1.130.2 | File-based page routing |
| **Data Fetching** | TanStack React Query v5 | Server state management |
| **Forms** | TanStack React Form v1.19.2 | Form handling & validation |
| **UI Components** | Radix UI + shadcn/ui | Accessible UI primitives |
| **Styling** | Tailwind CSS v4 | Utility-first CSS |
| **Charts** | Recharts v2.15.4 | Data visualization |
| **State** | React hooks | Component state |
| **Notifications** | Sonner v2.0.7 | Toast notifications |
| **Testing** | Vitest v3.0.5 | Unit test runner |
| **Dev Tools** | TanStack DevTools | Debug query & router |

---

## 📊 Database Schema Overview

### Master Schema (public)
```sql
-- Tenant Management
TABLE tenant
- id: UUID
- name: VARCHAR
- schema: VARCHAR (e.g., 'papapremium')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP


-- Task Queue
TABLE task_queue
- id: UUID
- tenant_id: UUID FK
- type: VARCHAR
- payload: JSONB
- status: ENUM
- attempts: INTEGER
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

-- Logs
TABLE syslog
- id: UUID
- tenant_id: UUID FK
- level: VARCHAR
- message: TEXT
- stack_trace: TEXT
- created_at: TIMESTAMP

-- Email Templates
TABLE email_subject
- id: UUID
- name: VARCHAR
- subject: VARCHAR
- template: TEXT
- created_at: TIMESTAMP
```

### Tenant Schema (papapremium)
```sql
-- Account Management
TABLE account
- id: UUID PK
- product_variant_id: UUID FK
- balance: DECIMAL
- status: ENUM (enabled/disabled/frozen)
- label: VARCHAR
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

-- Products
TABLE product
- id: UUID PK
- name: VARCHAR
- description: TEXT
- created_at: TIMESTAMP

TABLE product_variant
- id: UUID PK
- product_id: UUID FK
- name: VARCHAR
- price: DECIMAL
- created_at: TIMESTAMP

-- Users
TABLE account_user
- id: UUID PK
- account_id: UUID FK
- email: VARCHAR
- phone: VARCHAR
- created_at: TIMESTAMP

-- Transactions
TABLE transaction
- id: UUID PK
- account_user_id: UUID FK
- amount: DECIMAL
- platform: VARCHAR
- status: ENUM
- created_at: TIMESTAMP

TABLE transaction_item
- id: UUID PK
- transaction_id: UUID FK
- account_user_id: UUID FK
- type: VARCHAR
- created_at: TIMESTAMP

-- Statistics
TABLE revenue_statistics
- id: UUID PK
- date: DATE
- type: VARCHAR (daily/monthly/yearly)
- total_revenue: DECIMAL

TABLE product_sales_statistics
- id: UUID PK
- date: DATE
- type: VARCHAR
- product_variant_id: UUID FK
- items_sold: INTEGER

TABLE peak_hour_statistics
- id: UUID PK
- date: DATE
- type: VARCHAR
- hour: SMALLINT
- transaction_count: INTEGER

TABLE platform_statistics
- id: UUID PK
- date: DATE
- type: VARCHAR
- platform: VARCHAR
- transaction_count: INTEGER
```

---

## 🚀 Development Workflow

### 1. Local Development
```
pnpm install
├─ Install all workspace dependencies
│  ├─ api dependencies
│  ├─ dashboard dependencies
│  └─ shared packages
│
pnpm dev
├─ Start backend in watch mode
│  ├─ Port 3000
│  ├─ Auto-reload on file change
│  └─ Debug mode available
│
└─ Start frontend in dev mode
   ├─ Port 3000 (Vite)
   ├─ Hot module reload
   └─ Dev tools enabled
```

### 2. Database Migrations
```
Automatic on startup:
1. Run existing migrations from _prisma_migrations
2. Execute new pending migrations
3. Generate artifacts
4. Create tables if not exist
5. Apply constraints & indexes

Or manual:
- cd apps/api
- node migrate.js
```

### 3. Feature Development
```
Backend:
1. Create module: nest g module modules/feature
2. Create controller: nest g controller modules/feature
3. Create service: nest g service modules/feature
4. Add database models/migrations
5. Implement API endpoints
6. Add tests

Frontend:
1. Create route: src/routes/feature.tsx
2. Create components: src/components/feature/
3. Create service: src/services/feature.ts
4. Create types: src/types/feature.ts
5. Implement UI
6. Add tests
```

---

## 📦 Dependencies Overview

### Backend Key Dependencies
- **@nestjs/\***: NestJS framework modules
- **sequelize**: ORM for database operations
- **ioredis**: Redis client for caching
- **socket.io**: Real-time WebSocket communication
- **jsonwebtoken**: JWT authentication
- **winston**: Logging library
- **class-validator**: Input validation
- **umzug**: Database migration tool

### Frontend Key Dependencies
- **react**: UI library
- **@tanstack/react-router**: Routing
- **@tanstack/react-query**: Data fetching & caching
- **@tanstack/react-form**: Form management
- **@radix-ui/\***: Accessible UI components
- **tailwindcss**: CSS framework
- **recharts**: Charting library
- **zod**: Schema validation
- **vite**: Build tool

---

## 🔐 Security Features

1. **Authentication**
   - JWT-based authentication
   - Bearer token validation
   - vc-auth guard on protected routes

2. **Input Validation**
   - Class-validator on DTO
   - Custom validation pipes
   - Sanitization of inputs

3. **CORS**
   - Enabled at application level
   - Configurable origins

4. **Environment Variables**
   - Sensitive data in .env
   - Not committed to git

5. **Database**
   - Parameterized queries (Sequelize)
   - Multi-tenant isolation
   - Schema-based separation

---

## 🎯 Key Takeaways

✅ **Monorepo Structure**: Shared code between frontend & backend  
✅ **Multi-Tenant**: Support multiple isolated business units  
✅ **Real-time**: WebSocket for instant updates  
✅ **Modern Stack**: Latest versions of all tools  
✅ **Type-Safe**: Full TypeScript implementation  
✅ **Scalable**: Modular architecture for easy growth  
✅ **Professional**: Production-ready setup  

---

## 📚 Learning Resources

| Topic | Resource |
|-------|----------|
| **NestJS** | https://docs.nestjs.com/ |
| **React 19** | https://react.dev/ |
| **TanStack** | https://tanstack.com/ |
| **PostgreSQL** | https://www.postgresql.org/docs/ |
| **Sequelize** | https://sequelize.org/ |
| **Tailwind** | https://tailwindcss.com/docs |
| **TypeScript** | https://www.typescriptlang.org/docs/ |

---

**Created**: April 24, 2026  
**For**: VCTest Project Analysis & Documentation  
**Status**: ✅ Complete & Verified
