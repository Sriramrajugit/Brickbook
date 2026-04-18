# Automated Production Testing Script
# Run this script after starting: npm run dev

# Colors for output
$Green = "✅ "
$Red = "❌ "
$Yellow = "⚠️  "

Write-Host "`n=== LEDGER APPLICATION - AUTOMATED API TESTS ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date)" -ForegroundColor Gray
Write-Host "Server: http://localhost:3000`n" -ForegroundColor Gray

# Test results tracking
$passCount = 0
$failCount = 0

function Test-API {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null,
        [string]$AuthToken = "",
        [int]$ExpectedStatus = 200,
        [string]$Description = ""
    )
    
    Write-Host "Test: $Name"
    if ($Description) { Write-Host "  Description: $Description" -ForegroundColor Gray }
    Write-Host "  Request: $Method $Url"
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($AuthToken) {
            $headers["Authorization"] = "Bearer $AuthToken"
        }
        
        $params = @{
            Uri     = $Url
            Method  = $Method
            Headers = $headers
            ErrorAction = "Continue"
        }
        
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-WebRequest @params 2>&1
        
        $statusCode = $response.StatusCode
        if (-not $statusCode) {
            $statusCode = $response.Exception.Response.StatusCode
        }
        
        Write-Host "  Response Status: $statusCode (Expected: $ExpectedStatus)"
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "$Green PASS`n" -ForegroundColor Green
            $script:passCount++
            return $true
        } else {
            Write-Host "$Red FAIL - Expected $ExpectedStatus but got $statusCode`n" -ForegroundColor Red
            $script:failCount++
            return $false
        }
    }
    catch {
        $errorMessage = $_.Exception.Message
        
        # Check for 401 Unauthorized which shows as exception
        if ($errorMessage -like "*401*" -and $ExpectedStatus -eq 401) {
            Write-Host "  Response Status: 401 (Expected: $ExpectedStatus)"
            Write-Host "$Green PASS (Auth correctly rejected)`n" -ForegroundColor Green
            $script:passCount++
            return $true
        }
        
        Write-Host "  Error: $errorMessage" -ForegroundColor Red
        Write-Host "$Red FAIL - Exception occurred`n" -ForegroundColor Red
        $script:failCount++
        return $false
    }
}

# ==========================================
# TEST SUITE 1: AUTHENTICATION SECURITY
# ==========================================
Write-Host "`n════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TEST SUITE 1: AUTHENTICATION & SECURITY" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════`n" -ForegroundColor Cyan

# Test 1.1: Unauthenticated access to API should return 401
Test-API `
    -Name "1.1 - Unauthenticated API Access" `
    -Url "http://localhost:3000/api/accounts/full" `
    -Method "GET" `
    -ExpectedStatus 401 `
    -Description "API should reject requests without authentication"

# Test 1.2: Protected page requires auth
Test-API `
    -Name "1.2 - Protected Route Access (HTML)" `
    -Url "http://localhost:3000/attendance" `
    -Method "GET" `
    -ExpectedStatus 200 `
    -Description "Protected page returns HTML (redirects to login via frontend)"

# Test 1.3: Login endpoint exists
Test-API `
    -Name "1.3 - Login Endpoint Available" `
    -Url "http://localhost:3000/api/login" `
    -Method "POST" `
    -Body @{ email = "admin"; password = "admin" } `
    -ExpectedStatus 200 `
    -Description "Login endpoint should accept valid credentials"

Write-Host "`nNote: For authenticated tests, we'll need to perform login first.`n" -ForegroundColor Yellow

# ==========================================
# TEST SUITE 2: ENDPOINT AVAILABILITY
# ==========================================
Write-Host "`n════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TEST SUITE 2: ENDPOINT AVAILABILITY (without auth)" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════`n" -ForegroundColor Cyan

$endpoints = @(
    @{ Name = "2.1"; Url = "/api/accounts"; Status = 401 },
    @{ Name = "2.2"; Url = "/api/accounts/full"; Status = 401 },
    @{ Name = "2.3"; Url = "/api/employees/minimal"; Status = 401 },
    @{ Name = "2.4"; Url = "/api/categories/minimal"; Status = 401 },
    @{ Name = "2.5"; Url = "/api/transactions"; Status = 401 },
    @{ Name = "2.6"; Url = "/api/employees"; Status = 401 },
    @{ Name = "2.7"; Url = "/api/attendance"; Status = 401 },
    @{ Name = "2.8"; Url = "/api/payroll"; Status = 401 }
)

foreach ($endpoint in $endpoints) {
    Test-API `
        -Name "$($endpoint.Name) - Protected Endpoint" `
        -Url "http://localhost:3000$($endpoint.Url)" `
        -Method "GET" `
        -ExpectedStatus $endpoint.Status `
        -Description "Should return 401 without authentication"
}

# ==========================================
# TEST SUITE 3: LOGIN FLOW
# ==========================================
Write-Host "`n════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TEST SUITE 3: LOGIN FLOW TESTING" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════`n" -ForegroundColor Cyan

# Test login with valid credentials
Write-Host "Test: 3.1 - Login with Valid Credentials"
Write-Host "  Request: POST /api/login"

try {
    $loginResponse = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/login" `
        -Method POST `
        -Body ((@{ email = "admin"; password = "admin" } | ConvertTo-Json)) `
        -ContentType "application/json" `
        -SessionVariable "session" `
        -ErrorAction Continue 2>&1
    
    if ($loginResponse.StatusCode -eq 200) {
        Write-Host "  Response Status: 200 OK"
        $script:passCount++
        Write-Host "$Green PASS`n" -ForegroundColor Green
        
        # Store session for authenticated tests
        Write-Host "Test: 3.2 - Verify Auth Token in Response"
        $loginData = $loginResponse.Content | ConvertFrom-Json
        
        if ($loginData.user -and $loginData.user.id) {
            Write-Host "  Response contains user data: $($loginData.user.email)"
            Write-Host "$Green PASS - User authenticated`n" -ForegroundColor Green
            $script:passCount++
            
            # Now test with authenticated session
            Write-Host "Test: 3.3 - API Access with Authentication"
            Write-Host "  Request: GET /api/accounts (with auth)"
            
            $authResponse = Invoke-WebRequest `
                -Uri "http://localhost:3000/api/accounts" `
                -WebSession $session `
                -ErrorAction Continue 2>&1
            
            if ($authResponse.StatusCode -eq 200) {
                Write-Host "  Response Status: 200 OK"
                $data = $authResponse.Content | ConvertFrom-Json
                Write-Host "  Returned $(($data.data | Measure-Object).Count) accounts"
                Write-Host "$Green PASS - API accessible with auth`n" -ForegroundColor Green
                $script:passCount++
            } else {
                Write-Host "$Red FAIL - Could not access API with auth`n" -ForegroundColor Red
                $script:failCount++
            }
        } else {
            Write-Host "$Red FAIL - No user data in response`n" -ForegroundColor Red
            $script:failCount++
        }
    } else {
        Write-Host "$Red FAIL - Login returned status $($loginResponse.StatusCode)`n" -ForegroundColor Red
        $script:failCount++
    }
}
catch {
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "$Red FAIL - Login request failed`n" -ForegroundColor Red
    $script:failCount++
}

# ==========================================
# TEST SUITE 4: DATA FIELD RESTRICTIONS
# ==========================================
Write-Host "`n════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TEST SUITE 4: DATA FIELD RESTRICTIONS (Security)" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "Test: 4.1 - Employees Minimal Endpoint Has partnerType"
Write-Host "  Request: GET /api/employees/minimal"
Write-Host "  Expected: [{id, name, partnerType}, ...] (NO salary data)`n"

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/employees/minimal" `
        -WebSession $session `
        -ErrorAction Continue 2>&1
    
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        $firstEmployee = $data[0]
        
        $haId = $firstEmployee.id -ne $null
        $hasName = $firstEmployee.name -ne $null
        $hasPartnerType = $firstEmployee.partnerType -ne $null
        $hasSalary = $firstEmployee.salary -ne $null
        
        Write-Host "  Response Analysis:"
        Write-Host "    - Has id: $hasId"
        Write-Host "    - Has name: $hasName"
        Write-Host "    - Has partnerType: $hasPartnerType $($hasPartnerType ? '✅' : '❌')"
        Write-Host "    - Has salary: $hasSalary $($hasSalary ? '❌ SECURITY ISSUE!' : '✅ Good')"
        
        if ($hasPartnerType -and -not $hasSalary) {
            Write-Host "$Green PASS - Data properly restricted`n" -ForegroundColor Green
            $script:passCount++
        } else {
            Write-Host "$Red FAIL - Data restriction issue`n" -ForegroundColor Red
            $script:failCount++
        }
    }
}
catch {
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "$Red FAIL`n" -ForegroundColor Red
    $script:failCount++
}

# ==========================================
# SUMMARY
# ==========================================
Write-Host "`n════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════`n" -ForegroundColor Cyan

$totalTests = $script:passCount + $script:failCount
$passPercentage = if ($totalTests -gt 0) { [math]::Round(($script:passCount / $totalTests) * 100, 2) } else { 0 }

Write-Host "Total Tests Run: $totalTests"
Write-Host "Passed: $($script:passCount) $Green" -ForegroundColor Green
Write-Host "Failed: $($script:failCount) $(if ($script:failCount -gt 0) { Write-Host $Red -NoNewline } )" -ForegroundColor $(if ($script:failCount -eq 0) { "Green" } else { "Red" })
Write-Host "`nPass Rate: $passPercentage%`n"

if ($script:failCount -eq 0) {
    Write-Host "🎉 ALL TESTS PASSED! Application is ready for further testing.`n" -ForegroundColor Green
} else {
    Write-Host "⚠️  $($script:failCount) test(s) failed. Review errors above.`n" -ForegroundColor Yellow
}

Write-Host "Next Steps:"
Write-Host "1. Review any failed tests above"
Write-Host "2. Manual testing via browser (see PRODUCTION_TESTING_GUIDE.md)"
Write-Host "3. Test all user workflows"
Write-Host "4. Verify no sensitive data exposure"
Write-Host "5. Load testing if applicable`n"
