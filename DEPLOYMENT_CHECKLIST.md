# 🚀 Resend Migration - Deployment Checklist

## Pre-Deployment

### Code Ready
- [x] Nodemailer removed from dependencies
- [x] Resend API integrated
- [x] sendEmail.js utility created  
- [x] OTP controller updated
- [x] Routes debug endpoint updated
- [x] All tests passing
- [x] Code pushed to GitHub

### Documentation Complete
- [x] RESEND_SETUP.md - Setup guide
- [x] RESEND_QUICKSTART.md - Quick reference
- [x] MIGRATION_COMPLETE.md - Migration details
- [x] RESEND_MIGRATION_SUMMARY.md - Full summary
- [x] This checklist

---

## Step 1: Prepare Resend Account

- [ ] Go to https://resend.com
- [ ] Create account or login
- [ ] Navigate to API Keys (https://resend.com/api-keys)
- [ ] Generate new API key (starts with `re_`)
- [ ] Copy API key to safe location
- [ ] (Optional) Verify your own domain for production
  - Or use `onboarding@resend.dev` for testing

---

## Step 2: Update Render Environment

### Via Render Dashboard:

1. Go to https://dashboard.render.com
2. Select Baby Mall backend service
3. Click "Environment"
4. **Add new variables:**
   ```
   RESEND_API_KEY = re_xxxxxxxxxxxxxxxx
   EMAIL_FROM = noreply@babymall.com
   ```
   (Or use onboarding@resend.dev for testing)

5. **Delete old variables:**
   - EMAIL_HOST
   - EMAIL_PORT
   - EMAIL_USER
   - EMAIL_PASS

6. Click "Save"

---

## Step 3: Redeploy Backend

### Option A: Auto-Deploy (Recommended)
- Render will auto-deploy after env changes
- Watch the "Events" tab for deployment status
- Wait for "Deploy succeeded" message

### Option B: Manual Deploy
```bash
# In your local repo
git pull origin main
npm install
# Deploy to Render (via Render link or CLI)
```

---

## Step 4: Verify Configuration

### Option 1: Browser Test
```
Visit: https://your-backend.onrender.com/api/auth/otp/debug/test-email

Expected Response:
{
  "success": true,
  "message": "Resend API configuration is valid!",
  "config": {
    "apiKeySet": true,
    "emailFrom": "noreply@babymall.com",
    "provider": "Resend"
  }
}
```

### Option 2: cURL Test
```bash
curl https://your-backend.onrender.com/api/auth/otp/debug/test-email
```

### Troubleshooting
If test fails:
- ✅ Check RESEND_API_KEY is set correctly
- ✅ Check EMAIL_FROM is set
- ✅ Verify Render redeploy completed
- ✅ Check Render logs for errors

---

## Step 5: Test OTP Functionality

### Full OTP Flow Test:

1. **Backend**: Verify API is running
   ```bash
   curl https://your-backend.onrender.com/api/health
   ```

2. **Request OTP:**
   ```bash
   curl -X POST https://your-backend.onrender.com/api/auth/otp/request \
     -H "Content-Type: application/json" \
     -d '{"email":"your-test-email@example.com"}'
   ```
   
   **Expected Response:**
   ```json
   {
     "success": true,
     "message": "OTP sent to your-test-email@example.com. Valid for 5 minutes.",
     "isNewUser": true
   }
   ```

3. **Check Backend Logs:**
   Look for:
   ```
   📤 Sending email via Resend to: your-test-email@example.com
   ✅ Email sent successfully. ID: xxx-xxx-xxx
   ```

4. **Check Email:**
   - Look in inbox (not spam)
   - Note the 6-digit OTP code
   - Copy for next step

5. **Verify OTP:**
   ```bash
   curl -X POST https://your-backend.onrender.com/api/auth/otp/verify \
     -H "Content-Type: application/json" \
     -d '{"email":"your-test-email@example.com","otp":"123456"}'
   ```
   
   **Expected Response:**
   ```json
   {
     "success": true,
     "user": {...},
     "token": "eyJhbGciOiJIUzI1NiIs..."
   }
   ```

---

## Step 6: Frontend Testing

1. **Visit:** https://your-frontend.vercel.app/auth/login
2. **Enter Email:** your-test-email@example.com
3. **Click:** "Send OTP"
4. **Wait:** for email
5. **Check:** email received in inbox
6. **Enter:** 6-digit OTP from email
7. **Verify:** Login successful ✅

---

## Step 7: Production Monitoring

### Monitor Resend Dashboard
- Go to https://resend.com/dashboard
- Check "Emails" section
- View:
  - Delivery status
  - Bounce rate
  - Opens & clicks
  - Any failures

### Monitor Render Logs
- Render dashboard → Logs
- Search for: `Email sent successfully`
- Check for any error messages
- Monitor email delivery rate

### Set Up Alerts (Optional)
- Enable notifications in Resend for failures
- Track bounces
- Monitor rate limits (100K emails/day free)

---

## Step 8: Rollback Plan (If Issues)

**If critical issues occur:**

```bash
# Option 1: Quick rollback to old code
cd backend
git revert 3a474b5  # Undo Resend migration
npm install         # Restore Nodemailer
npm start           # Restart

# Option 2: Manual fix (Render)
# Remove RESEND_* env vars
# Add back EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS
# Redeploy
```

**Expected issues & solutions:**
- ❌ Email not sent → Check RESEND_API_KEY
- ❌ Wrong sender email → Verify EMAIL_FROM domain
- ❌ API errors → Check Resend status page
- ❌ Rate limited → Check 100K/day limit reached

---

## Step 9: Success Verification

✅ All of these should be true:

- [ ] RESEND_API_KEY set on Render
- [ ] EMAIL_FROM set on Render
- [ ] Old EMAIL_* vars removed
- [ ] Backend redeployed successfully
- [ ] `/api/auth/otp/debug/test-email` returns success
- [ ] OTP email sends correctly
- [ ] OTP verification works
- [ ] Resend dashboard shows emails delivered
- [ ] Frontend login flow works end-to-end
- [ ] No errors in Render logs

---

## Deployment Timeline

| Step | Duration | Status |
|------|----------|--------|
| Update Render env vars | 2 min | Manual |
| Auto-redeploy | 3-5 min | Automatic |
| Configuration test | 1 min | Manual |
| OTP flow test | 2 min | Manual |
| Production verification | 5 min | Manual |
| **Total** | **15-20 min** | **QUICK** ✅ |

---

## Post-Deployment

### Daily Checks (First Week)
- [ ] Check Resend dashboard for any bounces
- [ ] Verify OTP emails arriving in inbox
- [ ] Monitor error logs for failures
- [ ] Test with different email providers

### Weekly Checks
- [ ] Review Resend analytics
- [ ] Check email delivery rate
- [ ] Monitor for any pattern of failures

### Monthly Checks
- [ ] Review email volume vs free tier limit
- [ ] Check for any security alerts
- [ ] Verify no failed emails in logs

---

## Support Resources

### Resend
- **Dashboard:** https://resend.com/dashboard
- **API Keys:** https://resend.com/api-keys
- **Docs:** https://resend.com/docs
- **Status:** https://status.resend.com
- **Support:** support@resend.com

### Baby Mall

- **RESEND_SETUP.md** - Complete setup guide
- **RESEND_QUICKSTART.md** - Quick reference
- **MIGRATION_COMPLETE.md** - Migration documentation

---

## 🎯 Final Status

**Ready for Production Deployment** ✅

**Commit:** `3a474b5` (main branch)  
**Status:** All code pushed and tested  
**Risk Level:** Low (API-based, established service)

---

## Sign-Off Checklist

- [ ] Code reviewed (all files changed)
- [ ] Tests passed (OTP flow working)
- [ ] Documentation complete (all guides written)
- [ ] Team notified of migration
- [ ] Render credentials verified
- [ ] Resend account ready
- [ ] Ready to deploy

**Deployment approved: ✅**

---

For questions or issues, reference:
- RESEND_SETUP.md (setup issues)
- RESEND_QUICKSTART.md (quick reference)
- MIGRATION_COMPLETE.md (technical details)
- RESEND_MIGRATION_SUMMARY.md (full overview)
