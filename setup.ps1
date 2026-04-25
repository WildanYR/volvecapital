#!/usr/bin/env pwsh
# VCTest Project Setup Script untuk Windows PowerShell
# Usage: .\setup.ps1

$ErrorActionPreference = "Stop"

Write-Host "`n=== VCTest Project Setup ===" -ForegroundColor Cyan
Write-Host "Platform: Windows PowerShell`n" -ForegroundColor Gray

# Fungsi untuk check command
function Check-Command {
    param(
        [string]$Command,
        [string]$MinVersion = ""
    )
    
    $commandExists = $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
    
    if ($commandExists) {
        if ($MinVersion) {
            & $Command --version | Write-Host -ForegroundColor Green
        } else {
            Write-Host "✓ $Command ditemukan" -ForegroundColor Green
        }
        return $true
    } else {
        Write-Host "✗ $Command TIDAK DITEMUKAN" -ForegroundColor Red
        return $false
    }
}

# Check prerequisites
Write-Host "`n=== Checking Prerequisites ===" -ForegroundColor Yellow

$nodeExists = Check-Command "node"
$pnpmExists = Check-Command "pnpm"
$postgresExists = Check-Command "psql"
$redisExists = Check-Command "redis-cli"

Write-Host "`n=== Status Summary ===" -ForegroundColor Cyan
if ($nodeExists) { Write-Host "✓ Node.js" -ForegroundColor Green } else { Write-Host "✗ Node.js" -ForegroundColor Red }
if ($pnpmExists) { Write-Host "✓ pnpm" -ForegroundColor Green } else { Write-Host "✗ pnpm (critical)" -ForegroundColor Red }
if ($postgresExists) { Write-Host "✓ PostgreSQL" -ForegroundColor Green } else { Write-Host "✗ PostgreSQL (critical)" -ForegroundColor Red }
if ($redisExists) { Write-Host "✓ Redis" -ForegroundColor Green } else { Write-Host "✗ Redis (critical)" -ForegroundColor Red }

if (-not ($nodeExists -and $pnpmExists -and $postgresExists -and $redisExists)) {
    Write-Host "`n⚠️  BACA SETUP_GUIDE.md untuk install dependencies" -ForegroundColor Yellow
    Write-Host "Lanjutkan setup? (y/n): " -ForegroundColor Yellow -NoNewline
    $response = Read-Host
    if ($response -ne 'y' -and $response -ne 'Y') {
        exit 1
    }
}

# Step 1: Install dependencies
Write-Host "`n=== Step 1: Installing Dependencies ===" -ForegroundColor Yellow
pnpm install

# Step 2: Setup environment files
Write-Host "`n=== Step 2: Setting Up Environment Files ===" -ForegroundColor Yellow

$envApiSource = "apps/api/.env.example"
$envApiDest = "apps/api/.env"

if (Test-Path $envApiDest) {
    Write-Host "⚠️  $envApiDest sudah ada, skip" -ForegroundColor Yellow
} else {
    Copy-Item $envApiSource $envApiDest
    Write-Host "✓ Created $envApiDest" -ForegroundColor Green
}

$envDashSource = "apps/dashboard/.env.example"
$envDashDest = "apps/dashboard/.env"

if (Test-Path $envDashDest) {
    Write-Host "⚠️  $envDashDest sudah ada, skip" -ForegroundColor Yellow
} else {
    Copy-Item $envDashSource $envDashDest
    Write-Host "✓ Created $envDashDest" -ForegroundColor Green
}

Write-Host "`n⚠️  EDIT FILE ENV BERIKUT SEBELUM MELANJUTKAN:" -ForegroundColor Yellow
Write-Host "  - apps/api/.env" -ForegroundColor Cyan
Write-Host "  - apps/dashboard/.env" -ForegroundColor Cyan
Write-Host "`nBuka SETUP_GUIDE.md untuk konfigurasi detail" -ForegroundColor Yellow

# Step 3: Database setup prompt
Write-Host "`n=== Step 3: Database Setup ===" -ForegroundColor Yellow
Write-Host "Pastikan PostgreSQL berjalan dengan benar." -ForegroundColor Gray
Write-Host "Database 'volvecapital' harus sudah dibuat sebelumnya." -ForegroundColor Gray

Write-Host "`nLanjutkan ke tahap running? (y/n): " -ForegroundColor Yellow -NoNewline
$response = Read-Host
if ($response -ne 'y' -and $response -ne 'Y') {
    Write-Host "`nSetup selesai! Edit .env files dan jalankan 'pnpm dev' ketika siap." -ForegroundColor Green
    exit 0
}

# Step 4: Ready to run
Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "`nUntuk menjalankan project:" -ForegroundColor Cyan
Write-Host "  Semua: pnpm dev" -ForegroundColor Yellow
Write-Host "  API saja: cd apps/api && pnpm run start:dev" -ForegroundColor Yellow
Write-Host "  Frontend saja: cd apps/dashboard && pnpm run dev" -ForegroundColor Yellow

Write-Host "`nTerbuka di browser: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nLihat SETUP_GUIDE.md untuk info lebih detail" -ForegroundColor Gray
