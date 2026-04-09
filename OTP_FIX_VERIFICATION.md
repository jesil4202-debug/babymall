# OTP Route Fix - Verification & Diagnostics

## ✅ FIXED: Frontend API Helper

**File:** `frontend/lib/api.ts`

### What Was Fixed:
```typescript
// BEFORE (Wrong):
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';

// AFTER (Correct):
const getApiUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
  // Auto-appends /api if not present
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};
const API_URL = getApiUrl();
```

### Why This Fix Works:
- **Environment Variable Flexibility:** Frontend now accepts API URLs with OR without `/api` suffix
- **No Breaking Changes:** Still defaults to `http://127.0.0.1:5000/api` in development
- **Production Safe:** Works correctly when Vercel env var is set to just the backend URL

---

## 🔍 Verification Checklist

### 1. Backend Routes (✅ Verified Correct)

**File:** `backend/routes/otp.js`
```javascript
router.post('/request', otpRequestLimiter, requestValidation, requestOtp);
router.post('/verify', verifyValidation, verifyOtp);
```

**Mounted in:** `backend/server.js`
```javascript
app.use('/api/auth/otp', otpRoutes);
```

**Result:** Endpoints available at:
- ✅ `/api/auth/otp/request`
- ✅ `/api/auth/otp/verify`

---

### 2. Frontend API Calls (✅ All Centralized)

All frontend API calls use the centralized helper from `@/lib/api`:

| File | Endpoint | Purpose |
|------|----------|---------|
| authStore.ts | `/auth/otp/request` | Request OTP |
| authStore.ts | `/auth/otp/verify` | Verify OTP |
| authStore.ts | `/auth/logout` | Logout |
| authStore.ts | `/auth/me` | Fetch user |
| authStore.ts | `/auth/profile` | Update profile |
| authStore.ts | `/auth/wishlist/{id}` | Toggle wishlist |
| authStore.ts | `/auth/addresses` | Address operations |
| cartStore.ts | `/cart` | Cart operations |
| others | `/admin/*`, `/orders/*` | Admin/Orders |

---

## 🚀 Testing the Fix

### Local Development (Port 5000)
```bash
# Terminal 1: Backend
cd backend
npm start                    # Runs on http://localhost:5000

# Terminal 2: Frontend
cd frontend
npm run dev                  # Runs on http://localhost:3000
```

**Expected Behavior:**
- Env var defaults to `http://127.0.0.1:5000/api`
- OTP requests go to `http://localhost:5000/api/auth/otp/request` ✅

---

### Production Test (Vercel + Render)

Set on **Vercel** → **Environment Variables:**
```
NEXT_PUBLIC_API_URL = https://your-backend.onrender.com
```

**What Happens:**
1. Frontend reads: `https://your-backend.onrender.com`
2. Helper appends `/api`: `https://your-backend.onrender.com/api`
3. API calls resolve to: `https://your-backend.onrender.com/api/auth/otp/request` ✅

---

## 🧪 Manual Testing

### Test OTP Endpoint via cURL

```bash
# Request OTP
curl -X POST https://your-backend.onrender.com/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Expected Response:
# {"success":true,"message":"OTP sent to email","isNewUser":true}


# Verify OTP
curl -X POST https://your-backend.onrender.com/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456","name":"Test User"}'

# Expected Response:
# {"success":true,"user":{...},"token":"jwt-token"}


# Check health
curl https://your-backend.onrender.com/api/health

# Expected Response:
# {"success":true,"message":"Baby Mall API is running 🍼","timestamp":"..."}
```

---

## 🐛 If Still Getting "Route Not Found"

### Diagnostic Steps:

1. **Verify Backend is Running:**
   ```bash
   curl https://your-backend.onrender.com/api/health
   ```
   - ❌ Command fails → Backend is down/unreachable
   - ✅ Returns success JSON → Backend OK

2. **Check Environment Variable:**
   - Go to Vercel → Project Settings → Environment Variables
   - Ensure `NEXT_PUBLIC_API_URL` is set (without `/api`)
   - **Redeploy** after setting

3. **Check Backend Routes:**
   ```bash
   cd backend
   npm start
   ```
   Look for output:
   ```
   ✅ API Routes:
   ├── /api/auth
   ├── /api/products
   ├── /api/orders
   ├── /api/cart
   ├── /api/banners
   ├── /api/admin
   └── /api/auth/otp  ← This should be present
   ```

4. **Browser Console Errors:**
   - Open DevTools (F12) → Network tab
   - Try to login/request OTP
   - Check actual request URL in Network tab
   - Should show: `https://backend-url.onrender.com/api/auth/otp/request`

---

## 📊 Before vs After

| Scenario | Before Fix | After Fix |
|----------|-----------|-----------|
| `NEXT_PUBLIC_API_URL=https://api.example.com` | ❌ Calls `/api/auth/otp/request` | ✅ Calls `/api/auth/otp/request` |
| `NEXT_PUBLIC_API_URL=https://api.example.com/api` | ✅ Calls `/api/auth/otp/request` | ✅ Calls `/api/auth/otp/request` |
| Local dev (no env var) | ✅ Works | ✅ Works (improved) |
| Vercel prod (common mistake) | ❌ FAILS | ✅ WORKS |

---

## 📝 Files Changed

- ✅ `frontend/lib/api.ts` - Fixed API URL resolution
- ✅ `ENV_SETUP_GUIDE.md` - Created setup documentation

---

## 🎯 Summary

**Root Cause:** Frontend's API URL helper didn't handle environment variable flexibility  
**Fix:** Auto-append `/api` path if not present  
**Result:** Works with any backend URL format (with or without `/api`)  
**Impact:** No code changes needed - just set Vercel env var correctly
