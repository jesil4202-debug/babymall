# Environment Setup Guide - Baby Mall OTP Fix

## 🔧 Issue Fixed
Frontend was unable to reach OTP endpoints due to incorrect `NEXT_PUBLIC_API_URL` configuration.

---

## 📍 Backend Configuration  
**Server URL (Render):** `https://your-backend.onrender.com`  
**API Routes:** All routes prefixed with `/api`  
**OTP Endpoints:**
- `POST /api/auth/otp/request` - Send OTP to email
- `POST /api/auth/otp/verify` - Verify OTP and authenticate user

---

## 🌐 Frontend Configuration (Vercel)

### Environment Variable: `NEXT_PUBLIC_API_URL`

#### ✅ CORRECT Format (Choose ONE):

**Option 1: Full URL with `/api`**
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

**Option 2: Backend URL without `/api` (Auto-added)**
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

#### ❌ INCORRECT Format (Will fail):
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/  (trailing slash)
```

---

## 🚀 Setup Instructions

### On Vercel (Frontend)

1. Go to **Project Settings** → **Environment Variables**
2. Add variable:
   ```
   NEXT_PUBLIC_API_URL = https://your-backend.onrender.com
   ```
   (Note: NO `/api` suffix needed - frontend helper adds it automatically)

3. **Redeploy** the project for changes to take effect

### On Render (Backend)

1. Dashboard → Backend Service → **Environment**
2. Verify these variables are set:
   ```
   FRONTEND_URL = https://your-vercel-domain.vercel.app
   NODE_ENV = production
   MONGODB_URI = your-mongodb-connection-string
   EMAIL_HOST = smtp.gmail.com
   EMAIL_PORT = 587
   EMAIL_USER = your-email@gmail.com
   EMAIL_PASS = your-app-password
   EMAIL_FROM = noreply@babymall.com
   ```

---

## ✅ API Call Flow

### Example: Request OTP

**Frontend (authStore.ts):**
```typescript
const { data } = await api.post('/auth/otp/request', { email });
```

**API Helper (lib/api.ts) resolves to:**
```
{NEXT_PUBLIC_API_URL}/auth/otp/request
```

**Final URL sent:**
```
https://your-backend.onrender.com/api/auth/otp/request
```

**Backend handles at:**
```javascript
app.use('/api/auth/otp', otpRoutes);  // ← Routes /request & /verify here
```

---

## 🔍 Troubleshooting

### Error: "Route /auth/otp/request not found"

**Check:** 
1. ✅ `NEXT_PUBLIC_API_URL` is set correctly (without trailing slash)
2. ✅ Vercel project is redeployed after env change
3. ✅ Backend is running and accessible

**Test URL:**
```bash
curl https://your-backend.onrender.com/api/health
```
Should return: `{ "success": true, "message": "Baby Mall API is running" }`

---

## 📋 Verified API Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/otp/request` | POST | Send OTP to email |
| `/api/auth/otp/verify` | POST | Verify OTP & login |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/logout` | POST | Logout user |
| `/api/auth/profile` | PUT | Update profile |
| `/api/auth/addresses` | POST | Add address |
| `/api/auth/wishlist/{id}` | POST | Toggle wishlist |

---

## 🔐 Security Notes

- `NEXT_PUBLIC_` prefix means this value is visible in browser (safe - it's just the API URL)
- Sensitive data (tokens, passwords) are never exposed in frontend config
- Tokens stored in `localStorage` with `bm_token` key
- All API calls include CORS credentials and token headers

---

## 📝 Last Updated
After OTP route fix - Frontend API helper now auto-appends `/api` path
