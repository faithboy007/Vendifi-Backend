// Test Railway Backend Reloadly Authentication
import axios from 'axios';

const RAILWAY_URL = 'https://vendifi-backend-production.up.railway.app';

console.log('🔍 Testing Railway Backend...\n');
console.log('Backend URL:', RAILWAY_URL);
console.log('='.repeat(60));

async function testBackend() {
    try {
        // Test 1: Check if backend is alive
        console.log('\n📡 Test 1: Checking if backend is responding...');
        const healthCheck = await axios.get(`${RAILWAY_URL}/api/health`).catch(e => null);
        
        if (healthCheck && healthCheck.data) {
            console.log('✅ Backend is ALIVE');
            console.log('   Response:', healthCheck.data);
        } else {
            console.log('⚠️  Backend health check failed or no /api/health endpoint');
        }

        // Test 2: Try to trigger a small test (if there's a test endpoint)
        console.log('\n🔐 Test 2: Checking Reloadly authentication on Railway...');
        console.log('   (This will check if Railway backend can authenticate with Reloadly)');
        
        // Try to get operators (this should trigger Reloadly auth)
        try {
            const operatorsTest = await axios.get(`${RAILWAY_URL}/api/sync-operator-ids`, {
                timeout: 15000
            });
            console.log('✅ Reloadly authentication WORKS on Railway!');
            console.log('   Operators fetched successfully');
        } catch (error) {
            if (error.response) {
                console.log('❌ Reloadly authentication FAILED on Railway');
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Error:`, error.response.data);
                
                if (error.response.data && error.response.data.message === 'Access Denied') {
                    console.log('\n🚨 PROBLEM IDENTIFIED:');
                    console.log('   Railway is still using OLD/WRONG Reloadly credentials!');
                    console.log('\n🔧 SOLUTION:');
                    console.log('   1. Check Railway Variables section again');
                    console.log('   2. Make sure you SAVED the variables');
                    console.log('   3. Check if Railway actually REDEPLOYED (look for deployment logs)');
                    console.log('   4. You might need to MANUALLY trigger a redeploy');
                }
            } else if (error.code === 'ECONNABORTED') {
                console.log('⏱️  Request timed out (15s)');
                console.log('   Backend might be processing but taking too long');
            } else {
                console.log('❌ Connection error:', error.message);
            }
        }

    } catch (error) {
        console.log('❌ Unexpected error:', error.message);
    }
}

console.log('\n⏳ Running tests...\n');
testBackend();
