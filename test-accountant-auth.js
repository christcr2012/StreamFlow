// test-accountant-auth.js
// Quick test to verify accountant authentication logic

const testAccountantAuth = () => {
  console.log('🔍 TESTING ACCOUNTANT AUTHENTICATION LOGIC...\n');

  // Simulate environment variables
  const ACCOUNTANT_EMAIL = 'accountant@streamflow.com';
  const ACCOUNTANT_PASSWORD = 'Thrillicious01no';

  // Simulate login input
  const emailInput = 'accountant@streamflow.com';
  const password = 'Thrillicious01no';

  console.log('Environment Variables:');
  console.log(`ACCOUNTANT_EMAIL: ${ACCOUNTANT_EMAIL}`);
  console.log(`ACCOUNTANT_PASSWORD: ${ACCOUNTANT_PASSWORD ? '[SET]' : '[NOT SET]'}`);
  console.log('');

  console.log('Login Input:');
  console.log(`emailInput: ${emailInput}`);
  console.log(`password: ${password}`);
  console.log('');

  // Test the exact logic from login.ts
  const accountantEmail = ACCOUNTANT_EMAIL?.toLowerCase();
  const accountantPassword = ACCOUNTANT_PASSWORD;

  console.log('Processed Values:');
  console.log(`accountantEmail (env, lowercase): ${accountantEmail}`);
  console.log(`emailInput.toLowerCase(): ${emailInput.toLowerCase()}`);
  console.log('');

  // Test the comparison
  const emailMatch = emailInput.toLowerCase() === accountantEmail;
  const passwordMatch = password === accountantPassword;

  console.log('Comparison Results:');
  console.log(`Email match: ${emailMatch} (${emailInput.toLowerCase()} === ${accountantEmail})`);
  console.log(`Password match: ${passwordMatch}`);
  console.log('');

  // Test the full condition
  const authSuccess = accountantEmail && accountantPassword && emailMatch && passwordMatch;
  console.log(`Authentication Success: ${authSuccess}`);
  console.log('');

  // Test cookie encoding/decoding
  const encodedEmail = encodeURIComponent(emailInput);
  const decodedEmail = decodeURIComponent(encodedEmail);
  
  console.log('Cookie Encoding Test:');
  console.log(`Original: ${emailInput}`);
  console.log(`Encoded: ${encodedEmail}`);
  console.log(`Decoded: ${decodedEmail}`);
  console.log(`Encoding/Decoding Match: ${emailInput === decodedEmail}`);
  console.log('');

  // Test middleware comparison
  const middlewareMatch = decodedEmail.toLowerCase() === accountantEmail;
  console.log('Middleware Comparison:');
  console.log(`decodedEmail.toLowerCase(): ${decodedEmail.toLowerCase()}`);
  console.log(`accountantEmail: ${accountantEmail}`);
  console.log(`Middleware Match: ${middlewareMatch}`);

  return {
    authSuccess,
    emailMatch,
    passwordMatch,
    middlewareMatch,
    encodingWorks: emailInput === decodedEmail
  };
};

// Run the test
const result = testAccountantAuth();
console.log('\n🎯 FINAL RESULT:', result);
