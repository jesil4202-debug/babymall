# ✅ Render OTP Email - Quick Fix Checklist

## Pre-Deployment Checklist

### 1. Gmail Setup
- [ ] 2-factor authentication enabled: https://myaccount.google.com/security
- [ ] App password generated: https://myaccount.google.com/apppasswords
- [ ] App password is 16 characters (NOT your Gmail password)
- [ ] Gmail account uses your correct email

### 2. Code Changes Deployed
- [ ] `backend/server.js` - Updated with dotenv condition + diagnostics
- [ ] `backend/utils/email.js` - Lazy transporter with error logging
- [ ] `backend/controllers/otpController.js` - Enhanced OTP logging
- [ ] `backend/routes/otp.js` - Debug endpoint added
- [ ] All files committed and pushed to git

### 3. Render Environment Variables Set

Go to **Render Dashboard** → **Your Backend Service** → **Settings** → **Environment**

Add these exact variables:

```
EMAIL_HOST         smtp.gmail.com
EMAIL_PORT         587
EMAIL_USER         your-email@gmail.com
EMAIL_PASS         16-char-app-password-here
EMAIL_FROM         your-email@gmail.com
FRONTEND_URL       https://your-frontend.vercel.app
NODE_ENV           production
```

- [ ] All EMAIL_* variables added
- [ ] EMAIL_PASS is 16-character app password (NOT Gmail password)
- [ ] No extra spaces or quotes around values
- [ ] FRONTEND_URL uses your actual Vercel domain

### 4. Deploy & Verify

- [ ] Service restarted/redeployed on Render
- [ ] Render shows no errors during deployment
- [ ] Health check passes: `GET /api/health` returns 200

### 5. Check Startup Logs

Render Dashboard → **Your Backend Service** → **Logs**

Look for this output (scroll to top after restart):

```
✅ Nodemailer transporter initialized successfully
```

Check that ALL these show "✅ SET":
```
EMAIL_HOST: smtp.gmail.com
EMAIL_PORT: 587
EMAIL_USER: ✅ SET (hidden)
EMAIL_PASS: ✅ SET (hidden)
EMAIL_FROM: your-email@gmail.com
```

### 6. Test Email Configuration

**Option A: Local Test (Before Deployment)**
```bash
# In backend folder
npm start

# In another terminal
curl http://localhost:5000/api/auth/otp/debug/test-email
```

Expected: `"success": true`

**Option B: Render Test (After Deployment)**
```bash
curl https://your-backend.onrender.com/api/auth/otp/debug/test-email
```

Expected: `"success": true`

### 7. Test OTP Request

```bash
curl -X POST https://your-backend.onrender.com/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com"}'
```

Expected response:
```json
{
  "success": true,
  "message": "OTP sent to your-test-email@gmail.com. Valid for 5 minutes.",
  "isNewUser": true
}
```

Check your email inbox (and spam folder) for OTP.

In **Render Logs**, you should see:
```
🔓 OTP Request: Sending OTP to your-test-email@gmail.com
📧 Sending email to: your-test-email@gmail.com, Subject: Your Baby Mall Login Code
✅ Email sent successfully. MessageID: <...>
```

### 8. Test Frontend Flow

- [ ] Frontend login page loads
- [ ] Enter test email
- [ ] OTP sent notification appears
- [ ] Check email for 6-digit OTP code
- [ ] Enter OTP on frontend
- [ ] Login succeeds

---

## Common Issues & Quick Fixes

| Issue | Solution |
|-------|----------|
| `❌ Missing environment variables` | Add EMAIL_* to Render dashboard, then restart |
| `❌ Invalid login / Authentication failed` | Use 16-char APP PASSWORD, not Gmail password |
| `❌ getaddrinfo ENOTFOUND` | Verify EMAIL_HOST=smtp.gmail.com (exact spelling) |
| `❌ connect ETIMEDOUT` | Render free tier may need upgrade for SMTP |
| `✅ Request succeeds, no email` | Check Gmail spam folder, verify FROM address |
| `❌ Too many login attempts` | Gmail blocked repeated failures, wait 30 min |

---

## Debug Commands

**Check all env vars are loaded:**
```bash
# Check Render logs for:
# 🔧 Environment Diagnostics:
#   EMAIL_HOST: smtp.gmail.com
#   EMAIL_PORT: 587
#   EMAIL_USER: ✅ SET
#   EMAIL_PASS: ✅ SET
```

**Verify email works:**
```bash
# Render: GET /api/auth/otp/debug/test-email
# Local:  npm start, then check logs
```

**Monitor OTP sending:**
```bash
# Watch Render logs in real-time
# Look for: "✅ Email sent successfully"
```

---

## Once Everything Works

1. ✅ Remove or disable debug endpoint (optional, it's already restricted to dev-only)
2. ✅ Monitor email delivery in first few days
3. ✅ If issues persist, check Gmail security settings
4. ✅ Consider backup email service (SendGrid) if Gmail blocks future campaigns

---

## Support Info

If emails still don't work after this checklist:

1. **Screenshot Render logs** (show startup diagnostics section)
2. **Verify Gmail app password** is 16 chars
3. **Check if email arrives** in Gmail inbox or spam
4. **Confirm** all environment variables are set in Render dashboard
5. **Try local test** first (`npm start` + curl)

The comprehensive debug logs will show exactly where the failure occurs.
