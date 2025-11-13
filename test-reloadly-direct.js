// Direct test of Reloadly airtime topup
import axios from 'axios';
import 'dotenv/config';

const RELOADLY_CLIENT_ID = process.env.RELOADLY_CLIENT_ID;
const RELOADLY_CLIENT_SECRET = process.env.RELOADLY_CLIENT_SECRET;

// CHANGE THESE FOR YOUR TEST
const TEST_PHONE = '7088143589'; // Put an Airtel or 9Mobile number here (without +234)
const TEST_OPERATOR_ID = 342; // 342 = Airtel, 340 = 9Mobile
const TEST_AMOUNT = 100; // ₦100

console.log('🧪 Testing Direct Reloadly Airtime Topup\n');
console.log('='.repeat(70));
console.log(`Phone: +234${TEST_PHONE}`);
console.log(`Operator: ${TEST_OPERATOR_ID === 342 ? 'Airtel' : '9Mobile'}`);
console.log(`Amount: ₦${TEST_AMOUNT}`);
console.log('='.repeat(70));

async function testDirectTopup() {
    try {
        // Step 1: Get access token
        console.log('\n📡 Step 1: Getting access token...');
        const authResponse = await axios.post('https://auth.reloadly.com/oauth/token', {
            client_id: RELOADLY_CLIENT_ID,
            client_secret: RELOADLY_CLIENT_SECRET,
            grant_type: "client_credentials",
            audience: "https://topups.reloadly.com"
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        const accessToken = authResponse.data.access_token;
        console.log('✅ Access token obtained');
        
        // Step 2: Send topup
        console.log('\n💸 Step 2: Sending airtime topup...');
        
        const payload = {
            operatorId: TEST_OPERATOR_ID,
            amount: TEST_AMOUNT,
            useLocalAmount: true,  // Using NGN
            customIdentifier: 'TEST-' + Date.now(),
            recipientPhone: {
                countryCode: "NG",
                number: parseInt(TEST_PHONE, 10)
            }
        };
        
        console.log('\nPayload:');
        console.log(JSON.stringify(payload, null, 2));
        
        const topupResponse = await axios.post('https://topups.reloadly.com/topups', payload, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/com.reloadly.topups-v1+json'
            }
        });
        
        console.log('\n✅ SUCCESS! Airtime sent!');
        console.log('\nResponse:');
        console.log(JSON.stringify(topupResponse.data, null, 2));
        
        console.log('\n' + '='.repeat(70));
        console.log('🎉 AIRTIME DELIVERY WORKS!');
        console.log('The problem is NOT with the Reloadly API call itself.');
        console.log('Check if Railway has the correct credentials.');
        console.log('='.repeat(70));
        
    } catch (error) {
        console.log('\n❌ FAILED! This is the error:\n');
        console.log('='.repeat(70));
        
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error Data:');
            console.log(JSON.stringify(error.response.data, null, 2));
            
            console.log('\n' + '='.repeat(70));
            console.log('🔧 THIS IS THE EXACT ERROR YOUR BACKEND IS GETTING!');
            console.log('Share this error with me so I can fix it.');
            console.log('='.repeat(70));
        } else {
            console.log('Error:', error.message);
        }
    }
}

console.log('\n⚠️  WARNING: This will send REAL airtime if successful!');
console.log('Make sure TEST_PHONE is set to a number you own.\n');

testDirectTopup();
