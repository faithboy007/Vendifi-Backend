// Find correct Nigerian operator IDs
import axios from 'axios';
import 'dotenv/config';

const RELOADLY_CLIENT_ID = process.env.RELOADLY_CLIENT_ID;
const RELOADLY_CLIENT_SECRET = process.env.RELOADLY_CLIENT_SECRET;

console.log('🔍 Finding Nigerian Operator IDs\n');

async function findOperators() {
    try {
        // Get access token
        const authResponse = await axios.post('https://auth.reloadly.com/oauth/token', {
            client_id: RELOADLY_CLIENT_ID,
            client_secret: RELOADLY_CLIENT_SECRET,
            grant_type: "client_credentials",
            audience: "https://topups.reloadly.com"
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        const accessToken = authResponse.data.access_token;
        
        // Fetch Nigerian operators
        const operatorsResponse = await axios.get('https://topups.reloadly.com/operators?countryISO=NG&size=200', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/com.reloadly.topups-v1+json'
            }
        });
        
        const operators = operatorsResponse.data.content || [];
        
        console.log(`Found ${operators.length} operators\n`);
        console.log('='.repeat(80));
        console.log('NIGERIAN MOBILE OPERATORS');
        console.log('='.repeat(80));
        
        // Filter for Nigerian mobile operators
        const mobileOperators = operators.filter(op => {
            const name = op.name.toLowerCase();
            return name.includes('nigeria') && 
                   (name.includes('airtel') || name.includes('mtn') || 
                    name.includes('glo') || name.includes('9mobile') || 
                    name.includes('etisalat'));
        });
        
        mobileOperators.forEach(op => {
            console.log(`\n📱 ${op.name}`);
            console.log(`   ID: ${op.operatorId}`);
            console.log(`   Currency: ${op.destinationCurrencyCode}`);
            console.log(`   Min Amount: ${op.minAmount} ${op.denominationType}`);
            console.log(`   Max Amount: ${op.maxAmount} ${op.denominationType}`);
            console.log(`   Type: ${op.denominationType}`);
        });
        
        console.log('\n' + '='.repeat(80));
        console.log('\n💡 UPDATE YOUR server.js WITH THESE OPERATOR IDs:');
        console.log('='.repeat(80));
        
        mobileOperators.forEach(op => {
            const name = op.name.toLowerCase();
            let network = '';
            if (name.includes('airtel')) network = 'AIRTEL';
            else if (name.includes('mtn')) network = 'MTN';
            else if (name.includes('glo')) network = 'GLO';
            else if (name.includes('9mobile') || name.includes('etisalat')) network = '9MOBILE';
            
            if (network) {
                console.log(`\n${network}:`);
                console.log(`  operatorId: ${op.operatorId},`);
                console.log(`  name: '${op.name}',`);
            }
        });
        
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

findOperators();
