const { MfaHelper } = require('./src/helpers/mfa.helper');

async function testTOTPDirectly() {
  console.log('🧪 Testing TOTP Setup Directly...\n');

  try {
    // Test TOTP setup
    const totpResult = await MfaHelper.setupTotp('test@example.com');
    
    console.log('✅ TOTP Setup Result:');
    console.log('   Secret:', totpResult.secret);
    console.log('   Manual Entry Key:', totpResult.manualEntryKey);
    console.log('   QR Code (base64):', totpResult.qrCode.substring(0, 50) + '...');
    
    // Generate a TOTP token
    const token = require('speakeasy').totp({
      secret: totpResult.secret,
      encoding: 'base32',
    });
    
    console.log('\n✅ Generated TOTP Token:', token);
    
    // Verify the token
    const isValid = MfaHelper.verifyTotpCode(totpResult.secret, token);
    console.log('✅ Token Verification:', isValid);
    
    // Test with invalid token
    const isInvalid = MfaHelper.verifyTotpCode(totpResult.secret, '123456');
    console.log('✅ Invalid Token Test:', isInvalid);
    
    console.log('\n🎉 TOTP Direct Test Completed Successfully!');
    console.log('\n📱 To test with a real authenticator app:');
    console.log('   1. Copy the QR code data URL and paste it in a browser');
    console.log('   2. Scan the QR code with your authenticator app');
    console.log('   3. Or manually enter the secret:', totpResult.secret);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTOTPDirectly(); 