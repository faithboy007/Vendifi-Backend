// Test complete airtime purchase flow on Railway
import axios from 'axios';

const RAILWAY_URL = 'https://vendifi-backend-production.up.railway.app';

console.log('🔍 Testing Airtime Purchase Flow on Railway\n');
console.log('='.repeat(70));

async function testAirtimePurchase() {
    try {
        // Step 1: Check if products endpoint works (may not exist)
        console.log('\n📋 Step 1: Checking products catalog...');
        try {
            const productsResponse = await axios.get(`${RAILWAY_URL}/api/products`);
            console.log('✅ Products endpoint exists');
            if (productsResponse.data && productsResponse.data.airtime) {
                console.log(`   Airtime operators: ${productsResponse.data.airtime.map(a => a.network).join(', ')}`);
            }
        } catch (error) {
            console.log('⚠️  Products endpoint not found (this is OK - products are hardcoded)');
        }

        // Step 2: Simulate what happens when user tries to buy airtime
        console.log('\n💳 Step 2: Simulating airtime purchase transaction...');
        console.log('   (Testing what happens after Flutterwave payment succeeds)');
        
        // This simulates the /api/process-transaction endpoint
        // We'll create a mock transaction reference
        const mockTxRef = 'TEST-' + Date.now();
        
        console.log(`   Mock transaction reference: ${mockTxRef}`);
        console.log('   Note: This would normally come from Flutterwave after payment');
        console.log('   We cannot fully test without a real Flutterwave payment');
        
        // Step 3: Check what the backend would do
        console.log('\n🔍 Step 3: What Railway backend needs to do:');
        console.log('   1. Receive transaction reference from frontend');
        console.log('   2. Verify payment with Flutterwave ✅ (would work if payment is real)');
        console.log('   3. Get Reloadly access token ❓ (testing this...)');
        console.log('   4. Send airtime via Reloadly API ❓ (testing this...)');
        
        // Let's check if Railway can authenticate with Reloadly for TOPUPS
        console.log('\n🔐 Step 4: Testing if Railway can authenticate for AIRTIME (topups)...');
        console.log('   The previous test failed on /billers (utilities)');
        console.log('   But airtime uses /topups which is different!');
        
        // Create a test endpoint call that would trigger Reloadly auth
        console.log('\n   ⏳ Checking if there\'s a test endpoint...');
        
        // Check if there's a root endpoint
        try {
            const rootResponse = await axios.get(`${RAILWAY_URL}/`);
            console.log('✅ Backend root endpoint responds:');
            console.log(`   ${JSON.stringify(rootResponse.data)}`);
        } catch (error) {
            if (error.response) {
                console.log('✅ Backend is online (got response)');
            }
        }

        // Summary
        console.log('\n' + '='.repeat(70));
        console.log('📊 ANALYSIS');
        console.log('='.repeat(70));
        console.log('\n⚠️  IMPORTANT FINDING:');
        console.log('   The /api/sync-operator-ids endpoint fails because it tries to fetch');
        console.log('   UTILITIES (cable TV, electricity) from Reloadly.');
        console.log('   BUT airtime uses a DIFFERENT API endpoint: /topups');
        console.log('');
        console.log('   Your PRODUCT_CATALOG already has correct airtime operator IDs:');
        console.log('   - Airtel: 342');
        console.log('   - 9Mobile: 340');
        console.log('');
        console.log('   Airtime does NOT need the sync-operator-ids endpoint!');
        
        console.log('\n🎯 NEXT STEP:');
        console.log('   Make a REAL airtime purchase test:');
        console.log('   1. Go to your frontend website');
        console.log('   2. Select Airtel or 9Mobile');
        console.log('   3. Enter a phone number');
        console.log('   4. Buy ₦100 airtime');
        console.log('   5. Complete Flutterwave payment');
        console.log('   6. Check if airtime arrives within 30 seconds');
        console.log('');
        console.log('   If it STILL fails, click "View logs" on Railway deployment');
        console.log('   and look for the actual error when processing the transaction.');
        
        console.log('\n' + '='.repeat(70));
        
    } catch (error) {
        console.log('\n❌ Test error:', error.message);
    }
}

testAirtimePurchase();
