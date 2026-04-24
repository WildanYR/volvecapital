-- VCTest Database Setup Script
-- Run this script in PostgreSQL using pgAdmin or psql CLI
-- Pastikan sudah connect ke PostgreSQL sebagai superuser (postgres)

-- ============================================================
-- Step 1: Buat Database Master
-- ============================================================

-- Buat database 'volvecapital' jika belum ada
CREATE DATABASE volvecapital
  WITH OWNER postgres
  ENCODING 'UTF8'
  LC_COLLATE 'en_US.UTF-8'
  LC_CTYPE 'en_US.UTF-8'
  TEMPLATE template0;

-- ============================================================
-- Step 2: Connect ke database baru dan setup extensions
-- ============================================================
-- Jalankan command ini SETELAH connect ke database 'volvecapital':
-- \c volvecapital

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Step 3: Setup Tenant Schema
-- ============================================================

-- Buat schema untuk tenant 'papapremium'
CREATE SCHEMA IF NOT EXISTS "papapremium";

-- Grant privileges
GRANT USAGE ON SCHEMA "papapremium" TO postgres;
GRANT CREATE ON SCHEMA "papapremium" TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA "papapremium" GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA "papapremium" GRANT ALL ON SEQUENCES TO postgres;

-- ============================================================
-- Step 4: Verifikasi
-- ============================================================

-- Check databases
SELECT datname FROM pg_database WHERE datname = 'volvecapital';

-- Check extensions
SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- Check schemas
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'papapremium';

-- ============================================================
-- NOTES
-- ============================================================
-- 1. Setelah script ini selesai, jalankan database migrations
--    dengan: pnpm run start:dev di apps/api
--
-- 2. Migrations akan secara otomatis:
--    - Create master tables (tenant, task_queue, etc)
--    - Create tenant-specific tables di schema 'papapremium'
--
-- 3. Untuk menambah tenant baru:
--    - Tambahkan schema name ke TENANT_SCHEMAS di .env
--    - Create schema: CREATE SCHEMA IF NOT EXISTS "newtenant";
--    - Jalankan migrations ulang
--
-- 4. Backup database secara berkala:
--    pg_dump -U postgres volvecapital > volvecapital_backup.sql
--
-- 5. Untuk restore dari backup:
--    psql -U postgres volvecapital < volvecapital_backup.sql
