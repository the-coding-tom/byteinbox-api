#!/bin/bash

echo "🧪 Testing Typed Repository Methods"
echo "===================================="

# Test 1: Create OAuth User
echo "📝 Test 1: Creating OAuth user..."
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-typed@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "Typed"
  }' | jq '.'

echo -e "\n"

# Test 2: Login with typed user
echo "🔐 Test 2: Login with typed user..."
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-typed@example.com",
    "password": "password123"
  }' | jq '.'

echo -e "\n"

# Test 3: Get OAuth URL (should use typed methods)
echo "🔗 Test 3: Getting OAuth URL..."
curl -X GET "http://localhost:3000/api/v1/auth/oauth/google/url" | jq '.'

echo -e "\n"

echo "✅ Typed repository tests completed!"
echo "Check the responses above to verify the methods are working correctly." 