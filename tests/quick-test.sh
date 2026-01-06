#!/bin/bash

# Quick API test
API_URL="http://localhost:3001"

echo "Quick API Test"
echo "=============="
echo ""

# Test 1: Health
echo "1. Health Check:"
curl -s "$API_URL/health" | jq '.status' || echo "FAILED"
echo ""

# Test 2: Student Count
echo "2. Student Count:"
curl -s "$API_URL/students" | jq '. | length' || echo "FAILED"
echo ""

# Test 3: Login
echo "3. Admin Login:"
curl -s -X POST "$API_URL/auth" \
  -H "Content-Type: application/json" \
  -d '{"action":"login","email":"admin@sdnplandi1jombang.sch.id","password":"admin123"}' \
  | jq '.user.name' || echo "FAILED"
echo ""

# Test 4: Intrakurikuler
echo "4. Intrakurikuler Subjects:"
curl -s "$API_URL/intrakurikuler" | jq '. | length' || echo "FAILED"
echo ""

# Test 5: Ekstrakurikuler
echo "5. Ekstrakurikuler Activities:"
curl -s "$API_URL/ekstrakurikuler" | jq '. | length' || echo "FAILED"
echo ""

echo "✓ Quick test complete!"
