// Add TextEncoder polyfill for Node.js
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

async function testTOTPSimple() {
  console.log('🧪 Testing TOTP Setup (Simple)...\n');

  try {
    // 1. Generate a secret
    const secret = speakeasy.generateSecret({
      name: 'totp-test@example.com',
      issuer: 'Test App',
      length: 32,
    });

    console.log('✅ Secret generated:');
    console.log('   Base32 Secret:', secret.base32);
    console.log('   Manual Entry Key:', secret.base32);

    // 2. Generate QR code
    const otpAuthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: 'totp-test@example.com',
      issuer: 'Test App',
      encoding: 'base32',
    });

    console.log('\n✅ OTP Auth URL generated:');
    console.log('   URL:', otpAuthUrl);

    const qrCode = await QRCode.toDataURL(otpAuthUrl);
    console.log('\n✅ QR Code generated (full data URL):');
    console.log(qrCode);

    // 3. Generate a TOTP token
    const token = speakeasy.totp({
      secret: secret.base32,
      encoding: 'base32',
    });

    console.log('\n✅ TOTP Token generated:');
    console.log('   Token:', token);

    // 4. Verify the token
    const isValid = speakeasy.totp.verify({
      secret: secret.base32,
      encoding: 'base32',
      token: token,
      window: 2, // Allow 2 time steps (60 seconds) for clock skew
    });

    console.log('\n✅ Token verification:');
    console.log('   Is Valid:', isValid);

    // 5. Test with invalid token
    const isInvalid = speakeasy.totp.verify({
      secret: secret.base32,
      encoding: 'base32',
      token: '123456',
      window: 2,
    });

    console.log('   Invalid Token Test:', isInvalid);

    console.log('\n🎉 TOTP Test Completed Successfully!');
    console.log('\n📱 To test with a real authenticator app:');
    console.log('   1. Copy the full data URL above and paste it in a browser to see the QR code.');
    console.log('   2. Scan the QR code with your authenticator app');
    console.log('   3. Or manually enter the secret:', secret.base32);
    console.log('   4. The current token should be:', token);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTOTPSimple(); 