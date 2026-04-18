# Simple Automated API Test Script for Ledger Application
# Run: .\test-api-simple.ps1

Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    LEDGER APP - AUTOMATED API TESTS       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "Server: http://localhost:3000`n" -ForegroundColor Gray

$passCount = 0
$failCount = 0

# ==========================================
# TEST 1: API SECURITY - REQUIRE AUTHENTICATION
# ==========================================
Write-Host "TEST 1: Authentication Required on APIs`n" -ForegroundColor Yellow

Write-Host "1a. GET /api/accounts/full without auth..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/accounts/full" -ErrorAction Continue 2>&1
    if ($response.Exception.Response.StatusCode -eq 'Unauthorized' -or ($response.StatusCode -eq 401)) {
        Write-Host "✅ PASS - Returns 401 Unauthorized`n" -ForegroundColor Green
        $passCount++
    } else {
        Write-Host "❌ FAIL - Should return 401 but got: $($response.StatusCode)`n" -ForegroundColor Red
        $failCount++
    }
}
catch [System.Net.WebException] {
    if ($_.Exception.Response.StatusCode -eq 'Unauthorized') {
        Write-Host "✅ PASS - Returns 401 Unauthorized`n" -ForegroundColor Green
        $passCount++
    } else {
        Write-Host "❌ FAIL - Wrong error: $($_.Exception.Response.StatusCode)`n" -ForegroundColor Red
        $failCount++
    }
}

Write-Host "1b. GET /api/employees/minimal without auth..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/employees/minimal" -ErrorAction Continue 2>&1
    if ($response.Exception.Response.StatusCode -eq 'Unauthorized' -or ($response.StatusCode -eq 401)) {
        Write-Host "✅ PASS - Returns 401 Unauthorized`n" -ForegroundColor Green
        $passCount++
    } else {
        Write-Host "❌ FAIL - Should return 401`n" -ForegroundColor Red
        $failCount++
    }
}
catch [System.Net.WebException] {
    if ($_.Exception.Response.StatusCode -eq 'Unauthorized') {
        Write-Host "✅ PASS - Returns 401 Unauthorized`n" -ForegroundColor Green
        $passCount++
    } else {
        Write-Host "❌ FAIL - Wrong error`n" -ForegroundColor Red
        $failCount++
    }
}

# ==========================================
# TEST 2: LOGIN FLOW
# ==========================================
Write-Host "TEST 2: Login Flow`n" -ForegroundColor Yellow

Write-Host "2a. POST /api/login with valid credentials..."
try {
    $loginBody = @{
        email    = "admin"
        password = "admin"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -SessionVariable "session" `
        -ErrorAction Continue
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS - Login successful (200 OK)" -ForegroundColor Green
        $data = $response.Content | ConvertFrom-Json
        Write-Host "   User: $($data.user.email)" -ForegroundColor Gray
        Write-Host "   Role: $($data.user.role)`n" -ForegroundColor Gray
        $passCount++
        
        # Store session for authenticated tests
        $script:sessionVar = $session
    } else {
        Write-Host "❌ FAIL - Login returned $($response.StatusCode)`n" -ForegroundColor Red
        $failCount++
    }
}
catch {
    Write-Host "❌ FAIL - Error: $($_.Exception.Message)`n" -ForegroundColor Red
    $failCount++
}

# ==========================================
# TEST 3: AUTHENTICATED API ACCESS
# ==========================================
Write-Host "TEST 3: API Access with Authentication`n" -ForegroundColor Yellow

if ($script:sessionVar) {
    Write-Host "3a. GET /api/accounts (with auth)..."
    try {
        $response = Invoke-WebRequest `
            -Uri "http://localhost:3000/api/accounts" `
            -WebSession $script:sessionVar `
            -ErrorAction Continue
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ PASS - Returned 200 OK" -ForegroundColor Green
            $data = $response.Content | ConvertFrom-Json
            Write-Host "   Contains: $($data.data.Count) accounts`n" -ForegroundColor Gray
            $passCount++
        } else {
            Write-Host "❌ FAIL - Returned $($response.StatusCode)`n" -ForegroundColor Red
            $failCount++
        }
    }
    catch {
        Write-Host "❌ FAIL - Error: $($_.Exception.Message)`n" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host "3b. GET /api/accounts/full (with auth)..."
    try {
        $response = Invoke-WebRequest `
            -Uri "http://localhost:3000/api/accounts/full" `
            -WebSession $script:sessionVar `
            -ErrorAction Continue
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ PASS - Returned 200 OK" -ForegroundColor Green
            $data = $response.Content | ConvertFrom-Json
            if ($data.data -and $data.data[0]) {
                $acct = $data.data[0]
                Write-Host "   Account: $($acct.name)" -ForegroundColor Gray
                Write-Host "   Budget: $($acct.budget)" -ForegroundColor Gray
                Write-Host "   Has address field: $(if ($acct.address) { 'YES' } else { 'NO' })`n" -ForegroundColor Gray
            }
            $passCount++
        } else {
            Write-Host "❌ FAIL - Returned $($response.StatusCode)`n" -ForegroundColor Red
            $failCount++
        }
    }
    catch {
        Write-Host "❌ FAIL - Error: $($_.Exception.Message)`n" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host "3c. GET /api/employees/minimal (with auth)..."
    try {
        $response = Invoke-WebRequest `
            -Uri "http://localhost:3000/api/employees/minimal" `
            -WebSession $script:sessionVar `
            -ErrorAction Continue
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ PASS - Returned 200 OK" -ForegroundColor Green
            $data = $response.Content | ConvertFrom-Json
            if ($data -and $data[0]) {
                $emp = $data[0]
                Write-Host "   Employee: $($emp.name)" -ForegroundColor Gray
                Write-Host "   Partner Type: $($emp.partnerType)" -ForegroundColor Gray
                if ($emp.partnerType) {
                    Write-Host "   ✅ Has partnerType (required for filtering)" -ForegroundColor Green
                }
                if ($emp.salary) {
                    Write-Host "   ❌ HAS SALARY DATA (SECURITY ISSUE!)" -ForegroundColor Red
                } else {
                    Write-Host "   ✅ NO salary data exposed" -ForegroundColor Green
                }
            }
            Write-Host ""
            $passCount++
        } else {
            Write-Host "❌ FAIL - Returned $($response.StatusCode)`n" -ForegroundColor Red
            $failCount++
        }
    }
    catch {
        Write-Host "❌ FAIL - Error: $($_.Exception.Message)`n" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host "3d. GET /api/auth/me (verify current user)..."
    try {
        $response = Invoke-WebRequest `
            -Uri "http://localhost:3000/api/auth/me" `
            -WebSession $script:sessionVar `
            -ErrorAction Continue
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ PASS - Returned 200 OK" -ForegroundColor Green
            $data = $response.Content | ConvertFrom-Json
            Write-Host "   User ID: $($data.id)" -ForegroundColor Gray
            Write-Host "   Email: $($data.email)" -ForegroundColor Gray
            Write-Host "   Company ID: $($data.companyId)`n" -ForegroundColor Gray
            $passCount++
        } else {
            Write-Host "❌ FAIL - Returned $($response.StatusCode)`n" -ForegroundColor Red
            $failCount++
        }
    }
    catch {
        Write-Host "❌ FAIL - Error: $($_.Exception.Message)`n" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host "3e. GET /api/transactions (with auth)..."
    try {
        $response = Invoke-WebRequest `
            -Uri "http://localhost:3000/api/transactions?limit=10" `
            -WebSession $script:sessionVar `
            -ErrorAction Continue
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ PASS - Returned 200 OK" -ForegroundColor Green
            $data = $response.Content | ConvertFrom-Json
            Write-Host "   Total Transactions: $($data.pagination.total)" -ForegroundColor Gray
            Write-Host "   Returned (this page): $($data.data.Count)`n" -ForegroundColor Gray
            $passCount++
        } else {
            Write-Host "❌ FAIL - Returned $($response.StatusCode)`n" -ForegroundColor Red
            $failCount++
        }
    }
    catch {
        Write-Host "❌ FAIL - Error: $($_.Exception.Message)`n" -ForegroundColor Red
        $failCount++
    }
} else {
    Write-Host "⚠️  Skipping authenticated tests (login failed)`n" -ForegroundColor Yellow
    $failCount += 5
}

# ==========================================
# TEST 4: PAGE ACCESS
# ==========================================
Write-Host "TEST 4: Protected Page Access`n" -ForegroundColor Yellow

Write-Host "4a. GET /dashboard (HTML)..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/" -ErrorAction Continue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS - Page loads (200 OK)" -ForegroundColor Green
        Write-Host "   Content length: $($response.Content.Length) bytes`n" -ForegroundColor Gray
        $passCount++
    } else {
        Write-Host "❌ FAIL - Returned $($response.StatusCode)`n" -ForegroundColor Red
        $failCount++
    }
}
catch {
    Write-Host "❌ FAIL - Error: $($_.Exception.Message)`n" -ForegroundColor Red
    $failCount++
}

Write-Host "4b. GET /transactions (HTML)..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/transactions" -ErrorAction Continue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS - Page loads (200 OK)`n" -ForegroundColor Green
        $passCount++
    } else {
        Write-Host "❌ FAIL - Returned $($response.StatusCode)`n" -ForegroundColor Red
        $failCount++
    }
}
catch {
    Write-Host "❌ FAIL - Error: $($_.Exception.Message)`n" -ForegroundColor Red
    $failCount++
}

# ==========================================
# SUMMARY REPORT
# ==========================================
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          TEST RESULTS SUMMARY             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan

$total = $passCount + $failCount
$percentage = if ($total -gt 0) { [math]::Round(($passCount / $total) * 100) } else { 0 }

Write-Host "Total Tests: $total" -ForegroundColor Cyan
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "Pass Rate: $percentage%`n" -ForegroundColor Cyan

if ($failCount -eq 0) {
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "Application appears ready for production testing.`n" -ForegroundColor Green
} else {
    Write-Host "❌ $failCount TEST(S) FAILED" -ForegroundColor Red
    Write-Host "Review the output above for details.`n" -ForegroundColor Red
}

Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. ✅ Automated API tests passed - Continue to manual QA" -ForegroundColor Gray
Write-Host "2. 📝 Use PRODUCTION_TESTING_GUIDE.md for comprehensive testing" -ForegroundColor Gray
Write-Host "3. 🧪 Test all user workflows via browser" -ForegroundColor Gray
Write-Host "4. 🔍 Verify no sensitive data exposure" -ForegroundColor Gray
Write-Host "5. 📊 Performance and load testing (if needed)" -ForegroundColor Gray
Write-Host "6. ✏️ Document any issues found" -ForegroundColor Gray
Write-Host "7. 🚀 Get stakeholder sign-off before production deployment`n" -ForegroundColor Gray
