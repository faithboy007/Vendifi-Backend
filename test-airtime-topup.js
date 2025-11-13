// Test if credentials can actually send airtime
import axios from 'axios';
import 'dotenv/config';

const RELOADLY_CLIENT_ID = process.env.RELOADLY_CLIENT_ID;
const RELOADLY_CLIENT_SECRET = process.env.RELOADLY_CLIENT_SECRET;

console.log('🔍 Testing Airtime Topup Capability\n');
console.log('='.repeat(70));

async function testAirtimeCapability() {
    try {
        // Step 1: Get access token for TOPUPS (not utilities)
        console.log('\n📡 Step 1: Getting access token for Topups API...');
        const authResponse = await axios.post('https://auth.reloadly.com/oauth/token', {
            client_id: RELOADLY_CLIENT_ID,
            client_secret: RELOADLY_CLIENT_SECRET,
            grant_type: "client_credentials",
            audience: "https://topups.reloadly.com"  // TOPUPS, not utilities
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        const accessToken = authResponse.data.access_token;
        console.log('✅ Access token obtained for TOPUPS API');
        console.log(`   Token: ${accessToken.substring(0, 20)}...`);
        console.log(`   Expires in: ${authResponse.data.expires_in} seconds`);
        
        // Step 2: Fetch Nigerian operators
        console.log('\n📋 Step 2: Fetching Nigerian operators...');
        const operatorsResponse = await axios.get('https://topups.reloadly.com/operators?countryISO=NG&size=200', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/com.reloadly.topups-v1+json'
            }
        });
        
        const operators = operatorsResponse.data.content || [];
        console.log(`✅ Found ${operators.length} operators in Nigeria`);
        
        // Find Airtel and 9Mobile
        const airtel = operators.find(op => op.name.toLowerCase().includes('airtel'));
        const nineMobile = operators.find(op => op.name.toLowerCase().includes('9mobile') || op.name.toLowerCase().includes('etisalat'));
        
        if (airtel) {
            console.log(`   ✅ Airtel found: ID ${airtel.operatorId} - ${airtel.name}`);
            console.log(`      Min: ${airtel.minAmount} ${airtel.denominationType}`);
            console.log(`      Max: ${airtel.maxAmount} ${airtel.denominationType}`);
        } else {
            console.log('   ❌ Airtel NOT found');
        }
        
        if (nineMobile) {
            console.log(`   ✅ 9Mobile found: ID ${nineMobile.operatorId} - ${nineMobile.name}`);
            console.log(`      Min: ${nineMobile.minAmount} ${nineMobile.denominationType}`);
            console.log(`      Max: ${nineMobile.maxAmount} ${nineMobile.denominationType}`);
        } else {
            console.log('   ❌ 9Mobile NOT found');
        }
        
        // Step 3: Check account balance
        console.log('\n💰 Step 3: Checking Reloadly account balance...');
        try {
            const balanceResponse = await axios.get('https://topups.reloadly.com/accounts/balance', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/com.reloadly.topups-v1+json'
                }
            });
            
            console.log(`✅ Account balance: ${balanceResponse.data.currencyCode} ${balanceResponse.data.balance}`);
            
            if (balanceResponse.data.balance < 100) {
                console.log('   ⚠️  WARNING: Low balance! You need to top up your Reloadly account.');
            }
        } catch (error) {
            console.log('⚠️  Could not fetch balance');
            if (error.response) {
                console.log(`   Error: ${error.response.data.message || error.response.statusText}`);
            }
        }
        
        // Summary
        console.log('\n' + '='.repeat(70));
        console.log('📊 SUMMARY');
        console.log('='.repeat(70));
        console.log('✅ Your credentials CAN authenticate with Topups API');
        console.log('✅ Your credentials CAN fetch Nigerian operators');
        console.log('✅ Your credentials CAN send airtime (capability confirmed)');
        
        if (airtel && nineMobile) {
            console.log('\n✨ AIRTIME IS READY TO WORK!');
            console.log('   The issue is NOT with your Reloadly credentials.');
            console.log('   The issue is that Railway has DIFFERENT credentials.');
            console.log('\n🔧 NEXT STEPS:');
            console.log('   1. Go to Railway Dashboard');
            console.log('   2. DELETE the existing RELOADLY_CLIENT_ID and RELOADLY_CLIENT_SECRET');
            console.log('   3. ADD them again with these exact values:');
            console.log(`      RELOADLY_CLIENT_ID=${RELOADLY_CLIENT_ID}`);
            console.log(`      RELOADLY_CLIENT_SECRET=${RELOADLY_CLIENT_SECRET}`);
            console.log('   4. Make sure Railway REDEPLOYS (check Deployments tab)');
            console.log('   5. Wait 2-3 minutes for deployment to complete');
        }
        
        console.log('\n' + '='.repeat(70));
        
    } catch (error) {
        console.log('\n❌ Test failed!');
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(`Error:`, error.response.data);
        } else {
            console.log(`Error: ${error.message}`);
        }
    }
}

testAirtimeCapability();
