// Check Flutterwave Bills API for available data plans
import axios from 'axios';
import 'dotenv/config';

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLW_BASE_URL = 'https://api.flutterwave.com/v3';

async function checkFlutterwaveBills() {
    console.log('🔍 Checking Flutterwave Bills API for Nigerian data plans...\n');
    
    try {
        // Get bill categories
        console.log('📋 Fetching bill categories...');
        const categoriesResponse = await axios.get(`${FLW_BASE_URL}/bill-categories`, {
            headers: {
                'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('\n✅ Available Bill Categories:');
        categoriesResponse.data.data.forEach(cat => {
            console.log(`  - ${cat.name} (ID: ${cat.id}, biller_code: ${cat.biller_code})`);
        });
        
        // Look for data/internet category
        const dataCategory = categoriesResponse.data.data.find(cat => 
            cat.name.toLowerCase().includes('data') || 
            cat.name.toLowerCase().includes('internet')
        );
        
        if (!dataCategory) {
            console.log('\n⚠️  No data/internet category found in Flutterwave Bills');
            console.log('   Flutterwave Bills might not support data purchases');
            console.log('\n💡 Recommendation: Use VTPass instead for MTN and GLO data');
            return;
        }
        
        console.log(`\n✅ Found data category: ${dataCategory.name}`);
        console.log(`   Fetching billers for category: ${dataCategory.biller_code}...\n`);
        
        // Get billers for data category
        const billersResponse = await axios.get(`${FLW_BASE_URL}/billers`, {
            headers: {
                'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            params: {
                category: dataCategory.biller_code
            }
        });
        
        console.log('📡 Available Data Billers:');
        const nigerianBillers = billersResponse.data.data.filter(b => 
            b.country === 'NG' || b.name.toLowerCase().includes('nigeria')
        );
        
        if (nigerianBillers.length === 0) {
            console.log('   ❌ No Nigerian data billers found');
            return;
        }
        
        for (const biller of nigerianBillers) {
            console.log(`\n${biller.name}`);
            console.log(`  Biller Code: ${biller.biller_code}`);
            console.log(`  Country: ${biller.country}`);
            
            // Get items/plans for this biller
            try {
                const itemsResponse = await axios.get(`${FLW_BASE_URL}/billers/${biller.biller_code}/items`, {
                    headers: {
                        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log(`  Available Plans: ${itemsResponse.data.data.length}`);
                
                // Show first 10 plans
                itemsResponse.data.data.slice(0, 10).forEach(item => {
                    console.log(`    - ${item.name} (₦${item.amount}) - ${item.item_code}`);
                });
                
                if (itemsResponse.data.data.length > 10) {
                    console.log(`    ... and ${itemsResponse.data.data.length - 10} more plans`);
                }
            } catch (error) {
                console.log(`  ⚠️  Could not fetch plans: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('\n⚠️  Authentication failed. Flutterwave Bills might not be enabled on your account.');
            console.log('   Please contact Flutterwave support to enable Bills API.');
        }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('ALTERNATIVE: VTPass API');
    console.log('='.repeat(80));
    console.log('\nVTPass is a popular Nigerian bill payment provider that supports:');
    console.log('  ✅ MTN Data');
    console.log('  ✅ GLO Data');
    console.log('  ✅ Airtel Data');
    console.log('  ✅ 9Mobile Data');
    console.log('  ✅ All with various data bundle sizes');
    console.log('\nGet started: https://www.vtpass.com/');
    console.log('Documentation: https://www.vtpass.com/documentation/');
    console.log('\n💡 VTPass is recommended for Nigerian data bundles');
}

checkFlutterwaveBills();
