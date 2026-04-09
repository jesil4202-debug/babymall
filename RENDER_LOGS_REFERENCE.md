# 📊 Render Logs Reference - What to Expect

## Startup Logs (Check These First)

After deploying to Render, check the logs for these outputs at startup:

### ✅ CORRECT - All Environment Variables Set

```
=== Build Output ===
...
Packages compiled successfully.
Starting service...

=== Runtime Output ===

🔧 Environment Diagnostics:
  NODE_ENV: production
  FRONTEND_URL: https://babymall.vercel.app
  MONGODB_URI: ✅ SET (hidden)
  EMAIL_HOST: smtp.gmail.com
  EMAIL_PORT: 587
  EMAIL_USER: ✅ SET (hidden)
  EMAIL_PASS: ✅ SET (hidden)
  EMAIL_FROM: support@babymall.in

📧 Initializing Nodemailer transporter...
   Host: smtp.gmail.com
   Port: 587
   User: support@babymall.in
   From: support@babymall.in
✅ Nodemailer transporter initialized successfully

🚀 Baby Mall API running on port 5000 in production mode
```

**Status**: ✅ Everything is configured correctly. OTP emails should work.

---

### ❌ ERROR - Missing Environment Variables

```
🔧 Environment Diagnostics:
  NODE_ENV: production
  FRONTEND_URL: https://babymall.vercel.app
  MONGODB_URI: ✅ SET (hidden)
  EMAIL_HOST: ❌ NOT SET
  EMAIL_PORT: ❌ NOT SET
  EMAIL_USER: ❌ NOT SET
  EMAIL_PASS: ❌ NOT SET
  EMAIL_FROM: ❌ NOT SET

❌ CRITICAL: Email environment variables are missing!
   On Render: Dashboard → Environment
   Required: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM
```

**Status**: ❌ Fix required. Go to Render Dashboard → Settings → Environment and add the variables.

---

### ⚠️ WARNING - Using Development Mode on Render (Don't do this in production!)

```
⚠️  Warning: .env file not found (OK in production): ENOENT: no such file or directory...
```

**Status**: ⚠️ OK for staging/development. For production, make sure NODE_ENV=production is set.

---

## OTP Request Logs - Success

When requesting an OTP and it succeeds:

```
🔓 OTP Request: Sending OTP to john@example.com
📧 Sending email to: john@example.com, Subject: Your Baby Mall Login Code
✅ Email sent successfully. MessageID: <CADc-_xf1234567890@mail.gmail.com>
```

**Status**: ✅ Email was sent. Check the inbox (and spam folder).

---

## OTP Request Logs - Failure Cases

### ❌ Missing Environment Variables (at email send time)

```
🔓 OTP Request: Sending OTP to john@example.com
❌ EMAIL CONFIG ERROR: Missing environment variables: EMAIL_USER, EMAIL_PASS
   On Render dashboard: Go to Environment and add:
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-char-app-password
   EMAIL_FROM=your-email@gmail.com
```

**Fix**: Add missing variables to Render dashboard and restart service.

---

### ❌ Gmail Authentication Failed

```
🔓 OTP Request: Sending OTP to john@example.com
📧 Sending email to: john@example.com, Subject: Your Baby Mall Login Code
❌ Email send failed!
   Error: Invalid login: 535 5.7.8 Username and password not accepted...

⚠️  GMAIL AUTHENTICATION ERROR - Check:
   1. Is user email correct? (must be Gmail with 2FA enabled)
   2. Is app password correct? (16 chars, NOT your Gmail password)
   3. Has Gmail blocked unusual sign-in activity from Render IP?
   → Go to: https://myaccount.google.com/security
   → Check "Allow less secure apps" or use app password
```

**Fix**: 
1. Verify EMAIL_USER is correct Gmail account
2. Generate new app password: https://myaccount.google.com/apppasswords
3. Update EMAIL_PASS to the 16-character code
4. Check Gmail hasn't blocked the IP

---

### ❌ Network/DNS Error

```
🔓 OTP Request: Sending OTP to john@example.com
📧 Sending email to: john@example.com, Subject: Your Baby Mall Login Code
❌ Email send failed!
   Error: getaddrinfo ENOTFOUND smtp.gmail.com

⚠️  NETWORK/DNS ERROR:
   1. Verify EMAIL_HOST is correct (smtp.gmail.com)
   2. Check if Render has internet access
   3. Render may need to be on a paid plan for outbound SMTP
```

**Fix**:
1. Verify EMAIL_HOST=smtp.gmail.com (exact spelling)
2. Check EMAIL_PORT=587 (not a string, must be number)
3. If on Render free tier, consider upgrading to paid plan
4. Or use an external email service (SendGrid, Mailgun)

---

### ❌ Connection Timeout

```
🔓 OTP Request: Sending OTP to john@example.com
📧 Sending email to: john@example.com, Subject: Your Baby Mall Login Code
❌ Email send failed!
   Error: connect ETIMEDOUT 142.251.41.108:587
```

**Fix**: 
- Render free tier might have slow network
- Consider upgrading to paid plan for better performance
- Or increase timeout value in email.js config

---

## Monitor in Real-Time

Click "Live Logs" in Render dashboard to watch:

```
# Good indicators to watch for:
✅ Nodemailer transporter initialized successfully     (startup)
✅ Email sent successfully                              (OTP sent)
✅ OTP Request: Sending OTP to ...                      (request received)

# Bad indicators to watch for:
❌ Missing environment variables
❌ Authentication failed
❌ ETIMEDOUT / ENOTFOUND
❌ Unhandled promise rejection
```

---

## Debugging Steps in Order

### Step 1: Check Startup Diagnostics
Look at the top of logs when service starts:
```
🔧 Environment Diagnostics:
  EMAIL_HOST: smtp.gmail.com
  EMAIL_USER: ✅ SET
  EMAIL_PASS: ✅ SET
```

If any show `❌ NOT SET`, add them to Render dashboard and restart.

### Step 2: Test Email Configuration (Development/Staging)

```bash
curl https://your-backend.onrender.com/api/auth/otp/debug/test-email
```

Check logs for:
```
✅ Nodemailer transporter initialized successfully
```

### Step 3: Request Test OTP

```bash
curl -X POST https://your-backend.onrender.com/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com"}'
```

Watch logs for:
```
🔓 OTP Request: Sending OTP to your-test-email@gmail.com
📧 Sending email to: ...
✅ Email sent successfully. MessageID: <...>
```

### Step 4: Check Email Inbox

- Look in **Inbox** first
- Check **Spam/Promotions** folder
- If absent after 5 minutes:
  - Go back to logs and check error messages
  - Verify EMAIL_PASS is correct app password (not Gmail password)
  - Check Gmail hasn't blocked unusual activity

---

## Log Levels Explained

```
🔧 Diagnostics    → Startup environment variable status
🚀 Routes         → API endpoints initialized
📧 Email          → Email sending process
✅ Success        → Operation completed successfully
❌ Error          → Something went wrong
⚠️  Warning       → Something might be wrong
🔓 OTP Request    → OTP endpoint was called
```

---

## Common Log Patterns

### Pattern 1: Everything Works
```
[Startup]
✅ Nodemailer transporter initialized successfully

[OTP Request]
🔓 OTP Request: Sending OTP to user@gmail.com
✅ Email sent successfully. MessageID: <...>
```
**Result**: ✅ User receives email

---

### Pattern 2: Config Issue (missing vars)
```
[Startup]
❌ CRITICAL: Email environment variables are missing!

[OTP Request]
❌ EMAIL CONFIG ERROR: Missing environment variables: EMAIL_USER
```
**Result**: ❌ Fix env vars, restart

---

### Pattern 3: Authentication Issue
```
[Startup]
✅ Nodemailer transporter initialized successfully

[OTP Request]
❌ Email send failed!
   Error: Invalid login: 535 5.7.8 Username and password not accepted
⚠️  GMAIL AUTHENTICATION ERROR
```
**Result**: ❌ Fix app password, check Gmail security

---

### Pattern 4: Network Issue
```
[Startup]
✅ Nodemailer transporter initialized successfully

[OTP Request]
❌ Email send failed!
   Error: getaddrinfo ENOTFOUND smtp.gmail.com
⚠️  NETWORK/DNS ERROR
```
**Result**: ❌ Check Render plan, DNS resolution

---

## Quick Reference: What Each Line Means

| Log Line | Meaning | Status |
|----------|---------|--------|
| `🔧 Environment Diagnostics:` | Startup is checking env vars | 📊 Check |
| `✅ SET (hidden)` | Variable is configured | ✅ Good |
| `❌ NOT SET` | Variable is missing | ❌ Fix it |
| `📧 Initializing Nodemailer` | Email system starting | ⏳ Wait |
| `✅ Nodemailer transporter initialized successfully` | Email system ready | ✅ Good |
| `🔓 OTP Request:` | Someone requested OTP | 📊 Check |
| `📧 Sending email to:` | Email is being sent | ⏳ Wait |
| `✅ Email sent successfully` | Email sent | ✅ Good |
| `❌ Email send failed` | Email error | ❌ Debug |
| `GMAIL AUTHENTICATION ERROR` | App password wrong | ❌ Fix password |
| `NETWORK/DNS ERROR` | Connection issue | ❌ Check Render |

---

## Render Logs Location

1. Go to https://render.com
2. Select your Backend service
3. Click **Logs** tab
4. Select date/time range to view
5. Use **Live Logs** checkbox for real-time monitoring

---

## Export Logs for Support

If you need help debugging:
1. Copy the entire startup logs section
2. Copy any error messages
3. Include when you tested (timestamp)
4. Include test email used
5. Mention if email arrived or not

This helps identify the exact issue quickly.
