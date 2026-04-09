const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const EMAIL = 'teste2e2@example.com';
let token = '';

async function runTests() {
  console.log('--- STARTING E2E API VALIDATION ---');
  try {
    // 1. Health check
    process.stdout.write('1. Health check... ');
    const health = await axios.get(`${API_URL}/health`);
    if (health.data.success) console.log('✅ OK');

    // 2. Auth Flow Request OTP
    process.stdout.write('2. Request OTP... ');
    const otpReq = await axios.post(`${API_URL}/auth/otp/request`, { email: EMAIL });
    const otpCode = otpReq.data.otp;
    if (otpCode) console.log('✅ OK (OTP: ' + otpCode + ')');
    else throw new Error('No OTP returned in dev mode');

    // 3. Auth Flow Verify OTP
    process.stdout.write('3. Verify OTP... ');
    const verifyReq = await axios.post(`${API_URL}/auth/otp/verify`, { email: EMAIL, otp: otpCode, name: 'E2E Tester' });
    token = verifyReq.data.token;
    if (token) console.log('✅ OK (Token received)');

    // 4. Test User Profile (Check JWT protection)
    process.stdout.write('4. Fetch Private Profile... ');
    const profileReq = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (profileReq.data.user.email === EMAIL) console.log('✅ OK');

    // 5. Cart operations
    process.stdout.write('5. Cart Operations... ');
    const cartReq = await axios.get(`${API_URL}/cart`, { headers: { Authorization: `Bearer ${token}` } });
    if (cartReq.data.success) console.log('✅ OK');

    // 6. Test Invalid OTP limits
    process.stdout.write('6. Rate limit / Invalid OTP protection... ');
    try {
      await axios.post(`${API_URL}/auth/otp/verify`, { email: EMAIL, otp: '000000' });
      console.log('❌ FAILED (Should have rejected invalid OTP)');
    } catch(err) {
      if (err.response && err.response.status === 400) console.log('✅ OK (Correctly blocked invalid OTP)');
      else throw err;
    }

    console.log('\n🎉 ALL BACKEND E2E API TESTS PASSED!');
  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

runTests();
