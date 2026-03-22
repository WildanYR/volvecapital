-- PERIODIC JOB (e.g., */180 * * * *): daily running snapshot for "today" (Asia/Jakarta)
BEGIN;

-- ================================================================
-- PARAMS sekali (LOCAL -> UTC bounds) untuk hari ini
-- ================================================================
CREATE TEMP TABLE _params ON COMMIT DROP AS
WITH base AS (
  SELECT
    -- Tanggal lokal "hari ini" (Asia/Jakarta) dibekukan sekali
    (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date AS today_local
)
SELECT
  b.today_local,
  (b.today_local + INTERVAL '1 day')::date                           AS tomorrow_local,
  -- Konversi midnight lokal -> UTC (index-friendly di WHERE)
  (b.today_local::timestamp AT TIME ZONE 'Asia/Jakarta')             AS today_start_utc,
  ((b.today_local + INTERVAL '1 day')::timestamp AT TIME ZONE 'Asia/Jakarta') AS tomorrow_start_utc
FROM base b;

-- ================================================================
-- 1) DAILY revenue (today only)  -> revenue_statistics
--    type='daily', date=today_local
-- ================================================================
INSERT INTO revenue_statistics ("date", "type", total_revenue, transaction_count)
SELECT
  p.today_local AS "date",
  'daily'       AS "type",
  COALESCE(SUM(t.total_price), 0) AS total_revenue,
  COALESCE(COUNT(t.id), 0)        AS transaction_count
FROM _params p
LEFT JOIN transaction t
  ON t.created_at >= p.today_start_utc
 AND t.created_at <  p.tomorrow_start_utc
GROUP BY p.today_local
ON CONFLICT ("date", "type") DO UPDATE
SET total_revenue     = EXCLUDED.total_revenue,
    transaction_count = EXCLUDED.transaction_count;

-- ================================================================
-- 2) DAILY product sales (today only) -> product_sales_statistics
--    type='daily', date=today_local
-- ================================================================
INSERT INTO product_sales_statistics ("date", "type", product_variant_id, items_sold)
SELECT
  p.today_local AS "date",
  'daily'       AS "type",
  pv.id         AS product_variant_id,
  COUNT(ti.id)  AS items_sold
FROM _params p
JOIN transaction       t   ON t.created_at >= p.today_start_utc
                           AND t.created_at <  p.tomorrow_start_utc
JOIN transaction_item  ti  ON ti.transaction_id   = t.id
JOIN account_user      au  ON ti.account_user_id  = au.id
JOIN account           a   ON au.account_id       = a.id
JOIN product_variant   pv  ON a.product_variant_id = pv.id
GROUP BY p.today_local, pv.id
ON CONFLICT ("date", "type", product_variant_id) DO UPDATE
SET items_sold = EXCLUDED.items_sold;

-- ================================================================
-- 3) DAILY hourly stats (today only, optimized) -> peak_hour_statistics
--    Hanya jam yang ada transaksi (tanpa generate 0..23)
-- ================================================================
INSERT INTO peak_hour_statistics ("date", "type", "hour", transaction_count)
SELECT
  p.today_local AS "date",
  'daily'       AS "type",
  EXTRACT(HOUR FROM (t.created_at AT TIME ZONE 'Asia/Jakarta'))::SMALLINT AS "hour",
  COUNT(t.id) AS transaction_count
FROM _params p
JOIN transaction t
  ON t.created_at >= p.today_start_utc
 AND t.created_at <  p.tomorrow_start_utc
GROUP BY p.today_local, "hour"
ON CONFLICT ("date", "type", "hour") DO UPDATE
SET transaction_count = EXCLUDED.transaction_count;

-- ================================================================
-- 4) DAILY platform stats (today only) -> platform_statistics
--    type='daily', date=today_local
-- ================================================================
INSERT INTO platform_statistics ("date", "type", platform, transaction_count)
SELECT
  p.today_local AS "date",
  'daily'       AS "type",
  t.platform    AS platform,
  COUNT(t.id)   AS transaction_count
FROM _params p
JOIN transaction t
  ON t.created_at >= p.today_start_utc
 AND t.created_at <  p.tomorrow_start_utc
GROUP BY p.today_local, t.platform
ON CONFLICT ("date", "type", platform) DO UPDATE
SET transaction_count = EXCLUDED.transaction_count;

COMMIT;

-- Cron dijalankan tiap jam 1 pagi
-- ==========================================================================
BEGIN;

-- ================================================================
-- 1) PARAMETER TANGGAL & BATAS WAKTU (LOCAL->UTC) - Asia/Jakarta
--    Disiapkan sekali, dipakai semua statement di bawah
-- ================================================================
CREATE TEMP TABLE _params ON COMMIT DROP AS
WITH base AS (
  SELECT
    -- tanggal lokal "hari ini" & "kemarin"
    (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date                         AS today_local,
    ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date - INTERVAL '1 day')::date AS yesterday_local
),
month_bounds AS (
  -- awal bulan untuk "bulan-dari-kemarin" (tanggal 1 jam 01:00 ⇒ bulan lalu penuh)
  SELECT
    date_trunc('month', (b.yesterday_local::timestamp))::date AS target_month_start_local,
    b.today_local,
    b.yesterday_local
  FROM base b
)
SELECT
  mb.today_local,                      -- DATE (lokal)
  mb.yesterday_local,                  -- DATE (lokal)
  mb.target_month_start_local,         -- DATE (lokal, awal bulan target)
  -- batas UTC agar filter index-friendly
  (mb.yesterday_local::timestamp AT TIME ZONE 'Asia/Jakarta') AS yesterday_start_utc,  -- timestamptz
  (mb.today_local::timestamp     AT TIME ZONE 'Asia/Jakarta') AS today_start_utc,      -- timestamptz
  (mb.target_month_start_local::timestamp AT TIME ZONE 'Asia/Jakarta') AS month_start_utc  -- timestamptz
FROM month_bounds mb;

-- ================================================================
-- 2) REVENUE STATISTICS
-- ================================================================

-- 2.A) Finalisasi harian (kemarin) → type='daily', date=yesterday_local
INSERT INTO revenue_statistics ("date", "type", total_revenue, transaction_count)
SELECT
  p.yesterday_local AS "date",
  'daily'           AS "type",
  COALESCE(SUM(t.total_price), 0) AS total_revenue,
  COALESCE(COUNT(t.id), 0)        AS transaction_count
FROM _params p
LEFT JOIN transaction t
  ON t.created_at >= p.yesterday_start_utc
 AND t.created_at <  p.today_start_utc
GROUP BY p.yesterday_local
ON CONFLICT ("date", "type") DO UPDATE
SET total_revenue     = EXCLUDED.total_revenue,
    transaction_count = EXCLUDED.transaction_count;

-- 2.B) Update bulanan (bulan-dari-kemarin hingga akhir kemarin) → type='monthly', date=target_month_start_local
INSERT INTO revenue_statistics ("date", "type", total_revenue, transaction_count)
SELECT
  p.target_month_start_local AS "date",
  'monthly'                  AS "type",
  COALESCE(SUM(t.total_price), 0) AS total_revenue,
  COALESCE(COUNT(t.id), 0)        AS transaction_count
FROM _params p
LEFT JOIN transaction t
  ON t.created_at >= p.month_start_utc
 AND t.created_at <  p.today_start_utc
GROUP BY p.target_month_start_local
ON CONFLICT ("date", "type") DO UPDATE
SET total_revenue     = EXCLUDED.total_revenue,
    transaction_count = EXCLUDED.transaction_count;

-- ================================================================
-- 3) PRODUCT STATISTICS
-- ================================================================

-- 3.A) Finalisasi harian (kemarin)
INSERT INTO product_sales_statistics ("date", "type", product_variant_id, items_sold)
SELECT
  p.yesterday_local AS "date",
  'daily'           AS "type",
  pv.id             AS product_variant_id,
  COUNT(ti.id)      AS items_sold
FROM _params p
JOIN transaction       t   ON t.created_at >= p.yesterday_start_utc
                           AND t.created_at <  p.today_start_utc
JOIN transaction_item  ti  ON ti.transaction_id   = t.id
JOIN account_user      au  ON ti.account_user_id  = au.id
JOIN account           a   ON au.account_id       = a.id
JOIN product_variant   pv  ON a.product_variant_id = pv.id
GROUP BY p.yesterday_local, pv.id
ON CONFLICT ("date", "type", product_variant_id) DO UPDATE
SET items_sold = EXCLUDED.items_sold;

-- 3.B) Update bulanan (bulan-dari-kemarin s.d. akhir kemarin)
INSERT INTO product_sales_statistics ("date", "type", product_variant_id, items_sold)
SELECT
  p.target_month_start_local AS "date",
  'monthly'                  AS "type",
  pv.id                      AS product_variant_id,
  COUNT(ti.id)               AS items_sold
FROM _params p
JOIN transaction       t   ON t.created_at >= p.month_start_utc
                           AND t.created_at <  p.today_start_utc
JOIN transaction_item  ti  ON ti.transaction_id   = t.id
JOIN account_user      au  ON ti.account_user_id  = au.id
JOIN account           a   ON au.account_id       = a.id
JOIN product_variant   pv  ON a.product_variant_id = pv.id
GROUP BY p.target_month_start_local, pv.id
ON CONFLICT ("date", "type", product_variant_id) DO UPDATE
SET items_sold = EXCLUDED.items_sold;

-- ================================================================
-- 4) HOURLY STATISTICS (OPTIMIZED)
--     - Hanya jam yang ada transaksi (tanpa 0–23 lengkap)
--     - Filter waktu index-friendly (pakai UTC bounds)
-- ================================================================

-- 4.A) Finalisasi harian (kemarin)
INSERT INTO peak_hour_statistics ("date", "type", "hour", transaction_count)
SELECT
  p.yesterday_local AS "date",
  'daily'           AS "type",
  EXTRACT(HOUR FROM (t.created_at AT TIME ZONE 'Asia/Jakarta'))::SMALLINT AS "hour",
  COUNT(t.id) AS transaction_count
FROM _params p
JOIN transaction t
  ON t.created_at >= p.yesterday_start_utc
 AND t.created_at <  p.today_start_utc
GROUP BY p.yesterday_local, "hour"
ON CONFLICT ("date", "type", "hour") DO UPDATE
SET transaction_count = EXCLUDED.transaction_count;

-- 4.B) Update bulanan (bulan-dari-kemarin)
INSERT INTO peak_hour_statistics ("date", "type", "hour", transaction_count)
SELECT
  p.target_month_start_local AS "date",
  'monthly'                  AS "type",
  EXTRACT(HOUR FROM (t.created_at AT TIME ZONE 'Asia/Jakarta'))::SMALLINT AS "hour",
  COUNT(t.id) AS transaction_count
FROM _params p
JOIN transaction t
  ON t.created_at >= p.month_start_utc
 AND t.created_at <  p.today_start_utc
GROUP BY p.target_month_start_local, "hour"
ON CONFLICT ("date", "type", "hour") DO UPDATE
SET transaction_count = EXCLUDED.transaction_count;

-- ================================================================
-- 5) PLATFORM STATISTICS
-- ================================================================

-- 5.A) Finalisasi harian (kemarin)
INSERT INTO platform_statistics ("date", "type", platform, transaction_count)
SELECT
  p.yesterday_local AS "date",
  'daily'           AS "type",
  t.platform        AS platform,
  COUNT(t.id)       AS transaction_count
FROM _params p
JOIN transaction t
  ON t.created_at >= p.yesterday_start_utc
 AND t.created_at <  p.today_start_utc
GROUP BY p.yesterday_local, t.platform
ON CONFLICT ("date", "type", platform) DO UPDATE
SET transaction_count = EXCLUDED.transaction_count;

-- 5.B) Update bulanan (bulan-dari-kemarin)
INSERT INTO platform_statistics ("date", "type", platform, transaction_count)
SELECT
  p.target_month_start_local AS "date",
  'monthly'                  AS "type",
  t.platform                 AS platform,
  COUNT(t.id)                AS transaction_count
FROM _params p
JOIN transaction t
  ON t.created_at >= p.month_start_utc
 AND t.created_at <  p.today_start_utc
GROUP BY p.target_month_start_local, t.platform
ON CONFLICT ("date", "type", platform) DO UPDATE
SET transaction_count = EXCLUDED.transaction_count;

COMMIT;
