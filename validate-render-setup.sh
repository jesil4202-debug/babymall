#!/bin/bash
# 🔧 Render OTP Email Setup Validator
# Run this script to verify everything is configured correctly
# Usage: bash validate-render-setup.sh

set -e

echo "🔍 Render OTP Email Configuration Validator"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in backend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "   Run this script from the backend/ directory"
    exit 1
fi

# Check if .env exists (for local development)
echo "📋 Checking local .env file..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file found${NC}"
    
    # Check required variables
    MISSING=()
    for var in EMAIL_HOST EMAIL_PORT EMAIL_USER EMAIL_PASS EMAIL_FROM; do
        if grep -q "^$var=" .env; then
            VALUE=$(grep "^$var=" .env | cut -d '=' -f 2-)
            if [ -z "$VALUE" ]; then
                MISSING+=($var)
            else
                echo -e "${GREEN}✅${NC} $var is set"
            fi
        else
            MISSING+=($var)
        fi
    done
    
    if [ ${#MISSING[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing variables in .env: ${MISSING[@]}${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "   This is OK for Render (uses dashboard variables)"
    echo "   But for local testing, create .env with:"
    cat << 'EOF'

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

EOF
fi

echo ""
echo "📦 Checking Node modules..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules exists${NC}"
    
    # Check for required packages
    if [ -f "node_modules/nodemailer/package.json" ]; then
        echo -e "${GREEN}✅ nodemailer installed${NC}"
    else
        echo -e "${RED}❌ nodemailer not installed${NC}"
        echo "   Run: npm install"
    fi
else
    echo -e "${YELLOW}⚠️  node_modules not found${NC}"
    echo "   Run: npm install"
fi

echo ""
echo "📁 Checking code files..."
if grep -q "initializeTransporter" "utils/email.js" 2>/dev/null; then
    echo -e "${GREEN}✅ email.js has lazy transporter loading${NC}"
else
    echo -e "${RED}❌ email.js not updated${NC}"
fi

if grep -q "logEnvDiagnostics" "server.js" 2>/dev/null; then
    echo -e "${GREEN}✅ server.js has diagnostic logging${NC}"
else
    echo -e "${RED}❌ server.js not updated${NC}"
fi

if grep -q "debug/test-email" "routes/otp.js" 2>/dev/null; then
    echo -e "${GREEN}✅ OTP routes have debug endpoint${NC}"
else
    echo -e "${YELLOW}⚠️  OTP routes don't have debug endpoint${NC}"
fi

echo ""
echo "🌐 Gmail Setup Checklist..."
echo "To fix email issues, verify:"
echo ""
echo "1. Gmail Account:"
echo "   - 2FA enabled: https://myaccount.google.com/security"
echo "   - Check: https://myaccount.google.com/apppasswords"
echo ""
echo "2. App Password:"
echo "   - Generate at: https://myaccount.google.com/apppasswords"
echo "   - It will be: xxxx-xxxx-xxxx-xxxx (16 characters)"
echo "   - Use as EMAIL_PASS (NOT your Gmail password)"
echo ""
echo "3. Environment Variables (for Render):"
echo "   - Render Dashboard → Your Backend → Settings → Environment"
echo "   - Add all these variables:"
echo ""
cat << 'EOF'
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
FRONTEND_URL=https://your-vercel-domain.vercel.app
NODE_ENV=production
EOF

echo ""
echo "🧪 Quick Local Test..."
echo "Run these commands to test locally:"
echo ""
echo "# 1. Start the backend"
echo "npm start"
echo ""
echo "# 2. In another terminal, request OTP"
echo "curl -X POST http://localhost:5000/api/auth/otp/request \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\":\"your-test-email@gmail.com\"}'"
echo ""
echo "# 3. Check logs for:"
echo "#    ✅ Nodemailer transporter initialized"
echo "#    ✅ OTP sent successfully"
echo ""
echo "# 4. Check your email inbox for the 6-digit code"
echo ""

echo ""
echo "📝 Next Steps:"
echo ""
echo "1. ☐ Verify Gmail has 2FA + app password"
echo "2. ☐ Update backend code with fixes (already done if you see ✅ marks above)"
echo "3. ☐ Test locally with npm start"
echo "4. ☐ Push to git and deploy to Render"
echo "5. ☐ Add all EMAIL_* variables in Render dashboard"
echo "6. ☐ Check Render startup logs for ✅ diagnostics"
echo "7. ☐ Test OTP request on Render"
echo ""

echo -e "${GREEN}✅ Validation complete!${NC}"
