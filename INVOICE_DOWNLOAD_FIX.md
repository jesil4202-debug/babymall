# Invoice Download Authorization Fix

## Problem
Users could not download invoices with error "Not authorized" or "401 Unauthorized" when clicking the invoice download button.

## Root Cause
The invoice download was using `window.open()` which creates a new browser request without the JWT authentication token. Since the backend invoice endpoint requires authentication (`@route GET /api/invoice/:id` protected by `auth` middleware), the request was being rejected.

```javascript
// BEFORE: No JWT token sent
window.open(`${apiUrl}/api/invoice/${orderId}`, '_blank');
```

## Solution

### Frontend Changes

**File:** `frontend/lib/useInvoiceDownload.ts`

Replaced direct URL opening with authenticated fetch:

```javascript
// AFTER: JWT token included in Authorization header
const token = localStorage.getItem('bm_token');
const response = await fetch(invoiceUrl, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

// Convert to blob and download
const blob = await response.blob();
const blobUrl = window.URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = blobUrl;
link.download = `invoice-${orderNumber || orderId}.pdf`;
link.click();
```

**Changes:**
1. ✅ Retrieve JWT token from localStorage
2. ✅ Use fetch API with Authorization header
3. ✅ Check for 401 authorization errors
4. ✅ Convert response to blob
5. ✅ Create object URL and trigger download
6. ✅ Clean up blob URL after download
7. ✅ Add comprehensive error handling
8. ✅ Add debug console logs

**Updated Components:**
- ✅ `app/admin/orders/page.tsx` - Admin invoice download
- ✅ `app/(store)/account/orders/[id]/page.tsx` - Individual order invoice
- ✅ `app/(store)/account/orders/page.tsx` - Orders list invoice downloads

### Backend Changes

**File:** `backend/routes/invoice.js`

Added debug logging to track authorization:
```javascript
console.log(`📥 Invoice Download Request - Order: ${id}, User: ${userId}`);
console.log(`✅ Authorization passed - Invoice generating for ${order.user.email}`);
console.log(`❌ Authorization denied - Order owner: ${order.user._id}, Request user: ${userId}`);
```

**File:** `backend/middleware/auth.js`

Added JWT verification logging:
```javascript
console.log(`⚠️  No token provided for ${req.method} ${req.path}`);
console.log(`✅ JWT verified - User: ${req.user.email} (${req.user.role})`);
console.log(`❌ JWT verification failed`);
```

## Authentication Flow

```
User clicks "Download Invoice"
     ↓
Frontend: Get JWT token from localStorage
     ↓
Frontend: Fetch invoice file with Authorization header
     ↓
Backend: Check Authorization header for Bearer token
     ↓
Backend: Verify JWT token with secret key
     ↓
Backend: Look up user from token ID
     ↓
Backend: Check if user owns the order
     ↓
Backend: Generate PDF and send as blob
     ↓
Frontend: Convert blob to object URL
     ↓
Frontend: Create download link and click it
     ↓
Frontend: Clean up object URL
     ↓
User: PDF downloads to Downloads folder
```

## Security Features

1. **JWT Authentication** - All invoice requests require valid JWT token
2. **Authorization Check** - Backend verifies user owns the order
3. **Token Expiry Handling** - Redirects to login if token expires
4. **Error Messages** - Clear feedback on authorization failures
5. **Debug Logging** - Console logs track entire flow for debugging

## Debug Console Logs

### Frontend Logs
```
📥 Requesting invoice for order: 64a1b2c3d4e5f6g7h8i9j0k1l
Authorization expired - invalid or expired token [401]
❌ Authorization failed - invalid or expired token
❌ Invoice download error
✅ Invoice downloaded: invoice-ORD-001.pdf
```

### Backend Logs
```
⚠️  No token provided for GET /api/invoice/64a1b2c3d4e5f6g7h8i9j0k1l
✅ JWT verified - User: user@example.com (user)
📥 Invoice Download Request - Order: 64a1b2c3d4e5f6g7h8i9j0k1l, User: 64a1b2c3d4e5f6g7h8i9j0k1
✅ Authorization passed - Invoice generating for user@example.com
❌ Authorization denied - Order owner: 64a1b2c3d4e5f6g7h8i9j0k1, Request user: 64a1b2c3d4e5f6g7h8i9j0k2
```

## Testing

### Test Successful Download
1. Login as user with completed order
2. Navigate to "/account/orders" or "/admin/orders"
3. Click invoice download button
4. Check browser console - should show success logs
5. PDF should download automatically

### Test Authorization Error
1. Manual API call without token:
```bash
curl -X GET http://localhost:5000/api/invoice/64a1b2c3d4e5f6g7h8i9j0k1l
# Response: 401 Unauthorized
```

2. Manual API call with valid token:
```bash
curl -X GET http://localhost:5000/api/invoice/64a1b2c3d4e5f6g7h8i9j0k1l \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# Response: 200 OK - PDF blob
```

### Test Token Expiry
1. Wait for token to expire (default 7 days)
2. Try to download invoice
3. Frontend should detect 401 and redirect to login

## Files Modified

| File | Changes |
|------|---------|
| `frontend/lib/useInvoiceDownload.ts` | Rewrite to use fetch with Authorization header |
| `frontend/app/admin/orders/page.tsx` | Use new download function |
| `frontend/app/(store)/account/orders/[id]/page.tsx` | Use new download function |
| `frontend/app/(store)/account/orders/page.tsx` | Use new download function |
| `backend/routes/invoice.js` | Add authorization debugging logs |
| `backend/middleware/auth.js` | Add JWT verification logs |

## Commit Information

**Commit:** `ac8e9f5` - fix: secure invoice download with JWT authentication

**Date:** April 10, 2026

## Testing Checklist

- [x] User can download own order invoice
- [x] JWT token included in request
- [x] Backend authorization verified
- [x] PDF downloads successfully
- [x] Error handling for expired tokens
- [x] Error handling for unauthorized users
- [x] Console logs for debugging
- [x] Admin can download user invoices
- [x] Users cannot download others' invoices

---

**Status:** ✅ Production Ready
