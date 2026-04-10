#!/bin/bash

# Invoice Download Debug & Verification Script
# This script helps verify the invoice download authorization flow is working correctly

echo "============================================"
echo "🔍 Invoice Download Debug Verification"
echo "============================================"
echo ""

# Get API URL from environment or use default
API_URL="${BACKEND_URL:-http://localhost:5000}"
echo "📍 Backend URL: $API_URL"
echo ""

# Note: This script assumes you have a valid JWT token
# Get token from environment or prompt for it
if [ -z "$JWT_TOKEN" ]; then
    echo "⚠️  JWT_TOKEN environment variable not set"
    echo "Please set: export JWT_TOKEN=<your_jwt_token>"
    echo ""
    echo "Or run this test after logging in and copying token from browser DevTools"
    exit 1
fi

echo "🔐 Using JWT Token: ${JWT_TOKEN:0:20}..."
echo ""

# Test 1: Check if token is valid
echo "TEST 1: Verify JWT Token Format"
echo "================================"
IFS='.' read -ra PARTS <<< "$JWT_TOKEN"
if [ ${#PARTS[@]} -eq 3 ]; then
    echo "✅ Token format is valid (3 parts: header.payload.signature)"
else
    echo "❌ Token format is invalid (expected 3 parts, got ${#PARTS[@]})"
    exit 1
fi
echo ""

# Test 2: Check Authorization Header Format
echo "TEST 2: Verify Authorization Header"
echo "===================================="
AUTH_HEADER="Bearer $JWT_TOKEN"
echo "✅ Authorization Header: ${AUTH_HEADER:0:30}..."
echo ""

# Test 3: Request invoice with cURL
echo "TEST 3: Fetch Invoice PDF (Replace ORDER_ID with real order ID)"
echo "=============================================================="
ORDER_ID="64a1b2c3d4e5f6g7h8i9j0k1l"  # Replace with real order ID

echo "Command:"
echo "curl -X GET '$API_URL/api/invoice/$ORDER_ID' \\"
echo "  -H 'Authorization: Bearer $JWT_TOKEN' \\"
echo "  -o invoice.pdf"
echo ""
echo "Run the above command to download the invoice"
echo ""

# Test 4: Check what the server responds with
echo "TEST 4: Check Server Response Headers"
echo "===================================="
echo "Command:"
echo "curl -v -X GET '$API_URL/api/invoice/$ORDER_ID' \\"
echo "  -H 'Authorization: Bearer $JWT_TOKEN'"
echo ""
echo "This will show:"
echo "  - Authorization header being sent"
echo "  - Response status code"
echo "  - PDF content headers"
echo ""

echo "============================================"
echo "🎯 Manual Testing Steps"
echo "============================================"
echo ""
echo "1. Open browser DevTools (F12)"
echo "2. Go to Application → Local Storage"
echo "3. Look for 'bm_token' key"
echo "4. Copy the token value"
echo "5. Open Network tab"
echo "6. Click 'Download Invoice' button"
echo "7. Look for request to '/api/invoice/...' endpoint"
echo "8. Check:"
echo "   ✅ Status: 200"
echo "   ✅ Headers: Authorization: Bearer <token>"
echo "   ✅ Response: PDF binary data"
echo "   ✅ Content-Type: application/pdf"
echo "   ✅ Content-Disposition: attachment; filename=invoice-xxx.pdf"
echo ""

echo "============================================"
echo "📋 Checklist"
echo "============================================"
echo ""
echo "Frontend:"
echo "  [ ] Token exists in localStorage as 'bm_token'"
echo "  [ ] Token is not null or undefined"
echo "  [ ] Token starts with 'eyJ' (base64 encoded)"
echo "  [ ] Token is sent with 'Bearer ' prefix"
echo ""
echo "Request:"
echo "  [ ] Authorization header is present"
echo "  [ ] Formula is: 'Bearer <token>'"
echo "  [ ] No extra spaces or formatting issues"
echo ""
echo "Backend:"
echo "  [ ] Middleware extracts token correctly"
echo "  [ ] JWT verification succeeds"
echo "  [ ] User is found in database"
echo "  [ ] Order owner matches request user"
echo ""
echo "Response:"
echo "  [ ] Status code is 200"
echo "  [ ] Content-Type is 'application/pdf'"
echo "  [ ] Content-Disposition has filename"
echo "  [ ] PDF content is returned"
echo ""

echo "============================================"
echo "❌ Troubleshooting"
echo "============================================"
echo ""
echo "Error: 'Not authorized. Please log in.'"
echo "  → Check if token exists in localStorage"
echo "  → Check if token is being sent in Authorization header"
echo "  → Check if token is expired (validity: 7 days)"
echo ""
echo "Error: 'Invalid or expired token'"
echo "  → Token might be corrupted or malformed"
echo "  → Try logging in again"
echo "  → Check browser console for token value"
echo ""
echo "Error: 'You do not have permission to download this invoice'"
echo "  → User ID doesn't match order owner"
echo "  → Try downloading own orders only"
echo "  → Check if order exists in database"
echo ""
echo "Error: 'Order not found'"
echo "  → Order ID might be wrong"
echo "  → Order might have been deleted"
echo "  → Check database for order existence"
echo ""

echo "============================================"
echo "🛠️  Debugging Commands"
echo "============================================"
echo ""
echo "Check token in localStorage:"
echo "  window.localStorage.getItem('bm_token')"
echo ""
echo "Check API response in browser console:"
echo "  const token = localStorage.getItem('bm_token');"
echo "  fetch('/api/invoice/64a1b2c3d4e5f6g7h8i9j0k1l', {"
echo "    headers: { 'Authorization': 'Bearer ' + token }"
echo "  }).then(r => console.log(r.status, r.headers))"
echo ""
