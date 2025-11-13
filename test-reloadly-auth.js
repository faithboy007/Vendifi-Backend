// Test Reloadly Authentication
import axios from 'axios';
import 'dotenv/config';

const RELOADLY_CLIENT_ID = process.env.RELOADLY_CLIENT_ID;
const RELOADLY_CLIENT_SECRET = process.env.RELOADLY_CLIENT_SECRET;

console.log('🔍 Testing Reloadly Authentication...\n');
console.log('Client ID:', RELOADLY_CLIENT_ID);
console.log('Client Secret:', RELOADLY_CLIENT_SECRET ? `${RELOADLY_CLIENT_SECRET.substring(0, 10)}...` : 'NOT SET');
console.log('');

async function testAuth(audience, label) {
    try {
        console.log(`\nTesting ${label}...`);
        const response = await axios.post('https://auth.reloadly.com/oauth/token', {
            client_id: RELOADLY_CLIENT_ID,
            client_secret: RELOADLY_CLIENT_SECRET,
            grant_type: "client_credentials",
            audience: audience
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log(`✅ ${label} SUCCESS!`);
        console.log(`   Access Token: ${response.data.access_token.substring(0, 20)}...`);
        console.log(`   Expires in: ${response.data.expires_in} seconds (${(response.data.expires_in / 3600).toFixed(2)} hours)`);
        return true;
    } catch (error) {
        console.log(`❌ ${label} FAILED!`);
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Error:`, JSON.stringify(error.response.data, null, 2));
        } else {
            console.log(`   Error: ${error.message}`);
        }
        return false;
    }
}

async function main() {
    console.log('='.repeat(60));
    console.log('RELOADLY AUTHENTICATION TEST');
    console.log('='.repeat(60));
    
    // Test both production and sandbox
    const productionWorks = await testAuth('https://topups.reloadly.com', 'PRODUCTION API');
    const sandboxWorks = await testAuth('https://topups-sandbox.reloadly.com', 'SANDBOX API');
    
    console.log('\n' + '='.repeat(60));
    console.log('RESULTS:');
    console.log('='.repeat(60));
    
    if (productionWorks) {
        console.log('✅ Your credentials are PRODUCTION credentials');
        console.log('   Your server.js is correctly configured!');
    } else if (sandboxWorks) {
        console.log('⚠️  Your credentials are SANDBOX/TEST credentials');
        console.log('   You need to get PRODUCTION credentials from Reloadly dashboard');
        console.log('   OR update server.js to use sandbox URLs');
    } else {
        console.log('❌ BOTH tests failed!');
        console.log('\n🔧 POSSIBLE ISSUES:');
        console.log('1. Wrong Client ID or Client Secret');
        console.log('2. Credentials have extra spaces/line breaks');
        console.log('3. Account not activated on Reloadly');
        console.log('4. API access not enabled on your account');
        console.log('\n📝 NEXT STEPS:');
        console.log('1. Go to https://www.reloadly.com/dashboard');
        console.log('2. Check "Developers" or "API" section');
        console.log('3. Copy the PRODUCTION/LIVE credentials');
        console.log('4. Update your .env file');
        console.log('5. Make sure there are no extra spaces or line breaks');
    }
    
    console.log('='.repeat(60));
}

main();
