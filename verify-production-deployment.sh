#!/bin/bash

# Production Deployment Verification Script
# Verifies all critical functionality before go-live
# Usage: bash verify-production-deployment.sh

set -e  # Exit on error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

# Function to print test status
test_passed() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED++))
}

test_failed() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAILED++))
}

test_warning() {
    echo -e "${YELLOW}⚠ WARN${NC}: $1"
    ((WARNINGS++))
}

# Function to print section header
print_header() {
    echo ""
    echo -e "${BLUE}========================================"
    echo "$1"
    echo "========================================${NC}"
}

# Verify application started
verify_app_running() {
    print_header "1. APPLICATION STATUS"
    
    if curl -s http://localhost:3000/health | grep -q "healthy"; then
        test_passed "Application is running and health check responds"
    else
        test_failed "Application is not responding on port 3000"
        return 1
    fi
    
    # Check Node.js process
    if pgrep -f "node" > /dev/null; then
        test_passed "Node.js process detected"
    else
        test_failed "Node.js process not running"
    fi
}

# Verify environment variables
verify_environment() {
    print_header "2. ENVIRONMENT CONFIGURATION"
    
    if [ -z "$DATABASE_URL" ]; then
        test_failed "DATABASE_URL environment variable not set"
    else
        test_passed "DATABASE_URL is set (length: ${#DATABASE_URL})"
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        test_failed "JWT_SECRET environment variable not set"
    else
        if [ ${#JWT_SECRET} -lt 32 ]; then
            test_warning "JWT_SECRET is less than 32 characters (security risk)"
        else
            test_passed "JWT_SECRET is set (length: ${#JWT_SECRET} chars)"
        fi
    fi
    
    if [ -z "$NODE_ENV" ]; then
        test_warning "NODE_ENV not explicitly set"
    else
        if [ "$NODE_ENV" = "production" ]; then
            test_passed "NODE_ENV is set to production"
        else
            test_warning "NODE_ENV is set to '$NODE_ENV' (expected 'production')"
        fi
    fi
    
    if [ -z "$NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES" ]; then
        test_passed "NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES not set (using default: 15 minutes)"
    else
        test_passed "Session timeout configured to $NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES minutes"
    fi
}

# Verify database connectivity
verify_database() {
    print_header "3. DATABASE CONNECTIVITY"
    
    if command -v psql &> /dev/null; then
        if psql $DATABASE_URL -c "SELECT NOW();" > /dev/null 2>&1; then
            test_passed "Database connection successful"
        else
            test_failed "Cannot connect to database with credentials"
        fi
        
        # Check required tables exist
        TABLE_COUNT=$(psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | grep -oE '[0-9]+' | head -1)
        if [ "$TABLE_COUNT" -gt 5 ]; then
            test_passed "Database has $TABLE_COUNT tables (schema appears initialized)"
        else
            test_failed "Database has only $TABLE_COUNT tables (run migrations?)"
        fi
    else
        test_warning "psql not found (cannot verify database directly)"
    fi
}

# Verify authentication flow
verify_authentication() {
    print_header "4. AUTHENTICATION & SECURITY"
    
    # Test login endpoint
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin","password":"admin"}' || echo "")
    
    if echo "$LOGIN_RESPONSE" | grep -q "\"id\""; then
        test_passed "Login endpoint responds with user data"
    else
        test_warning "Login endpoint did not return expected user data (may need correct credentials)"
    fi
    
    # Test protected API without token (should return 401)
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/accounts/full)
    if [ "$STATUS" = "401" ]; then
        test_passed "API correctly rejects requests without authentication (401)"
    else
        test_failed "API returned status $STATUS (expected 401 for unauthenticated request)"
    fi
    
    # Test with Authorization header (if we have a token)
    if [ ! -z "$AUTH_TOKEN" ]; then
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            http://localhost:3000/api/accounts/full)
        if [ "$STATUS" = "200" ]; then
            test_passed "API responds correctly with valid authentication"
        fi
    fi
}

# Verify HTTPS/SSL (if applicable)
verify_https() {
    print_header "5. HTTPS & SECURITY HEADERS"
    
    # Check if behind reverse proxy with HTTPS
    if [ ! -z "$HTTPS_DOMAIN" ]; then
        HEADERS=$(curl -s -I "https://$HTTPS_DOMAIN" 2>/dev/null)
        
        if echo "$HEADERS" | grep -q "Strict-Transport-Security"; then
            test_passed "HSTS header is present"
        else
            test_warning "HSTS header not found (verify SSL configuration)"
        fi
        
        if echo "$HEADERS" | grep -q "X-Frame-Options"; then
            test_passed "X-Frame-Options header is present"
        else
            test_warning "X-Frame-Options header not found"
        fi
    else
        test_warning "HTTPS_DOMAIN not set (cannot verify HTTPS headers)"
    fi
}

# Verify performance
verify_performance() {
    print_header "6. PERFORMANCE METRICS"
    
    # Measure response time
    START=$(date +%s%N)
    curl -s http://localhost:3000/ > /dev/null
    END=$(date +%s%N)
    RESPONSE_TIME=$((($END - $START) / 1000000))  # Convert to milliseconds
    
    if [ $RESPONSE_TIME -lt 5000 ]; then
        test_passed "Homepage loads in ${RESPONSE_TIME}ms (excellent)"
    elif [ $RESPONSE_TIME -lt 10000 ]; then
        test_passed "Homepage loads in ${RESPONSE_TIME}ms (acceptable)"
    else
        test_warning "Homepage loads in ${RESPONSE_TIME}ms (slow - investigate)"
    fi
    
    # Check memory usage
    if command -v ps &> /dev/null; then
        MEMORY=$(ps aux | grep "node" | grep -v grep | awk '{print $6}' | head -1)
        if [ ! -z "$MEMORY" ]; then
            test_passed "Node.js memory usage: ${MEMORY}KB"
        fi
    fi
    
    # Check CPU usage
    if command -v top &> /dev/null; then
        test_warning "Run 'top -u node' to check CPU usage (should be <10% at idle)"
    fi
}

# Verify backups
verify_backups() {
    print_header "7. BACKUP CONFIGURATION"
    
    if [ -d "/backups/ledger" ]; then
        BACKUP_COUNT=$(ls /backups/ledger/*.sql.gz 2>/dev/null | wc -l)
        if [ $BACKUP_COUNT -gt 0 ]; then
            LATEST_BACKUP=$(ls -t /backups/ledger/*.sql.gz 2>/dev/null | head -1)
            BACKUP_AGE=$((($(date +%s) - $(stat -c %Y "$LATEST_BACKUP")) / 3600))
            
            if [ $BACKUP_AGE -lt 24 ]; then
                test_passed "Latest backup is ${BACKUP_AGE} hours old"
            else
                test_warning "Latest backup is ${BACKUP_AGE} hours old (check backup schedule)"
            fi
        else
            test_warning "No backups found in /backups/ledger/"
        fi
    else
        test_warning "Backup directory /backups/ledger/ not found"
    fi
}

# Verify logging
verify_logging() {
    print_header "8. LOGGING & MONITORING"
    
    if [ -f "/var/log/ledger/app.log" ]; then
        test_passed "Application log file found"
        RECENT_ERRORS=$(grep -c "error\|Error\|ERROR" /var/log/ledger/app.log 2>/dev/null || echo "0")
        if [ "$RECENT_ERRORS" -gt 0 ]; then
            test_warning "Found $RECENT_ERRORS error entries in logs (review recommended)"
        fi
    elif [ -f "nohup.log" ]; then
        test_passed "Application logs found (nohup.log)"
    else
        test_warning "Application log file not found (ensure logging is configured)"
    fi
}

# Verify pm2/systemd
verify_process_manager() {
    print_header "9. PROCESS MANAGEMENT"
    
    if command -v pm2 &> /dev/null; then
        if pm2 list | grep -q "ledger\|npm"; then
            test_passed "Application registered with PM2"
        else
            test_warning "PM2 installed but application not registered"
        fi
    elif systemctl list-units --all | grep -q "ledger"; then
        test_passed "Application registered as systemd service"
    else
        test_warning "Application not registered with process manager (may not auto-restart)"
    fi
}

# Test specific features
test_features() {
    print_header "10. FEATURE VERIFICATION"
    
    # Get auth token first
    if command -v jq &> /dev/null; then
        TOKEN=$(curl -s -X POST http://localhost:3000/api/login \
            -H "Content-Type: application/json" \
            -d '{"email":"admin","password":"admin"}' | jq -r '.id // empty' 2>/dev/null)
        
        if [ ! -z "$TOKEN" ]; then
            # Test accounts endpoint
            ACCOUNTS=$(curl -s -H "Cookie: auth-token=$TOKEN" \
                http://localhost:3000/api/accounts/full | jq '.data | length' 2>/dev/null)
            if [ ! -z "$ACCOUNTS" ]; then
                test_passed "Accounts API returns $ACCOUNTS accounts"
            fi
            
            # Test transactions endpoint
            TRANSACTIONS=$(curl -s -H "Cookie: auth-token=$TOKEN" \
                http://localhost:3000/api/transactions | jq '.data | length' 2>/dev/null)
            if [ ! -z "$TRANSACTIONS" ]; then
                test_passed "Transactions API returns $TRANSACTIONS transactions"
            fi
        fi
    else
        test_warning "jq not installed (cannot parse API responses)"
    fi
}

# Print summary
print_summary() {
    print_header "VERIFICATION SUMMARY"
    
    echo -e "${GREEN}Passed:${NC}  $PASSED"
    echo -e "${RED}Failed:${NC}  $FAILED"
    echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ READY FOR PRODUCTION${NC}"
        return 0
    else
        echo -e "${RED}✗ DEPLOYMENT NOT READY - Fix failures above${NC}"
        return 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}"
    cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║   Ledger Application - Production Deployment Verification  ║
║                                                            ║
║    This script verifies that your production deployment    ║
║    is properly configured with all critical features.      ║
╚════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    # Run all verification checks
    verify_app_running || {
        test_failed "Application not running on port 3000"
        echo ""
        echo "Start the application first:"
        echo "  npm run build && npm run start"
        return 1
    }
    
    verify_environment
    verify_database
    verify_authentication
    verify_https
    verify_performance
    verify_backups
    verify_logging
    verify_process_manager
    test_features
    
    # Print summary
    echo ""
    print_summary
}

# Run main function
main "$@"
