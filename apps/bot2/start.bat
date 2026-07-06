@echo off
setlocal enabledelayedexpansion
title VolveBot Launcher

echo ===================================================
echo             VOLVEBOT INITIALIZER ^& LAUNCHER
echo ===================================================
echo.

:: Pastikan dijalankan dari folder tempat script berada
cd /d "%~dp0"

:: 1. Cek apakah file dijalankan langsung dari dalam ZIP (tanpa diekstrak)
if not exist "package.json" (
    echo [ERROR] File harus diekstrak terlebih dahulu dari ZIP!
    echo Silakan ekstrak file ZIP ini ke sebuah folder sebelum menjalankannya.
    echo.
    pause
    exit /b 1
)

:: Tentukan lokasi browser Playwright agar tersimpan di folder ini
set "PLAYWRIGHT_BROWSERS_PATH=%~dp0.playwright-browsers"

:: Tentukan folder lokal untuk Node Portable
set "PORTABLE_NODE_DIR=%~dp0.node-portable"
set "NODE_URL=https://nodejs.org/dist/v22.11.0/node-v22.11.0-win-x64.zip"
set "ZIP_FILE=%~dp0node-portable.zip"

:: Cek apakah Node.js portable sudah ada
if exist "%PORTABLE_NODE_DIR%\node-v22.11.0-win-x64\node.exe" goto :portable_node

:: Download Node.js portable jika tidak ada
echo [INFO] Node.js Portable belum terpasang.
echo [INFO] Mengunduh Node.js Portable (v22.11.0)... Mohon tunggu...
echo.

powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%ZIP_FILE%'"
if not exist "%ZIP_FILE%" (
    echo [ERROR] Gagal mengunduh Node.js. Silakan periksa koneksi internet Anda.
    pause
    exit /b 1
)

echo [INFO] Mengekstrak Node.js Portable...
if not exist "%PORTABLE_NODE_DIR%" mkdir "%PORTABLE_NODE_DIR%"
powershell -Command "Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%PORTABLE_NODE_DIR%' -Force"
del "%ZIP_FILE%"

if not exist "%PORTABLE_NODE_DIR%\node-v22.11.0-win-x64\node.exe" (
    echo [ERROR] Gagal mengekstrak Node.js Portable.
    pause
    exit /b 1
)

:portable_node
echo [OK] Menggunakan Node.js Portable.
set "PATH=%PORTABLE_NODE_DIR%\node-v22.11.0-win-x64;%PATH%"
set "NODE_CMD=%PORTABLE_NODE_DIR%\node-v22.11.0-win-x64\node.exe"
set "NPM_CMD=%PORTABLE_NODE_DIR%\node-v22.11.0-win-x64\npm.cmd"
set "NPX_CMD=%PORTABLE_NODE_DIR%\node-v22.11.0-win-x64\npx.cmd"
goto :check_dependencies

:check_dependencies
:: Membersihkan devDependencies agar tidak menyebabkan error "workspace:" di npm
echo [INFO] Menyesuaikan package.json untuk kecocokan library...
call "%NODE_CMD%" -e "const fs = require('fs'); const p = 'package.json'; if (fs.existsSync(p)) { const pkg = JSON.parse(fs.readFileSync(p, 'utf8')); if (pkg.devDependencies) { delete pkg.devDependencies; fs.writeFileSync(p, JSON.stringify(pkg, null, 2)); } }"

:: 3. Cek apakah folder node_modules sudah ada
if exist "%~dp0node_modules" goto :check_playwright

echo [INFO] Folder node_modules tidak ditemukan. Melakukan instalasi library pendukung...
call "%NPM_CMD%" install --omit=dev
if %errorlevel% neq 0 (
    echo [ERROR] Gagal menginstall dependencies. Coba jalankan sebagai Administrator atau periksa koneksi internet.
    pause
    exit /b 1
)

:check_playwright
:: 3. Cek apakah Chromium untuk Playwright sudah terinstall
echo [INFO] Memeriksa browser Chromium untuk Playwright...
call "%NPX_CMD%" playwright install chromium
if %errorlevel% neq 0 (
    echo [ERROR] Gagal mengunduh browser Chromium.
    pause
    exit /b 1
)

:: 4. Jalankan aplikasi
echo.
echo ===================================================
echo             MENJALANKAN VOLVEBOT...
echo ===================================================
echo.
call "%NODE_CMD%" dist/bundle/index.js
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Bot terhenti dengan error code %errorlevel%.
    pause
)
