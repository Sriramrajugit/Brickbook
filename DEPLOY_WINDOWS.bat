@echo off
REM Production Deployment Script for Windows
REM Reports + Payroll Fixes Release
REM Usage: DEPLOY_WINDOWS.bat [--dry-run] [--skip-backup]

setlocal enabledelayedexpansion
set SCRIPT_DIR=%~dp0
set TIMESTAMP=%date:~-4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_FILE=backup_%TIMESTAMP%.sql
set DRY_RUN=0
set SKIP_BACKUP=0

REM Parse arguments
if "%1"=="--dry-run" set DRY_RUN=1
if "%1"=="--skip-backup" set SKIP_BACKUP=1
if "%2"=="--dry-run" set DRY_RUN=1
if "%2"=="--skip-backup" set SKIP_BACKUP=1

echo.
echo ====================================
echo Ledger Production Deployment
echo ====================================
echo Timestamp: %TIMESTAMP%
echo Script Directory: %SCRIPT_DIR%
echo.

REM Check prerequisites
echo [1/7] Checking prerequisites...
if not exist "package.json" (
    echo ERROR: package.json not found. Run from project root directory.
    exit /b 1
)

if not exist "PRODUCTION_DEPLOYMENT.patch" (
    echo ERROR: PRODUCTION_DEPLOYMENT.patch not found in %SCRIPT_DIR%
    exit /b 1
)

echo     ✓ Files found
echo.

REM Check Node.js
echo [2/7] Verifying Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js 20+
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo     ✓ Node.js %NODE_VERSION% found
echo.

REM Check Git
echo [3/7] Verifying Git...
where git >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git not found. Please install Git.
    exit /b 1
)
echo     ✓ Git found
echo.

REM Database Backup
if "%SKIP_BACKUP%"=="0" (
    echo [4/7] Backing up database...
    if defined DATABASE_URL (
        REM Extract connection info from DATABASE_URL
        echo     ⚠ Note: Backup requires manual PostgreSQL backups if DATABASE_URL is set
        echo     ℹ Run manually: pg_dump > %BACKUP_FILE%
    ) else (
        echo     ⚠ DATABASE_URL not set. Skipping automatic backup.
        echo     ℹ Please backup manually: pg_dump ledger_prod > %BACKUP_FILE%
    )
) else (
    echo [4/7] Skipping database backup (--skip-backup flag set)
)
echo.

REM Apply Patch
echo [5/7] Applying patch files...
if "%DRY_RUN%"=="1" (
    echo [DRY-RUN] Checking patch compatibility...
    git apply --check PRODUCTION_DEPLOYMENT.patch 2>&1
    if errorlevel 1 (
        echo ERROR: Patch check failed. Abort deployment.
        exit /b 1
    )
    echo [DRY-RUN] Patch is compatible
) else (
    echo Applying patch...
    git apply PRODUCTION_DEPLOYMENT.patch 2>&1
    if errorlevel 1 (
        echo ERROR: Patch apply failed. Rollback needed.
        exit /b 1
    )
    echo     ✓ Patch applied successfully
)
echo.

REM Install Dependencies
echo [6/7] Installing dependencies...
if "%DRY_RUN%"=="1" (
    echo [DRY-RUN] Would run: npm install
) else (
    call npm install 2>&1
    if errorlevel 1 (
        echo ERROR: npm install failed
        exit /b 1
    )
    echo     ✓ Dependencies installed
)
echo.

REM Build Application
echo [7/7] Building application...
if "%DRY_RUN%"=="1" (
    echo [DRY-RUN] Would run: npm run build
) else (
    call npm run build 2>&1
    if errorlevel 1 (
        echo ERROR: Build failed
        exit /b 1
    )
    echo     ✓ Build completed
)
echo.

if "%DRY_RUN%"=="1" (
    echo.
    echo ====================================
    echo DRY-RUN COMPLETED SUCCESSFULLY
    echo ====================================
    echo All checks passed. Ready for deployment.
    echo.
    echo Next steps:
    echo   1. Run backup: pg_dump -U postgres ledger_prod ^> %BACKUP_FILE%
    echo   2. Run deployment: DEPLOY_WINDOWS.bat
    echo   3. Start app: npm start
    echo.
) else (
    echo.
    echo ====================================
    echo DEPLOYMENT COMPLETED SUCCESSFULLY
    echo ====================================
    echo.
    echo Next steps:
    echo   1. Start application: npm start
    echo   2. Monitor logs for errors
    echo   3. Test endpoints: curl http://localhost:3000/api/auth/me
    echo   4. Verify reports page loads
    echo.
    echo Backup location (if created): %BACKUP_FILE%
    echo.
)

endlocal
