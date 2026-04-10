# Invoice Download Authorization - Quick Reference Cheat Sheet

## 🚀 Quick Start Verification

### Is Invoice Download Working?

```javascript
// Browser Console (F12)
localStorage.getItem('bm_token')  // Should return JWT token
```

**Expected Output:**
```
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0YTFiMmMzZDRlNWY2ZzdiOGk5ajBrMWwiLCJpYXQiOjE3MzM2NjY2NjYsImV4cCI6MTczNDI3MTQ2Nn0.XxXxXxXx..."
```

---

## 🔍 Debugging Steps

### Step 1: Check Token Exists
```javascript
token = localStorage.getItem('bm_token');
console.log(token ? '✅ Token found' : '❌ Token NOT found');
```

### Step 2: Check Token Format
```javascript
parts = token.split('.');
console.log(parts.length === 3 ? '✅ JWT format valid' : '❌ JWT format invalid');
```

### Step 3: Check Bearer Header Format
```javascript
header = `Bearer ${token}`;
console.log(header.startsWith('Bearer ') ? '✅ Format correct' : '❌ Format wrong');
```

### Step 4: Monitor Network Request
1. Open DevTools (F12)
2. Go to Network tab
3. Click "Download Invoice"
4. Look for `/api/invoice/...` request
5. Check:
   - ✅ Status: 200
   - ✅ Headers → Authorization: `Bearer eyJ...`
   - ✅ Response → Binary PDF data

### Step 5: Check Backend Logs
1. Open Render dashboard
2. Go to Logs tab
3. Look for invoice download entries
4. Expected logs:
   ```
   ✅ JWT verified - User: user@example.com (role)
   📥 Invoice Download Request - Order: xxx, User: yyy
   ✅ Authorization passed - Invoice generating for user@example.com
   ```

---

## ❌ Troubleshooting

### Error: "Not authorized. Please log in."

**Cause:** Token not in localStorage or is null

**Fix:**
```javascript
// Check if token exists
localStorage.getItem('bm_token')

// If null, logout and login again
localStorage.clear();
window.location.href = '/auth/login';
```

---

### Error: "Invalid or expired token"

**Cause:** Token is malformed or expired (>7 days old)

**Fix:**
```javascript
// Remove old token
localStorage.removeItem('bm_token');

// Login again to get new token
window.location.href = '/auth/login';
```

---

### Error: "You do not have permission to download this invoice"

**Cause:** Trying to download another user's invoice

**Fix:**
- Only download invoices of orders you created
- Check order owner matches your account

---

### Error: "Order not found"

**Cause:** Order ID doesn't exist or was deleted

**Fix:**
- Verify order ID is correct
- Check order exists in database
- Try with a different order

---

### Error (Backend): "No token provided"

**Cause:** Token not sent in Authorization header

**Check:**
```bash
# Test with cURL
curl -X GET http://localhost:5000/api/invoice/64a1b2c3d4e5f6g7h8i9j0k1l \
  -H "Authorization: Bearer $JWT_TOKEN"

# Without header (should fail)
curl -X GET http://localhost:5000/api/invoice/64a1b2c3d4e5f6g7h8i9j0k1l
# Response: 401 Not authorized
```

---

## 📊 Request/Response Examples

### ✅ Successful Request

**Browser Console:**
```
📥 Requesting invoice for order: 64a1b2c3d4e5f6g7h8i9j0k1l
✅ Invoice downloaded: invoice-ORD-12345.pdf
```

**Network Request:**
```
GET /api/invoice/64a1b2c3d4e5f6g7h8i9j0k1l HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Network Response:**
```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="invoice-ORD-12345.pdf"
Content-Length: 45382

[PDF binary data...]
```

**Backend Console:**
```
✅ JWT verified - User: user@example.com (user)
📥 Invoice Download Request - Order: 64a1b2c3d4e5f6g7h8i9j0k1l, User: 64a1b2c3d4e5f6g7h8i9j0k1
✅ Authorization passed - Invoice generating for user@example.com
```

---

### ❌ Failed Request (Missing Token)

**Network Request:**
```
GET /api/invoice/64a1b2c3d4e5f6g7h8i9j0k1l HTTP/1.1
Host: api.example.com
(No Authorization header)
```

**Network Response:**
```
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "success": false,
  "message": "Not authorized. Please log in."
}
```

**Backend Console:**
```
⚠️  No token provided for GET /api/invoice/64a1b2c3d4e5f6g7h8i9j0k1l
```

---

### ❌ Failed Request (Invalid Token)

**Network Response:**
```
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "success": false,
  "message": "Invalid or expired token."
}
```

**Backend Console:**
```
❌ JWT verification failed
```

---

### ❌ Failed Request (No Permission)

**Network Response:**
```
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "success": false,
  "message": "You do not have permission to download this invoice"
}
```

**Backend Console:**
```
✅ JWT verified - User: user@example.com (user)
📥 Invoice Download Request - Order: 64a1b2c3d4e5f6g7h8i9j0k1l, User: 64a1b2c3d4e5f6g7h8i9j0k1
❌ Authorization denied - Order owner: 64a1b2c3d4e5f6g7h8i9j0k1, Request user: 64a1b2c3d4e5f6g7h8i9j0k2
```

---

## 🛠️ Key Files to Check

### Frontend
```
frontend/lib/useInvoiceDownload.ts     ← Download function
frontend/store/authStore.ts             ← Token storage
frontend/lib/api.ts                     ← API client config
```

### Backend
```
backend/middleware/auth.js              ← JWT verification
backend/routes/invoice.js               ← Invoice endpoint
backend/utils/invoiceGenerator.js       ← PDF generation
```

---

## 🔧 Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (.env)
```
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

---

## 📋 Code Snippets

### Frontend: Check Token
```javascript
const token = localStorage.getItem('bm_token');
if (!token) {
  console.log('❌ Token not found');
  window.location.href = '/auth/login';
  return;
}
console.log('✅ Token:', token.substring(0, 20) + '...');
```

### Frontend: Make Request
```javascript
const response = await fetch('/api/invoice/ORDER_ID', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

if (response.status === 401) {
  localStorage.removeItem('bm_token');
  window.location.href = '/auth/login';
}
```

### Backend: Verify Token
```javascript
const authHeader = req.headers.authorization;
if (!authHeader?.startsWith('Bearer ')) {
  return res.status(401).json({ message: 'No token' });
}

const token = authHeader.split(' ')[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET);
console.log('✅ Token verified for user:', decoded.id);
```

---

## 📞 Support Quick Links

| Issue | Solution |
|-------|----------|
| Token not found | Login again, check localStorage |
| Token not sent | Check fetch Authorization header format |
| 401 response | Token expired, login again |
| 403 response | You don't own this invoice, try own order |
| PDF not downloading | Check browser console, check network tab |

---

## ✅ Quick Test

```bash
# 1. Get token from browser
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. Get order ID
export ORDER_ID="64a1b2c3d4e5f6g7h8i9j0k1l"

# 3. Test request
curl -X GET "http://localhost:5000/api/invoice/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -v

# Expected: HTTP 200 with PDF data
```

---

**Last Updated:** April 10, 2026  
**Status:** ✅ Complete & Working
