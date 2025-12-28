# Simple Web Audit Script using curl.exe

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
    
    # Use curl.exe with timing
    $output = curl.exe -w "`nHTTP:%{http_code}|TIME:%{time_total}|SIZE:%{size_download}|SPEED:%{speed_download}" -o $null -s $url 2>&1
    
    if ($output -match "HTTP:(\d+)\|TIME:([0-9.]+)\|SIZE:(\d+)\|SPEED:([0-9.]+)") {
        $httpCode = $matches[1]
        $time = [math]::Round([double]$matches[2], 3)
        $size = [int]$matches[3]
        $speed = [math]::Round([double]$matches[4] / 1024, 2)
        
        $statusEmoji = if ($httpCode -eq "200" -or $httpCode -eq "201") { "[PASS]" } else { "[FAIL]" }
        $statusColor = if ($httpCode -eq "200" -or $httpCode -eq "201") { "Green" } else { "Red" }
        $timeColor = if ($time -lt 0.5) { "Green" } elseif ($time -lt 1) { "Yellow" } else { "Red" }
        
        Write-Host "  Status: " -NoNewline
        Write-Host $statusEmoji -ForegroundColor $statusColor -NoNewline
        Write-Host " HTTP $httpCode"
        Write-Host "  Response Time: " -NoNewline
        Write-Host "${time}s" -ForegroundColor $timeColor
        Write-Host "  Size: $([math]::Round($size/1024, 2)) KB"
        Write-Host "  Speed: $speed KB/s"
        
        $results += @{
            Name = $endpoint.Name
            HttpCode = $httpCode
            Time = $time
            Size = $size
            Speed = $speed
            Status = if ($httpCode -eq "200" -or $httpCode -eq "201") { "PASS" } else { "FAIL" }
        }
    } else {
        Write-Host "  Status: [FAIL] Could not connect" -ForegroundColor Red
        $results += @{
            Name = $endpoint.Name
            HttpCode = "ERR"
            Time = 0
            Size = 0
            Speed = 0
            Status = "FAIL"
        }
    }
    Write-Host ""
}

Write-Host "`n--- SECURITY HEADERS TEST ---`n" -ForegroundColor Yellow

# Check security headers
$headerOutput = curl.exe -I -s "$baseUrl/"
$securityHeaders = @{
    "X-Content-Type-Options" = $false
    "X-Frame-Options" = $false  
    "X-XSS-Protection" = $false
    "Strict-Transport-Security" = $false
    "Content-Security-Policy" = $false
    "Referrer-Policy" = $false
}

foreach ($line in $headerOutput) {
    foreach ($header in $securityHeaders.Keys) {
        if ($line -match "^${header}:") {
            $securityHeaders[$header] = $true
        }
    }
}

$secPassed = 0
foreach ($header in $securityHeaders.GetEnumerator()) {
    $status = if ($header.Value) { "[PASS]" } else { "[FAIL]" }
    $color = if ($header.Value) { "Green" } else { "Red" }
    Write-Host "  $status " -ForegroundColor $color -NoNewline
    Write-Host "$($header.Key)"
    if ($header.Value) { $secPassed++ }
}

$securityScore = [math]::Round(($secPassed / $securityHeaders.Count) * 100)
Write-Host "`n  Security Score: $securityScore% ($secPassed/$($securityHeaders.Count))" -ForegroundColor $(if ($securityScore -ge 80) { "Green" } elseif ($securityScore -ge 50) { "Yellow" } else { "Red" })

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passedTests = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$totalTests = $results.Count
$successRate = [math]::Round(($passedTests / $totalTests) * 100)

Write-Host "Endpoint Tests: $passedTests/$totalTests passed ($successRate%)" -ForegroundColor $(if ($successRate -eq 100) { "Green" } else { "Yellow" })
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
    
    Write-Host "`nOVERALL SCORE: " -NoNewline
    Write-Host "$overallScore/100" -ForegroundColor $(if ($overallScore -ge 80) { "Green" } elseif ($overallScore -ge 60) { "Yellow" } else { "Red" })
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RECOMMENDATIONS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$hasIssues = $false

if ($securityScore -lt 80) {
    Write-Host "[!] Add security headers in next.config.ts:" -ForegroundColor Yellow
    Write-Host "    - X-Frame-Options, X-Content-Type-Options" -ForegroundColor Gray
    Write-Host "    - Content-Security-Policy, Strict-Transport-Security`n" -ForegroundColor Gray
    $hasIssues = $true
}

if ($avgTime -gt 0.5) {
    Write-Host "[!] Consider performance optimization:" -ForegroundColor Yellow
    Write-Host "    - Enable Next.js caching" -ForegroundColor Gray
    Write-Host "    - Optimize database queries`n" -ForegroundColor Gray
    $hasIssues = $true
}

if ($successRate -lt 100) {
    Write-Host "[!] Some endpoints failed - check:" -ForegroundColor Yellow
    Write-Host "    - Server is running on port 3000" -ForegroundColor Gray
    Write-Host "    - Database connection is active`n" -ForegroundColor Gray
    $hasIssues = $true
}

if (-not $hasIssues) {
    Write-Host "[OK] All checks passed! Application is healthy." -ForegroundColor Green
}

Write-Host "`n"
