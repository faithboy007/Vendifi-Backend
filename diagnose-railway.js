// Comprehensive Railway Backend Diagnostic
import axios from 'axios';

const RAILWAY_URL = 'https://vendifi-backend-production.up.railway.app';

console.log('🔍 VENDIFI RAILWAY BACKEND DIAGNOSTIC\n');
console.log('='.repeat(70));

async function runDiagnostics() {
    const results = {
        backendAlive: false,
        reloadlyAuth: false,
        airtimeOperatorsValid: false,
        errors: []
    };

    // Test 1: Check if backend is responding
    console.log('\n📡 TEST 1: Backend Health Check');
    console.log('-'.repeat(70));
    try {
        const healthResponse = await axios.get(`${RAILWAY_URL}/`, { timeout: 10000 });
        console.log('✅ Backend is ONLINE');
        console.log(`   Response: ${JSON.stringify(healthResponse.data)}`);
        results.backendAlive = true;
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.log('⏱️  Request timed out - backend might be slow or down');
        } else if (error.response) {
            console.log('✅ Backend is responding (got HTTP response)');
            results.backendAlive = true;
        } else {
            console.log('❌ Backend is NOT responding');
            console.log(`   Error: ${error.message}`);
            results.errors.push('Backend offline or not accessible');
        }
    }

    // Test 2: Check Reloadly authentication
    console.log('\n🔐 TEST 2: Reloadly Authentication');
    console.log('-'.repeat(70));
    try {
        const productsResponse = await axios.get(`${RAILWAY_URL}/api/products`, { timeout: 10000 });
        console.log('✅ Products endpoint accessible');
        
        // Check if products are empty (might indicate auth issue)
        if (productsResponse.data && productsResponse.data.airtime && productsResponse.data.airtime.length > 0) {
            console.log(`   Airtime products found: ${productsResponse.data.airtime.length} networks`);
            console.log(`   Networks: ${productsResponse.data.airtime.map(p => p.network).join(', ')}`);
            results.airtimeOperatorsValid = true;
            results.reloadlyAuth = true; // Likely working if products are available
        } else {
            console.log('⚠️  No airtime products found');
            results.errors.push('No airtime products in catalog');
        }
    } catch (error) {
        console.log('❌ Products endpoint failed');
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Error:`, error.response.data);
        } else {
            console.log(`   Error: ${error.message}`);
        }
        results.errors.push('Products endpoint not accessible');
    }

    // Test 3: Try to sync operator IDs (this will test Reloadly auth)
    console.log('\n🔄 TEST 3: Reloadly Operator Sync (Tests Authentication)');
    console.log('-'.repeat(70));
    try {
        console.log('   Attempting to fetch operators from Reloadly...');
        const syncResponse = await axios.get(`${RAILWAY_URL}/api/sync-operator-ids`, { 
            timeout: 20000 
        });
        
        if (syncResponse.data && syncResponse.data.success) {
            console.log('✅ Reloadly authentication WORKS on Railway!');
            console.log(`   Operators fetched successfully`);
            results.reloadlyAuth = true;
            
            if (syncResponse.data.matchedIds && syncResponse.data.matchedIds.airtime) {
                console.log(`   Airtime operators found:`);
                for (const [network, data] of Object.entries(syncResponse.data.matchedIds.airtime)) {
                    console.log(`     - ${network}: ID ${data.operatorId}`);
                }
            }
        } else {
            console.log('⚠️  Sync endpoint returned success:false');
            results.errors.push('Operator sync failed');
        }
    } catch (error) {
        console.log('❌ Reloadly authentication FAILED on Railway');
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Error:`, JSON.stringify(error.response.data, null, 2));
            
            const errorData = error.response.data.error || error.response.data;
            if (errorData.errorCode === 'INVALID_TOKEN') {
                console.log('\n   🚨 PROBLEM: Invalid Token Error');
                console.log('   This means the credentials in Railway are WRONG or MISMATCHED');
                console.log('   The credentials might be:');
                console.log('     1. Sandbox credentials (but server.js uses production URLs)');
                console.log('     2. Copied incorrectly (typos, extra spaces)');
                console.log('     3. Not saved properly in Railway');
                results.errors.push('Invalid Reloadly credentials - sandbox/production mismatch');
            } else if (errorData.message === 'Access Denied') {
                console.log('\n   🚨 PROBLEM: Access Denied');
                console.log('   The credentials are rejected by Reloadly');
                results.errors.push('Reloadly credentials rejected - Access Denied');
            }
        } else if (error.code === 'ECONNABORTED') {
            console.log('   ⏱️  Request timed out (20s)');
            results.errors.push('Sync endpoint timeout');
        } else {
            console.log(`   Error: ${error.message}`);
            results.errors.push(`Sync failed: ${error.message}`);
        }
        results.reloadlyAuth = false;
    }

    // Final Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(70));
    
    console.log(`\nBackend Status: ${results.backendAlive ? '✅ ONLINE' : '❌ OFFLINE'}`);
    console.log(`Reloadly Auth: ${results.reloadlyAuth ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Airtime Ready: ${results.airtimeOperatorsValid ? '✅ YES' : '❌ NO'}`);
    
    if (results.errors.length > 0) {
        console.log('\n🚨 ISSUES FOUND:');
        results.errors.forEach((err, i) => {
            console.log(`   ${i + 1}. ${err}`);
        });
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('-'.repeat(70));
    
    if (!results.backendAlive) {
        console.log('   1. Check if Railway deployment is running');
        console.log('   2. Check Railway deployment logs for errors');
        console.log('   3. Verify the backend URL is correct');
    } else if (!results.reloadlyAuth) {
        console.log('   1. Go to Railway Dashboard → Your Project → Variables');
        console.log('   2. VERIFY these exact values are entered:');
        console.log('      RELOADLY_CLIENT_ID=jTObjyPPsiJW2x2F5Sfhh1G4EsS2KYXl');
        console.log('      RELOADLY_CLIENT_SECRET=hSRrGxSye0-wQlbnEoVVmwR0oLkvGw-WADIGxw4YAXtev4N54JRJJ1xEHW6WPKw');
        console.log('   3. Make sure there are NO extra spaces or line breaks');
        console.log('   4. After saving, wait for Railway to REDEPLOY (check deployment status)');
        console.log('   5. Run this diagnostic again after redeployment completes');
    } else if (results.reloadlyAuth && !results.airtimeOperatorsValid) {
        console.log('   1. Authentication works but products might not be configured');
        console.log('   2. Try accessing /api/sync-operator-ids and then /api/update-operator-ids');
    } else {
        console.log('   ✅ Everything looks good!');
        console.log('   Try purchasing airtime for Airtel or 9Mobile');
        console.log('   If it still fails, check Railway deployment logs for the actual error');
    }

    console.log('\n' + '='.repeat(70));
}

runDiagnostics().catch(error => {
    console.error('\n💥 Diagnostic script failed:', error.message);
});
