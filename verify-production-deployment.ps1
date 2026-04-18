# Production Deployment Verification Script
# PowerShell version for Windows
# Usage: .\verify-production-deployment.ps1

# Configuration
$HOST = "localhost"
$PORT = 3000
$BaseURL = "http://$($HOST):$($PORT)"

# Color definitions
function Write-Pass { Write-Host "✓ PASS: $args" -ForegroundColor Green }
function Write-Fail { Write-Host "✗ FAIL: $args" -ForegroundColor Red }
function Write-Warn { Write-Host "⚠ WARN: $args" -ForegroundColor Yellow }
function Write-Info { Write-Host "ℹ INFO: $args" -ForegroundColor Cyan }
function Write-Header { Write-Host "`n$args`n" -ForegroundColor Blue -BackgroundColor Black }

# Counters
$passed = 0
$failed = 0
$warnings = 0

# Helper functions
function Test-Passed {
    param([string]$Message)
    Write-Pass $Message
    $script:passed++
}

function Test-Failed {
    param([string]$Message)
    Write-Fail $Message
    $script:failed++
}

function Test-Warning {
    param([string]$Message)
    Write-Warn $Message
    $script:warnings++
}

# 1. Verify Application Running
function Verify-AppRunning {
    Write-Header "1. APPLICATION STATUS"
    
    try {
        $response = Invoke-WebRequest -Uri "$BaseURL/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Test-Passed "Application is running and health check responds"
        }
    }
    catch {
        Test-Failed "Application is not responding on port $PORT. Is it running? (npm run start)"
        return $false
    }
    
    # Check Node.js process
    $nodeProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcess) {
        Test-Passed "Node.js process detected (PID: $($nodeProcess.Id))"
    } else {
        Test-Failed "Node.js process not found"
    }
    
    return $true
}

# 2. Verify Environment Variables
function Verify-Environment {
    Write-Header "2. ENVIRONMENT CONFIGURATION"
    
    # DATABASE_URL
    $dbUrl = [Environment]::GetEnvironmentVariable("DATABASE_URL")
    if (-not $dbUrl) {
        Test-Failed "DATABASE_URL environment variable not set"
    } else {
        Test-Passed "DATABASE_URL is set (length: $($dbUrl.Length) chars)"
    }
    
    # JWT_SECRET
    $jwtSecret = [Environment]::GetEnvironmentVariable("JWT_SECRET")
    if (-not $jwtSecret) {
        Test-Failed "JWT_SECRET environment variable not set"
    } else {
        if ($jwtSecret.Length -lt 32) {
            Test-Warning "JWT_SECRET is less than 32 characters (security concern)"
        } else {
            Test-Passed "JWT_SECRET is set (length: $($jwtSecret.Length) chars)"
        }
    }
    
    # NODE_ENV
    $nodeEnv = [Environment]::GetEnvironmentVariable("NODE_ENV")
    if (-not $nodeEnv) {
        Test-Warning "NODE_ENV not explicitly set"
    } else {
        if ($nodeEnv -eq "production") {
            Test-Passed "NODE_ENV is set to production"
        } else {
            Test-Warning "NODE_ENV is set to '$nodeEnv' (expected 'production')"
        }
    }
    
    # Session Timeout
    $sessionTimeout = [Environment]::GetEnvironmentVariable("NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES")
    if (-not $sessionTimeout) {
        Test-Passed "NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES not set (using default: 15 minutes)"
    } else {
        Test-Passed "Session timeout configured to $sessionTimeout minutes"
    }
}

# 3. Verify Database Connectivity
function Verify-Database {
    Write-Header "3. DATABASE CONNECTIVITY"
    
    $dbUrl = [Environment]::GetEnvironmentVariable("DATABASE_URL")
    
    if (-not $dbUrl) {
        Test-Warning "DATABASE_URL not set (cannot verify database connection)"
        return
    }
    
    # Try to load PostgreSQL module
    $psql = Get-Command psql -ErrorAction SilentlyContinue
    if (-not $psql) {
        Test-Warning "psql not found (PostgreSQL client not installed)"
        return
    }
    
    try {
        # Test connection
        $output = & psql -c "SELECT NOW();" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Test-Passed "Database connection successful"
        } else {
            Test-Failed "Cannot connect to database with provided credentials"
        }
    }
    catch {
        Test-Warning "Could not test database connection: $_"
    }
}

# 4. Verify Authentication
function Verify-Authentication {
    Write-Header "4. AUTHENTICATION & SECURITY"
    
    # Test protected API without token (should return 401)
    try {
        $response = Invoke-WebRequest -Uri "$BaseURL/api/accounts/full" -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 401) {
            Test-Passed "API correctly rejects unauthenticated requests (401)"
        } else {
            Test-Failed "API returned status $($response.StatusCode) (expected 401 for unauthenticated request)"
        }
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Test-Passed "API correctly rejects unauthenticated requests (401)"
        } else {
            Test-Failed "Unexpected response: $_"
        }
    }
    
    # Test login endpoint
    try {
        $loginBody = @{
            email = "admin"
            password = "admin"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$BaseURL/api/login" `
            -Method Post `
            -ContentType "application/json" `
            -Body $loginBody `
            -UseBasicParsing `
            -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            Test-Passed "Login endpoint responds successfully"
        }
    }
    catch {
        Test-Warning "Login test failed (may need valid credentials): $_"
    }
}

# 5. Verify Performance
function Verify-Performance {
    Write-Header "5. PERFORMANCE METRICS"
    
    try {
        # Measure homepage load time
        $timer = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri "$BaseURL/" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        $timer.Stop()
        
        $responseTime = $timer.ElapsedMilliseconds
        
        if ($responseTime -lt 2000) {
            Test-Passed "Homepage loads in ${responseTime}ms (excellent)"
        } elseif ($responseTime -lt 5000) {
            Test-Passed "Homepage loads in ${responseTime}ms (acceptable)"
        } else {
            Test-Warning "Homepage loads in ${responseTime}ms (slow - investigate)"
        }
    }
    catch {
        Test-Warning "Could not measure performance: $_"
    }
    
    # Check memory usage
    $nodeProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcess) {
        $memoryMB = [math]::Round($nodeProcess.WorkingSet64 / 1MB, 2)
        if ($memoryMB -lt 500) {
            Test-Passed "Node.js memory usage: ${memoryMB}MB (excellent)"
        } elseif ($memoryMB -lt 1000) {
            Test-Passed "Node.js memory usage: ${memoryMB}MB (acceptable)"
        } else {
            Test-Warning "Node.js memory usage: ${memoryMB}MB (high - investigate)"
        }
    }
}

# 6. Verify Logging
function Verify-Logging {
    Write-Header "6. LOGGING & MONITORING"
    
    # Check for logs in common locations
    $logLocations = @(
        "/var/log/ledger/app.log",
        "nohup.log",
        "./.next/logs/app.log"
    )
    
    $logsFound = $false
    foreach ($location in $logLocations) {
        if (Test-Path $location -ErrorAction SilentlyContinue) {
            Test-Passed "Application logs found at: $location"
            $logsFound = $true
            break
        }
    }
    
    if (-not $logsFound) {
        Test-Warning "Application log files not found (ensure logging is configured)"
    }
}

# 7. Verify Process Management
function Verify-ProcessManager {
    Write-Header "7. PROCESS MANAGEMENT"
    
    # Check if pm2 is available
    $pm2 = Get-Command pm2 -ErrorAction SilentlyContinue
    if ($pm2) {
        Test-Passed "PM2 is installed (recommended for production)"
        $pm2List = & pm2 list 2>&1
        if ($pm2List -like "*ledger*" -or $pm2List -like "*npm*") {
            Test-Passed "PM2 application list found"
        } else {
            Test-Warning "Application not registered with PM2 (run: pm2 start npm --name ledger -- start)"
        }
    } else {
        Test-Warning "PM2 not installed (recommended: npm install -g pm2)"
    }
}

# 8. Test Features
function Test-Features {
    Write-Header "8. FEATURE VERIFICATION"
    
    # Try accounts endpoint
    try {
        $response = Invoke-WebRequest -Uri "$BaseURL/api/accounts/minimal" `
            -UseBasicParsing `
            -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 401) {
            Test-Passed "Accounts API requires authentication (401 without token)"
        }
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Test-Passed "Accounts API requires authentication (401 without token)"
        }
    }
    
    # Test transactions endpoint
    try {
        $response = Invoke-WebRequest -Uri "$BaseURL/api/transactions" `
            -UseBasicParsing `
            -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 401) {
            Test-Passed "Transactions API requires authentication (401 without token)"
        }
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Test-Passed "Transactions API requires authentication (401 without token)"
        }
    }
}

# 9. Print Summary
function Print-Summary {
    Write-Header "VERIFICATION SUMMARY"
    
    Write-Host "Passed:   $passed" -ForegroundColor Green
    Write-Host "Failed:   $failed" -ForegroundColor Red
    Write-Host "Warnings: $warnings" -ForegroundColor Yellow
    Write-Host ""
    
    if ($failed -eq 0) {
        Write-Host "✓ READY FOR PRODUCTION DEPLOYMENT" -ForegroundColor Green -BackgroundColor Black
        return $true
    } else {
        Write-Host "✗ DEPLOYMENT NOT READY - Fix critical failures above" -ForegroundColor Red -BackgroundColor Black
        return $false
    }
}

# Main Execution
function Main {
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
    Write-Host "║   Ledger Application - Production Deployment Verification  ║" -ForegroundColor Blue
    Write-Host "║                                                            ║" -ForegroundColor Blue
    Write-Host "║    This script verifies that your production deployment    ║" -ForegroundColor Blue
    Write-Host "║    is properly configured with all critical features.      ║" -ForegroundColor Blue
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Blue
    
    # Run verification checks
    if (-not (Verify-AppRunning)) {
        Write-Host "`nStart the application first:" -ForegroundColor Red
        Write-Host "  npm run build && npm run start`n" -ForegroundColor Red
        return 1
    }
    
    Verify-Environment
    Verify-Database
    Verify-Authentication
    Verify-Performance
    Verify-Logging
    Verify-ProcessManager
    Test-Features
    
    # Print summary and exit
    $ready = Print-Summary
    
    if ($ready) {
        return 0
    } else {
        return 1
    }
}

# Run main function
$exitCode = Main
exit $exitCode
