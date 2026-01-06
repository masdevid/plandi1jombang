#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="${API_URL:-http://localhost:3001}"
FAILED=0
PASSED=0

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}SD Plandi API Test Suite${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo "Testing API at: $API_URL"
echo ""

# Helper function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_code=$3
    local description=$4
    local data=$5
    
    echo -n "Testing: $description... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq "$expected_code" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $expected_code, got $http_code)"
        echo "Response: $body"
        ((FAILED++))
        return 1
    fi
}

# Test 1: Health Check
echo -e "\n${YELLOW}1. Health Check${NC}"
test_endpoint "GET" "/health" 200 "GET /health"

# Test 2: Students Endpoint
echo -e "\n${YELLOW}2. Students Endpoint${NC}"
test_endpoint "GET" "/students" 200 "GET /students (list all)"

# Check student count
echo -n "Checking student count... "
student_count=$(curl -s "$API_URL/students" | jq '. | length' 2>/dev/null || echo "0")
if [ "$student_count" -eq 161 ]; then
    echo -e "${GREEN}✓ PASSED${NC} ($student_count students)"
    ((PASSED++))
elif [ "$student_count" -eq 0 ]; then
    echo -e "${YELLOW}⚠ WARNING${NC} (0 students - database needs seeding)"
else
    echo -e "${YELLOW}⚠ WARNING${NC} ($student_count students - expected 161)"
fi

# Test 3: Authentication
echo -e "\n${YELLOW}3. Authentication${NC}"

# Login with admin credentials
echo -n "Testing login... "
login_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "action": "login",
        "email": "admin@sdnplandi1jombang.sch.id",
        "password": "admin123"
    }' \
    "$API_URL/auth")

login_code=$(echo "$login_response" | tail -n 1)
login_body=$(echo "$login_response" | sed '$d')

if [ "$login_code" -eq 200 ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
    
    # Extract token
    TOKEN=$(echo "$login_body" | jq -r '.token' 2>/dev/null)
    
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo -e "  Token received: ${TOKEN:0:20}..."
        
        # Test token verification
        echo -n "Testing token verification... "
        verify_response=$(curl -s -w "\n%{http_code}" \
            -H "Authorization: Bearer $TOKEN" \
            "$API_URL/auth")
        
        verify_code=$(echo "$verify_response" | tail -n 1)
        
        if [ "$verify_code" -eq 200 ]; then
            echo -e "${GREEN}✓ PASSED${NC}"
            ((PASSED++))
        else
            echo -e "${RED}✗ FAILED${NC}"
            ((FAILED++))
        fi
    else
        echo -e "${YELLOW}⚠ WARNING${NC} (No token in response)"
    fi
else
    echo -e "${RED}✗ FAILED${NC} (HTTP $login_code)"
    echo "Response: $login_body"
    ((FAILED++))
    TOKEN=""
fi

# Test 4: Admin Endpoint (requires auth)
echo -e "\n${YELLOW}4. Admin Endpoint${NC}"
if [ -n "$TOKEN" ]; then
    echo -n "Testing admin dashboard... "
    admin_response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        "$API_URL/admin?resource=dashboard")
    
    admin_code=$(echo "$admin_response" | tail -n 1)
    
    if [ "$admin_code" -eq 200 ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $admin_code)"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⊘ SKIPPED${NC} (No auth token)"
fi

# Test 5: Attendance Endpoint
echo -e "\n${YELLOW}5. Attendance Endpoint${NC}"
test_endpoint "GET" "/attendance" 200 "GET /attendance"

# Test 6: Leave Requests Endpoint
echo -e "\n${YELLOW}6. Leave Requests Endpoint${NC}"
test_endpoint "GET" "/leave-requests" 200 "GET /leave-requests"

# Test 7: Intrakurikuler Endpoint
echo -e "\n${YELLOW}7. Intrakurikuler Endpoint${NC}"
test_endpoint "GET" "/intrakurikuler" 200 "GET /intrakurikuler (subjects)"

# Test 8: Ekstrakurikuler Endpoint
echo -e "\n${YELLOW}8. Ekstrakurikuler Endpoint${NC}"
test_endpoint "GET" "/ekstrakurikuler" 200 "GET /ekstrakurikuler (activities)"

# Test 9: Database Init (POST)
echo -e "\n${YELLOW}9. Database Management${NC}"
echo -e "${BLUE}  Note: Skipping db-init to avoid resetting data${NC}"
echo -e "${BLUE}  To manually test: curl -X POST $API_URL/db-init${NC}"

# Test 10: 404 Handler
echo -e "\n${YELLOW}10. Error Handling${NC}"
test_endpoint "GET" "/nonexistent" 404 "GET /nonexistent (should return 404)"

# Summary
echo -e "\n${BLUE}================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
