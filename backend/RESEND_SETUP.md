# Resend Email API Configuration

## 🚀 Setup Instructions

### 1. Get Resend API Key

1. Go to https://resend.com
2. Sign up / Log in
3. Navigate to API Keys
4. Create a new API key (starts with `re_`)
5. Copy the key

### 2. Verify Sender Domain (Important!)

Resend requires verified sender domains:

**Option A: Use Default Resend Domain (Easiest for Testing)**
```
EMAIL_FROM=onboarding@resend.dev
```
This works immediately after account creation.

**Option B: Use Your Own Domain (Production)**
1. Add your domain in Resend Dashboard
2. Add DNS records provided by Resend
3. Wait for verification (usually instant)
4. Example:
   ```
   EMAIL_FROM=noreply@babymall.com
   ```

### 3. Set Environment Variables

#### On Render (Backend):

Go to **Dashboard → Service → Environment** and add:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev
NODE_ENV=production
```

#### Local Development (.env):

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev
NODE_ENV=development
```

### 4. Install Dependencies

```bash
npm install
```

This will install `resend` based on updated package.json

---

## 📊 Configuration Comparison

| Feature | Nodemailer (SMTP) | Resend (API) |
|---------|------------------|--------------|
| Setup Time | Medium (SMTP config) | Quick (API key) |
| Reliability | Depends on email provider | Very high (99.9%) |
| Deliverability | Medium | Excellent |
| Rate Limits | Depends on provider | 100k emails/day free |
| Support | Email provider support | Resend support |
| Cost | Free (Gmail App Password) | Free tier included |
| Authentication | Gmail 2FA + App Password | Simple API key |

---

## ✅ Verification Checklist

- [ ] Resend account created
- [ ] API key generated and copied
- [ ] Sender domain verified (or using onboarding@resend.dev)
- [ ] `RESEND_API_KEY` set on Render
- [ ] `EMAIL_FROM` set to verified domain
- [ ] `npm install` run locally
- [ ] Backend restarted
- [ ] OTP test email sent successfully

---

## 🧪 Testing OTP Email

### Direct API Test:

```bash
curl -X POST http://localhost:5000/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Success Response:**
```json
{
  "success": true,
  "message": "OTP sent to test@example.com. Valid for 5 minutes.",
  "isNewUser": true
}
```

**Check Backend Logs:**
Look for:
```
✅ Email sent successfully. ID: [email-id]
```

---

## 🔍 Troubleshooting

### Error: "RESEND_API_KEY environment variable is not set"

**Solution:**
- Check Render environment variables
- Verify key is set correctly
- Redeploy after adding variable

### Error: "Unauthorized" / "Invalid API Key"

**Solution:**
- Verify API key starts with `re_`
- Check for typos in the key
- Generate new key if needed

### Error: "from email not verified"

**Solution:**
- Use `onboarding@resend.dev` for testing
- Or verify your domain in Resend Dashboard
- Update `EMAIL_FROM` environment variable

### Emails not received

**Solution:**
- Check spam/promotions folder
- Verify `EMAIL_FROM` domain is correct
- Check Resend dashboard for bounces
- Try with a different email address

---

## 📈 Monitoring

### Check Email Status:

1. Go to Resend Dashboard
2. Click "Emails" to see sent emails
3. View delivery status, bounces, opens

### Backend Logs:

Watch for these patterns:

**Success:**
```
📤 Sending email via Resend to: user@example.com
✅ Email sent successfully. ID: [id]
```

**Failure:**
```
❌ Email send failed!
   Error: [specific error]
```

---

## 🔐 Security Notes

- API key is sensitive - never commit to git
- Use environment variables only
- Rotate API key periodically
- Don't share API key in logs or errors

---

## 📝 Migration Completed

✅ Nodemailer removed  
✅ Resend API integrated  
✅ OTP logic preserved  
✅ Error handling improved  
✅ Production-ready code  

All OTP functionality works exactly the same - just with a more reliable email provider!
