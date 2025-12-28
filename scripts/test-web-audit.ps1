# Web Audit Script using native PowerShell
# Similar to Lighthouse audits - tests performance, security, and API health

$baseUrl = "http://localhost:3000"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  WEB APPLICATION AUDIT" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Target: $baseUrl"
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"

$endpoints = @(
    @{Name="Home Page"; Url="/"},
    @{Name="API: Accounts"; Url="/api/accounts"},
    @{Name="API: Transactions"; Url="/api/transactions?limit=100"},
    @{Name="API: Employees"; Url="/api/employees"},
    @{Name="API: Categories"; Url="/api/categories"},
    @{Name="API: Attendance"; Url="/api/attendance"},
    @{Name="API: Payroll"; Url="/api/payroll"},
    @{Name="API: Transactions (Filtered)"; Url="/api/transactions?page=1&limit=10&sortBy=date&sortOrder=desc"}
)

$results = @()

Write-Host "--- PERFORMANCE & CONNECTIVITY TESTS ---`n" -ForegroundColor Yellow

foreach ($endpoint in $endpoints) {
    $url = "$baseUrl$($endpoint.Url)"
    Write-Host "Testing: $($endpoint.Name)" -ForegroundColor Cyan
    Write-Host "  URL: $url"
    
    try {
        $start = Get-Date
        $response = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -TimeoutSec 10
        $end = Get-Date
        $elapsed = ($end - $start).TotalSeconds
        
        $httpCode = $response.StatusCode
        $time = [math]::Round($elapsed, 3)
        $size = $response.RawContentLength
        
        $statusEmoji = if ($httpCode -eq 200 -or $httpCode -eq 201) { "[PASS]" } else { "[WARN]" }
        $statusColor = if ($httpCode -eq 200 -or $httpCode -eq 201) { "Green" } else { "Yellow" }
        $timeColor = if ($time -lt 0.5) { "Green" } elseif ($time -lt 1) { "Yellow" } else { "Red" }
        
        Write-Host "  Status: " -NoNewline
        Write-Host $statusEmoji -ForegroundColor $statusColor -NoNewline
        Write-Host " HTTP $httpCode"
        Write-Host "  Response Time: " -NoNewline
        Write-Host "${time}s" -ForegroundColor $timeColor
        Write-Host "  Size: $([math]::Round($size/1024, 2)) KB"
        
        $results += @{
            Name = $endpoint.Name
            HttpCode = $httpCode
            Time = $time
            Size = $size
            Status = if ($httpCode -eq 200 -or $httpCode -eq 201) { "PASS" } else { "WARN" }
        }
    } catch {
        Write-Host "  Status: [FAIL] Could not connect" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        $results += @{
            Name = $endpoint.Name
            HttpCode = "ERR"
            Time = 0
            Size = 0
            Status = "FAIL"
        }
    }
    Write-Host ""
}

Write-Host "`n--- SECURITY HEADERS TEST ---`n" -ForegroundColor Yellow

# Check security headers
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/" -Method Head -UseBasicParsing
    $headers = $response.Headers
    
    $securityHeaders = @{
        "X-Content-Type-Options" = $headers.ContainsKey("X-Content-Type-Options")
        "X-Frame-Options" = $headers.ContainsKey("X-Frame-Options")
        "X-XSS-Protection" = $headers.ContainsKey("X-XSS-Protection")
        "Strict-Transport-Security" = $headers.ContainsKey("Strict-Transport-Security")
        "Content-Security-Policy" = $headers.ContainsKey("Content-Security-Policy")
        "Referrer-Policy" = $headers.ContainsKey("Referrer-Policy")
    }
    
    $secPassed = 0
    foreach ($header in $securityHeaders.GetEnumerator() | Sort-Object Name) {
        $status = if ($header.Value) { "[PASS]" } else { "[FAIL]" }
        $color = if ($header.Value) { "Green" } else { "Red" }
        Write-Host "  $status " -ForegroundColor $color -NoNewline
        Write-Host "$($header.Key)"
        if ($header.Value) { $secPassed++ }
    }
    
    $securityScore = [math]::Round(($secPassed / $securityHeaders.Count) * 100)
} catch {
    Write-Host "  [FAIL] Could not check headers" -ForegroundColor Red
    $securityScore = 0
    $secPassed = 0
}

Write-Host "`n  Security Score: $securityScore% ($secPassed/6)" -ForegroundColor $(if ($securityScore -ge 80) { "Green" } elseif ($securityScore -ge 50) { "Yellow" } else { "Red" })

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passedTests = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$totalTests = $results.Count
$successRate = [math]::Round(($passedTests / $totalTests) * 100)

Write-Host "Endpoint Tests: $passedTests/$totalTests passed ($successRate%)" -ForegroundColor $(if ($successRate -eq 100) { "Green" } elseif ($successRate -ge 75) { "Yellow" } else { "Red" })
Write-Host "Security Headers: $securityScore%" -ForegroundColor $(if ($securityScore -ge 80) { "Green" } elseif ($securityScore -ge 50) { "Yellow" } else { "Red" })

# Performance stats
$times = $results | Where-Object { $_.Time -gt 0 } | ForEach-Object { $_.Time }
if ($times.Count -gt 0) {
    $avgTime = [math]::Round(($times | Measure-Object -Average).Average, 3)
    $maxTime = [math]::Round(($times | Measure-Object -Maximum).Maximum, 3)
    $minTime = [math]::Round(($times | Measure-Object -Minimum).Minimum, 3)
    
    Write-Host "`nPerformance:"
    Write-Host "  Average: " -NoNewline
    Write-Host "${avgTime}s" -ForegroundColor $(if ($avgTime -lt 0.5) { "Green" } elseif ($avgTime -lt 1) { "Yellow" } else { "Red" })
    Write-Host "  Fastest: ${minTime}s"
    Write-Host "  Slowest: ${maxTime}s"
    
    # Calculate overall score
    $performanceScore = if ($avgTime -lt 0.3) { 100 } elseif ($avgTime -lt 0.5) { 90 } elseif ($avgTime -lt 1) { 75 } elseif ($avgTime -lt 2) { 60 } else { 40 }
    $overallScore = [math]::Round(($successRate * 0.5) + ($performanceScore * 0.3) + ($securityScore * 0.2))
    
    Write-Host "`n" -NoNewline
    Write-Host "OVERALL SCORE: " -NoNewline
    $scoreColor = if ($overallScore -ge 90) { "Green" } 
                  elseif ($overallScore -ge 80) { "Cyan" }
                  elseif ($overallScore -ge 60) { "Yellow" } 
                  else { "Red" }
    Write-Host "$overallScore/100" -ForegroundColor $scoreColor
    
    # Grade
    $grade = if ($overallScore -ge 90) { "A" }
             elseif ($overallScore -ge 80) { "B" }
             elseif ($overallScore -ge 70) { "C" }
             elseif ($overallScore -ge 60) { "D" }
             else { "F" }
    Write-Host "Grade: $grade" -ForegroundColor $scoreColor
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RECOMMENDATIONS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$hasIssues = $false

if ($securityScore -lt 80) {
    Write-Host "[!] SECURITY: Add security headers in next.config.ts" -ForegroundColor Yellow
    Write-Host "    headers: async () => [" -ForegroundColor Gray
    Write-Host "      { key: 'X-Frame-Options', value: 'DENY' }," -ForegroundColor Gray
    Write-Host "      { key: 'X-Content-Type-Options', value: 'nosniff' }," -ForegroundColor Gray
    Write-Host "      { key: 'Referrer-Policy', value: 'origin-when-cross-origin' }" -ForegroundColor Gray
    Write-Host "    ]`n" -ForegroundColor Gray
    $hasIssues = $true
}

if ($avgTime -gt 0.5) {
    Write-Host "[!] PERFORMANCE: Response times are slow" -ForegroundColor Yellow
    Write-Host "    - Enable Next.js caching and revalidation" -ForegroundColor Gray
    Write-Host "    - Optimize database queries with indexes" -ForegroundColor Gray
    Write-Host "    - Consider API response pagination`n" -ForegroundColor Gray
    $hasIssues = $true
}

if ($successRate -lt 100) {
    Write-Host "[!] RELIABILITY: Some endpoints failed" -ForegroundColor Yellow
    Write-Host "    - Ensure server is running on port 3000" -ForegroundColor Gray
    Write-Host "    - Check database connection and migrations" -ForegroundColor Gray
    Write-Host "    - Review server logs for errors`n" -ForegroundColor Gray
    $hasIssues = $true
}

if (-not $hasIssues) {
    Write-Host "[OK] Excellent! All checks passed." -ForegroundColor Green
    Write-Host "     Your application is production-ready.`n" -ForegroundColor Green
}

# Detailed results table
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DETAILED RESULTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

foreach ($result in $results) {
    $statusColor = if ($result.Status -eq "PASS") { "Green" } elseif ($result.Status -eq "WARN") { "Yellow" } else { "Red" }
    Write-Host "[$($result.Status)]" -ForegroundColor $statusColor -NoNewline
    Write-Host " $($result.Name)"
    if ($result.HttpCode -ne "ERR") {
        Write-Host "      HTTP $($result.HttpCode) | $($result.Time)s | $([math]::Round($result.Size/1024, 2)) KB" -ForegroundColor Gray
    }
}

Write-Host "`n"
