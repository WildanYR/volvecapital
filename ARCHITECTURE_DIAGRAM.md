# 📊 VCTest - Visual Architecture & Workflow

## 🏗️ Project Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         VCTest (Volvecapital)                   │
│                       Monorepo with pnpm                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐              ┌──────────────────────┐
│   FRONTEND (React)   │              │  BACKEND (NestJS)    │
│  ──────────────────  │  ◄─HTTP──►   │  ──────────────────  │
│  • React 19          │              │  • TypeScript        │
│  • Vite (Build)      │  ◄─WebSocket │  • Express           │
│  • TanStack Router   │  ─────────►  │  • Sequelize ORM    │
│  • TanStack Query    │              │  • Socket.IO         │
│  • Tailwind CSS      │              │  • JWT Auth          │
│  • Radix UI          │              │  • Winston Logger    │
│  • TypeScript        │              │  • @nestjs/schedule  │
└──────────────────────┘              └──────────────────────┘
         ▲                                      ▲
         │                                      │
    Port 3000                               Port 3000
   (Vite Dev)                           (NestJS Server)
         │                                      │
         │                                      │
         ▼                                      ▼
    ┌─────────────────────────────────────────────────┐
    │          POSTGRESQL DATABASE                    │
    │  ───────────────────────────────────────────    │
    │  Public Schema (Master):                        │
    │  ├─ tenant                                      │
    │  ├─ task_queue                                  │
    │  ├─ email_subject                               │
    │  └─ syslog                                      │
    │                                                 │
    │  Tenant Schema (papapremium):                   │
    │  ├─ account                                     │
    │  ├─ product_variant                             │
    │  ├─ account_user                                │
    │  ├─ transaction                                 │
    │  ├─ email                                       │
    │  └─ statistics                                  │
    └─────────────────────────────────────────────────┘
         ▲           ▲
         │           │
    Connection   Cache
         │           │
         ▼           ▼
    ┌─────────┐  ┌──────┐
    │Sequelize│  │Redis │
    │   ORM   │  │Cache │
    └─────────┘  └──────┘
         │           │
         └─────┬─────┘
               │
          [Database]
```

---

## 🔄 Request/Response Flow

```
┌─────────────┐
│   Browser   │
│   (React)   │
└──────┬──────┘
       │ HTTP Request (GET /api/accounts)
       │
       ▼
┌──────────────────────────┐
│  TanStack Router         │
│  (Client-side routing)   │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  React Component         │
│  (Page/Route)            │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  TanStack React Query    │
│  (useFetchAccounts)      │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  API Service             │
│  (HTTP Client)           │
└──────┬───────────────────┘
       │ fetch() / axios
       │
       ▼ HTTP Request
┌────────────────────────────────────┐
│         NestJS Backend             │
├────────────────────────────────────┤
│                                    │
│  ┌──────────────────────────────┐ │
│  │ Express Middleware           │ │
│  └─────────────┬────────────────┘ │
│                │                  │
│  ┌─────────────▼────────────────┐ │
│  │ Authentication Guard         │ │
│  │ (Verify JWT Token)           │ │
│  └─────────────┬────────────────┘ │
│                │                  │
│  ┌─────────────▼────────────────┐ │
│  │ Controller                   │ │
│  │ (AccountController.get())    │ │
│  └─────────────┬────────────────┘ │
│                │                  │
│  ┌─────────────▼────────────────┐ │
│  │ Service                      │ │
│  │ (AccountService.findAll())   │ │
│  └─────────────┬────────────────┘ │
│                │                  │
│  ┌─────────────▼────────────────┐ │
│  │ Database Interaction         │ │
│  │ (Sequelize Query)            │ │
│  └─────────────┬────────────────┘ │
│                │                  │
└────────────────┼──────────────────┘
                 │
                 ▼ SQL Query
          ┌─────────────────┐
          │  PostgreSQL     │
          │  Database       │
          └────────┬────────┘
                   │
                   ▼ Query Result
┌────────────────────────────────────┐
│         NestJS Backend             │
│  ┌──────────────────────────────┐  │
│  │ Service (Transform Result)   │  │
│  └──────────────┬───────────────┘  │
│                 │                  │
│  ┌──────────────▼───────────────┐  │
│  │ Serialize Response (JSON)    │  │
│  └──────────────┬───────────────┘  │
└────────────────┼──────────────────┘
                 │ HTTP Response
                 ▼
┌──────────────────────────┐
│  TanStack React Query    │
│  (Cache Response)        │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  React Component         │
│  (Re-render with data)   │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Browser                 │
│  (Display UI)            │
└──────────────────────────┘
```

---

## ⚡ Real-time WebSocket Flow

```
Browser (React Component)
         │
         │ socket.on('accountCreated')
         │
         ▼
    Socket.IO Client
         │
         │ ws:// connection
         │
         ▼ Event: 'accountCreated'
┌─────────────────────────────────┐
│  Backend Socket.IO Server       │
│                                 │
│  @WebSocketGateway()            │
│  class AccountGateway {}        │
└────────────┬────────────────────┘
             │
             ▼
        Service Layer
        (Process event)
             │
             ▼
        Create in Database
             │
             ▼
   Broadcast to all clients
             │
   ┌─────────┴─────────┬──────────────┐
   │                   │              │
   ▼                   ▼              ▼
Client 1          Client 2        Client 3
(Update UI)       (Update UI)     (Update UI)
   All see        Instant        New data
   new data       notification   displayed
```

---

## 📊 Data Flow - Account Management

```
Create New Account
       │
       ▼
  Frontend Form
   (React Component)
       │
       ├─ Validate input (TanStack Form)
       │
       ▼
  POST /api/accounts
  {
    name: "Papapremium",
    product_variant_id: "uuid"
  }
       │
       ▼
  Backend Controller
  (AccountController.create)
       │
       ├─ Validate DTO
       ├─ Check JWT token
       │
       ▼
  Service Layer
  (AccountService.create)
       │
       ├─ Generate account ID (UUID)
       ├─ Set initial status
       ├─ Set balance to 0
       │
       ▼
  Sequelize ORM
       │
       ▼
  PostgreSQL (papapremium schema)
  INSERT INTO account (...) VALUES (...)
       │
       ▼
  Account created in DB
       │
       ├─ Emit WebSocket event: 'accountCreated'
       │
       ├─ Add to task queue (if needed)
       │
       ├─ Cache invalidation (Redis)
       │
       ▼
  Response to Frontend
  {
    id: "uuid",
    name: "Papapremium",
    status: "enabled",
    balance: 0
  }
       │
       ▼
  TanStack React Query
  (Invalidate & refetch)
       │
       ▼
  Frontend Component
  (Display new account)
       │
       ▼
  Browser
  (User sees new account)
       │
  Also receives WebSocket
  event on other open windows
```

---

## 🔐 Authentication Flow

```
Login Request
    │
    ├─ Email: user@example.com
    ├─ Password: xxxxx
    │
    ▼
  POST /api/auth/login
    │
    ▼
  Backend Validate Credentials
    │
    ├─ Find user in database
    ├─ Hash password & compare
    │
    ▼
  User authenticated ✓
    │
    ▼
  Generate JWT Token
    │
    ├─ Payload: { userId, email, role }
    ├─ Secret: process.env.JWT_SECRET
    ├─ Expiry: 24 hours
    │
    ▼
  Response with Token
    {
      access_token: "eyJhbGc...",
      token_type: "Bearer"
    }
    │
    ▼
  Frontend Store Token
    │
    ├─ LocalStorage or Cookie
    │
    ▼
  Protected Request
    │
    GET /api/accounts
    Headers: {
      Authorization: "Bearer eyJhbGc..."
    }
    │
    ▼
  Backend Guard (VcAuthGuard)
    │
    ├─ Extract token from header
    ├─ Verify signature
    ├─ Check expiration
    │
    ├─ Valid ✓ → Continue
    ├─ Invalid ✗ → Return 401 Unauthorized
    │
    ▼
  Process Request
    │
    ▼
  Response
```

---

## 💾 Database Migration Process

```
pnpm run start:dev
      │
      ▼
  NestJS Bootstrap
      │
      ├─ Load config from .env
      ├─ Connect to PostgreSQL
      │
      ▼
  Migration Runner (Umzug)
      │
      ├─ Check current schema version
      ├─ Compare with migration files
      │
      ▼
  New migrations found?
      │
      ├─ NO  → Continue to app startup
      │
      └─ YES → Execute migrations
            │
            ├─ Create tables
            ├─ Add columns
            ├─ Add indexes
            ├─ Create constraints
            │
            ▼
        Apply Master Migrations
            │
            ├─ 001-create-tenant-table
            ├─ ... (more master tables)
            │
            ▼
        Apply Tenant Migrations
        (For each tenant in TENANT_SCHEMAS)
            │
            ├─ 000-create-updated-at-function
            ├─ 001-create-email-table
            ├─ ... (more tenant tables)
            │
            ▼
        All migrations applied ✓
            │
            ▼
        App startup continues
            │
            ▼
        Server listening on port 3000
```

---

## 📈 Background Task Processing

```
Task Queue System
        │
        ├─ Email sending
        ├─ Statistics calculation
        ├─ Data cleanup
        │
        ▼
  Cron Jobs (@nestjs/schedule)
        │
        ├─ Every 10 minutes: Calculate statistics
        ├─ Every hour: Send reports
        ├─ Every day: Cleanup old data
        │
        ▼
  Task Queue Table (PostgreSQL)
  ┌────────────────────────────────┐
  │ id, type, payload, status      │
  │ attempts, created_at, updated_at│
  └────────────────────────────────┘
        │
        ▼
  Task Queue Service
        │
        ├─ Poll queue periodically
        ├─ Get pending tasks
        │
        ▼
  Process Task
        │
        ├─ Send email
        ├─ Calculate stats
        │
        ├─ Success → Mark as completed
        ├─ Error → Increment attempts
        │
        ├─ Max attempts reached?
        │   YES → Mark as failed
        │   NO  → Retry later
        │
        ▼
  Task completed or failed
```

---

## 🔄 Folder Structure Flow

```
VCTest
├── Root Configuration
│   └─ package.json (workspace)
│
├── Documentation (Your guides)
│   ├─ README_FIRST.md
│   ├─ QUICK_START.md
│   ├─ SETUP_GUIDE.md
│   ├─ PROJECT_ANALYSIS.md
│   └─ SETUP_CHECKLIST.md
│
├── apps/api (Backend)
│   ├── src/
│   │   ├── configs/
│   │   │   └─ Database, Redis, Auth configs
│   │   │
│   │   ├── modules/
│   │   │   ├─ account/
│   │   │   │   ├─ account.controller.ts
│   │   │   │   ├─ account.service.ts
│   │   │   │   ├─ account.module.ts
│   │   │   │   └─ dto/
│   │   │   │
│   │   │   └─ ... (20+ other modules)
│   │   │
│   │   ├── database/
│   │   │   └─ Connection setup
│   │   │
│   │   └── main.ts (entry point)
│   │
│   └── migrations/
│       ├── master/ (shared tables)
│       └── tenant/ (per-tenant tables)
│
├── apps/dashboard (Frontend)
│   ├── src/
│   │   ├── routes/
│   │   │   ├─ __root.tsx (layout)
│   │   │   ├─ index.tsx (home)
│   │   │   └─ ... (other pages)
│   │   │
│   │   ├── components/
│   │   │   └─ Reusable UI components
│   │   │
│   │   ├── services/
│   │   │   └─ API client functions
│   │   │
│   │   ├── hooks/
│   │   │   └─ Custom React hooks
│   │   │
│   │   ├── types/
│   │   │   └─ TypeScript types
│   │   │
│   │   └── main.tsx (entry point)
│   │
│   └── public/
│       └─ Static assets
│
└── packages/
    ├── eslint-config (shared)
    └── shared-types (shared)
```

---

## ✨ Development Cycle

```
  ┌─────────────────────────────────────────┐
  │     Development Cycle                   │
  └──────────────┬──────────────────────────┘
                 │
                 ▼
  ┌─────────────────────────────────────────┐
  │ 1. Plan Feature                         │
  │    - Understand requirements            │
  │    - Design schema (if needed)          │
  │    - Create API contract                │
  └──────────────┬──────────────────────────┘
                 │
                 ▼
  ┌─────────────────────────────────────────┐
  │ 2. Backend Development                  │
  │    - Create migration (if DB change)    │
  │    - Create/update model                │
  │    - Create controller                  │
  │    - Create service                     │
  │    - Add validation (DTO)               │
  │    - Write tests                        │
  └──────────────┬──────────────────────────┘
                 │
                 ▼
  ┌─────────────────────────────────────────┐
  │ 3. Test Backend (pnpm test)             │
  │    - Unit tests pass                    │
  │    - E2E tests pass                     │
  │    - Postman/curl tests pass            │
  └──────────────┬──────────────────────────┘
                 │
                 ▼
  ┌─────────────────────────────────────────┐
  │ 4. Frontend Development                 │
  │    - Create route                       │
  │    - Create component                   │
  │    - Create API service                 │
  │    - Create hooks (useQuery)            │
  │    - Write tests                        │
  └──────────────┬──────────────────────────┘
                 │
                 ▼
  ┌─────────────────────────────────────────┐
  │ 5. Test Frontend (pnpm test)            │
  │    - Component tests pass               │
  │    - UI rendering correct               │
  │    - API integration works              │
  └──────────────┬──────────────────────────┘
                 │
                 ▼
  ┌─────────────────────────────────────────┐
  │ 6. Integration Testing                  │
  │    - Backend + Frontend work together   │
  │    - WebSocket messages work            │
  │    - Real-time updates work             │
  │    - No console errors                  │
  └──────────────┬──────────────────────────┘
                 │
                 ▼
  ┌─────────────────────────────────────────┐
  │ 7. Lint & Format (pnpm lint)            │
  │    - All TypeScript errors fixed        │
  │    - ESLint warnings resolved           │
  │    - Code formatted                     │
  └──────────────┬──────────────────────────┘
                 │
                 ▼
  ┌─────────────────────────────────────────┐
  │ 8. Ready for Deployment                 │
  │    - Build succeeds (pnpm build)        │
  │    - No warnings                        │
  │    - Performance acceptable             │
  └──────────────┬──────────────────────────┘
                 │
                 ▼
  ┌─────────────────────────────────────────┐
  │ Feature Complete! 🎉                    │
  └─────────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture (for reference)

```
┌──────────────────────────────────────────┐
│         Production Environment           │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────┐                     │
│  │   Nginx/CDN    │                     │
│  │  (Frontend)    │                     │
│  └────────┬───────┘                     │
│           │                             │
│  ┌────────▼──────────────┐             │
│  │  Frontend Build       │             │
│  │  (dist/ folder)       │             │
│  │  Static assets        │             │
│  └────────┬──────────────┘             │
│           │                             │
│  ┌────────▼──────────────────────────┐ │
│  │  Node.js Server (Backend)         │ │
│  │  - NestJS application             │ │
│  │  - Port 3000                      │ │
│  │  - PM2 (process manager)          │ │
│  └────────┬───────────────────────────┤ │
│           │                            │
│  ┌────────▼──────────────┐            │
│  │  PostgreSQL Database  │            │
│  │  (Production DB)      │            │
│  └───────────────────────┘            │
│                                        │
│  ┌──────────────────────┐             │
│  │  Redis Cache         │             │
│  │  (Distributed cache) │             │
│  └──────────────────────┘             │
│                                        │
└────────────────────────────────────────┘
```

---

**Created**: April 24, 2026  
**For**: VCTest Project Visual Documentation  
**Status**: ✅ Complete
