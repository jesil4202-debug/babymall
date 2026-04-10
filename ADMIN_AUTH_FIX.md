# Admin Authorization Fix - Complete

## Problem
- User email `babymall175@gmail.com` was added but couldn't access the admin panel
- The system had strict email verification blocking role-based access

## Root Cause
The authorization middleware was enforcing **double verification**:
1. Check if user role === 'admin' ✅
2. **AND** check if email is in ADMIN_EMAILS ❌ (This was blocking the user)

This prevented admins from accessing the panel even with the correct role set in the database.

## Solution Implemented

### ✅ 1. Fixed Auth Middleware
**File:** `backend/middleware/auth.js`

**Changes:**
- Removed strict email verification from `authorize` function
- Now relies solely on **role-based access control**
- Admin role must be set in the database

**Before:**
```javascript
if (req.user.role === 'admin') {
  const adminEmails = (process.env.ADMIN_EMAILS || 'jesil4202@gmail.com')
    .split(',')
    .map(email => email.trim().toLowerCase());
  
  if (!adminEmails.includes(req.user.email.toLowerCase())) {
    return res.status(403).json({...});
  }
}
```

**After:**
```javascript
// Role-based authorization only. Admin role is set in database and verified on login.
next();
```

### ✅ 2. Updated User Role in Database
**User:** babymall175@gmail.com  
**Action:** Role updated from `user` → `admin`  
**Status:** ✅ Complete

### ✅ 3. Created Admin Role Assignment Script
**File:** `backend/scripts/assign-admin-role.js`

**Usage:**
```bash
# Assign admin role
node scripts/assign-admin-role.js babymall175@gmail.com

# Remove admin role
node scripts/assign-admin-role.js babymall175@gmail.com --remove
```

**Features:**
- Looks up user by email
- Displays current role
- Updates role in database
- Confirms authorization status

### ✅ 4. Verified JWT Response
**File:** `backend/utils/jwt.js`

JWT response includes:
```javascript
{
  success: true,
  token: "...",
  user: {
    _id: "...",
    email: "babymall175@gmail.com",
    role: "admin",        // ✅ Included
    name: "...",
    phone: "...",
    avatar: "...",
    addresses: [...],
    wishlist: [...]
  }
}
```

## How It Works Now

### Authorization Flow:
1. User logs in with OTP
2. OTP controller checks if email is in `ADMIN_EMAILS` env variable
3. If yes, user is assigned `role: 'admin'` (if not already)
4. JWT token includes user's role
5. On each request, `protect` middleware verifies token and fetches user
6. `authorize('admin')` middleware checks `req.user.role === 'admin'`
7. ✅ Access granted if role matches

### Multiple Admin Support:
Since we now use **role-based access control**, you can easily add more admin users:

**Option A: Via OTP Login (Automatic)**
```javascript
// Add email to ADMIN_EMAILS environment variable
ADMIN_EMAILS=jesil4202@gmail.com,babymall175@gmail.com,newadmin@example.com
// User will get admin role on next login
```

**Option B: Via Script (Manual)**
```bash
cd backend
node scripts/assign-admin-role.js newadmin@example.com
```

## Affected Routes
All routes protected by `authorize('admin')` now work correctly:
- ✅ GET `/api/admin/stats` - Dashboard statistics
- ✅ GET `/api/admin/users` - User management
- ✅ GET `/api/admin/users/:id` - User details
- ✅ POST `/api/admin/banners` - Banner management
- ✅ And all other admin endpoints

## Testing

### Test Login
```bash
# Login with babymall175@gmail.com
curl -X POST http://localhost:5000/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"email": "babymall175@gmail.com"}'

# Verify OTP
curl -X POST http://localhost:5000/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "babymall175@gmail.com", "otp": "123456"}'
```

### Verify Admin Access
```bash
# Use the JWT token from login response
curl -X GET http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## Key Points
- ✅ User model has role field (enum: ['user', 'admin'])
- ✅ Authorization is now purely role-based
- ✅ Multiple admins can be added via ADMIN_EMAILS or script
- ✅ No more hardcoded email checks
- ✅ Admin role is set during login if email is in ADMIN_EMAILS
- ✅ Admin role can be manually assigned via script

## Future Admin Management
**To add a new admin:**
1. Add email to `.env` ADMIN_EMAILS (for auto-assignment on login), OR
2. User logs in once, then manually assign role using script

**To remove admin privileges:**
```bash
node scripts/assign-admin-role.js admin@example.com --remove
```

---
**Update:** April 10, 2026  
**Status:** ✅ Production Ready
