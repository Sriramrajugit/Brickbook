# Web Application Audit Script (Lighthouse-style with curl)
# Tests performance, security, and API health

$baseUrl = "http://localhost:3000"
$results = @()

Write-Host "`n=== WEB APPLICATION AUDIT ===" -ForegroundColor Cyan
Write-Host "Target: $baseUrl" -ForegroundColor Cyan
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n" -ForegroundColor Cyan

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [string]$Body = $null
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    
    $curlArgs = @(
        "-w", "`n`nHTTP_CODE:%{http_code}`nTIME_TOTAL:%{time_total}s`nTIME_CONNECT:%{time_connect}s`nTIME_STARTTRANSFER:%{time_starttransfer}s`nSIZE_DOWNLOAD:%{size_download}bytes`nSPEED_DOWNLOAD:%{speed_download}bytes/s`n",
        "-o", "nul",
        "-s",
        "-X", $Method,
        "-H", "Accept: application/json"
    )
    
    if ($Body) {
        $curlArgs += @("-H", "Content-Type: application/json", "-d", $Body)
    }
    
    $curlArgs += $Url
    
    $output = & curl @curlArgs
    
    # Parse output
    $httpCode = ($output | Select-String "HTTP_CODE:(\d+)").Matches.Groups[1].Value
    $timeTotal = ($output | Select-String "TIME_TOTAL:([0-9.]+)s").Matches.Groups[1].Value
    $timeConnect = ($output | Select-String "TIME_CONNECT:([0-9.]+)s").Matches.Groups[1].Value
    $timeStartTransfer = ($output | Select-String "TIME_STARTTRANSFER:([0-9.]+)s").Matches.Groups[1].Value
    $sizeDownload = ($output | Select-String "SIZE_DOWNLOAD:(\d+)bytes").Matches.Groups[1].Value
    $speedDownload = ($output | Select-String "SPEED_DOWNLOAD:([0-9.]+)bytes/s").Matches.Groups[1].Value
    
    $status = if ($httpCode -eq "200" -or $httpCode -eq "201") { "PASS" } else { "FAIL" }
    $statusColor = if ($httpCode -eq "200" -or $httpCode -eq "201") { "Green" } else { "Red" }
    
    Write-Host "  Status: " -NoNewline
    Write-Host $status -ForegroundColor $statusColor
    Write-Host "  HTTP Code: $httpCode"
    Write-Host "  Response Time: ${timeTotal}s" -ForegroundColor $(if ([double]$timeTotal -lt 0.5) { "Green" } elseif ([double]$timeTotal -lt 1) { "Yellow" } else { "Red" })
    Write-Host "  Time to First Byte: ${timeStartTransfer}s"
    Write-Host "  Size: $sizeDownload bytes"
    Write-Host "  Speed: $([math]::Round([double]$speedDownload / 1024, 2)) KB/s"
    Write-Host ""
    
    return @{
        Name = $Name
        Url = $Url
        Method = $Method
        HttpCode = $httpCode
        TimeTotal = $timeTotal
        TimeConnect = $timeConnect
        TimeStartTransfer = $timeStartTransfer
        SizeDownload = $sizeDownload
        SpeedDownload = $speedDownload
        Status = if ($httpCode -eq "200" -or $httpCode -eq "201") { "PASS" } else { "FAIL" }
    }
}

# Function to test headers
function Test-SecurityHeaders {
    param([string]$Url)
    
    Write-Host "Testing: Security Headers" -ForegroundColor Yellow
    
    $headers = curl -I -s $Url
    
    $securityHeaders = @{
        "X-Content-Type-Options" = $false
        "X-Frame-Options" = $false
        "X-XSS-Protection" = $false
        "Strict-Transport-Security" = $false
        "Content-Security-Policy" = $false
        "Referrer-Policy" = $false
    }
    
    foreach ($header in $headers) {
        foreach ($secHeader in $securityHeaders.Keys) {
            if ($header -match "^${secHeader}:") {
                $securityHeaders[$secHeader] = $true
            }
        }
    }
    
    $passed = 0
    $total = $securityHeaders.Count
    
    foreach ($header in $securityHeaders.GetEnumerator()) {
        $status = if ($header.Value) { "[PASS]" } else { "[FAIL]" }
        $color = if ($header.Value) { "Green" } else { "Red" }
        Write-Host "  $status $($header.Key)" -ForegroundColor $color
        if ($header.Value) { $passed++ }
    }
    
    $score = [math]::Round(($passed / $total) * 100)
    Write-Host "  Security Score: $score% ($passed/$total)" -ForegroundColor $(if ($score -ge 80) { "Green" } elseif ($score -ge 50) { "Yellow" } else { "Red" })
    Write-Host ""
    
    return $score
}

# Run Tests
Write-Host "--- PERFORMANCE TESTS ---" -ForegroundColor Cyan
Write-Host ""

# Test main page
$results += Test-Endpoint -Name "Home Page" -Url "$baseUrl/"

# Test API endpoints
$results += Test-Endpoint -Name "API: Get Accounts" -Url "$baseUrl/api/accounts"
$results += Test-Endpoint -Name "API: Get Transactions" -Url "$baseUrl/api/transactions?limit=100"
$results += Test-Endpoint -Name "API: Get Employees" -Url "$baseUrl/api/employees"
$results += Test-Endpoint -Name "API: Get Categories" -Url "$baseUrl/api/categories"
$results += Test-Endpoint -Name "API: Get Attendance" -Url "$baseUrl/api/attendance"
$results += Test-Endpoint -Name "API: Get Payroll" -Url "$baseUrl/api/payroll"

# Test with filters
$results += Test-Endpoint -Name "API: Transactions (Filtered)" -Url "$baseUrl/api/transactions?page=1&limit=10&sortBy=date&sortOrder=desc"

Write-Host "--- SECURITY TESTS ---" -ForegroundColor Cyan
Write-Host ""
$securityScore = Test-SecurityHeaders -Url "$baseUrl/"

# Summary
Write-Host "=== AUDIT SUMMARY ===" -ForegroundColor Cyan
Write-Host ""

$passedTests = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$totalTests = $results.Count
$successRate = [math]::Round(($passedTests / $totalTests) * 100)

Write-Host "Tests Passed: $passedTests/$totalTests ($successRate%)" -ForegroundColor $(if ($successRate -eq 100) { "Green" } else { "Yellow" })
Write-Host "Security Score: $securityScore%" -ForegroundColor $(if ($securityScore -ge 80) { "Green" } elseif ($securityScore -ge 50) { "Yellow" } else { "Red" })

# Performance summary
$avgTime = ($results | ForEach-Object { [double]$_.TimeTotal } | Measure-Object -Average).Average
$maxTime = ($results | ForEach-Object { [double]$_.TimeTotal } | Measure-Object -Maximum).Maximum
$minTime = ($results | ForEach-Object { [double]$_.TimeTotal } | Measure-Object -Minimum).Minimum

Write-Host ""
Write-Host "Performance Metrics:" -ForegroundColor Cyan
Write-Host "  Average Response Time: $([math]::Round($avgTime, 3))s" -ForegroundColor $(if ($avgTime -lt 0.5) { "Green" } elseif ($avgTime -lt 1) { "Yellow" } else { "Red" })
Write-Host "  Fastest Response: $([math]::Round($minTime, 3))s"
Write-Host "  Slowest Response: $([math]::Round($maxTime, 3))s"

# Overall score
$performanceScore = if ($avgTime -lt 0.3) { 100 } elseif ($avgTime -lt 0.5) { 90 } elseif ($avgTime -lt 1) { 75 } elseif ($avgTime -lt 2) { 60 } else { 40 }
$overallScore = [math]::Round(($successRate * 0.5) + ($performanceScore * 0.3) + ($securityScore * 0.2))

Write-Host ""
Write-Host "OVERALL SCORE: $overallScore/100" -ForegroundColor $(if ($overallScore -ge 80) { "Green" } elseif ($overallScore -ge 60) { "Yellow" } else { "Red" })
Write-Host ""

# Detailed results table
Write-Host "=== DETAILED RESULTS ===" -ForegroundColor Cyan
Write-Host ""
$results | Format-Table -Property Name, HttpCode, @{Label="Time(s)";Expression={$_.TimeTotal}}, @{Label="Size(KB)";Expression={[math]::Round([double]$_.SizeDownload/1024, 2)}}, Status -AutoSize

# Recommendations
Write-Host "=== RECOMMENDATIONS ===" -ForegroundColor Cyan
Write-Host ""

if ($securityScore -lt 80) {
    Write-Host "[WARNING] Security: Add missing security headers to Next.js config" -ForegroundColor Yellow
}

if ($avgTime -gt 0.5) {
    Write-Host "[WARNING] Performance: Consider implementing caching or database optimization" -ForegroundColor Yellow
}

if ($successRate -lt 100) {
    Write-Host "[WARNING] Reliability: Some endpoints failed - check application logs" -ForegroundColor Yellow
}

if ($securityScore -ge 80 -and $avgTime -lt 0.5 -and $successRate -eq 100) {
    Write-Host "[PASS] All checks passed! Application is in good shape." -ForegroundColor Green
}

Write-Host ""
