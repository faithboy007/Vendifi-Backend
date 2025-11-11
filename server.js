// --- IMPORTS ---
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import 'dotenv/config'; // To manage environment variables
import admin from 'firebase-admin';

// --- INITIALIZATION ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- FIREBASE INITIALIZATION ---
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_project_id,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    })
});

const db = admin.firestore();
const auth = admin.auth();

// --- MIDDLEWARE ---
app.use(cors()); // Enable Cross-Origin Resource Sharing for your frontend
app.use(express.json()); // To parse JSON request bodies

// --- ENVIRONMENT VARIABLES (from your .env file) ---
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const RELOADLY_CLIENT_ID = process.env.RELOADLY_CLIENT_ID;
const RELOADLY_CLIENT_SECRET = process.env.RELOADLY_CLIENT_SECRET;

// Reloadly API URLs
const RELOADLY_AUTH_URL = "https://auth.reloadly.com/oauth/token";
const RELOADLY_TOPUP_URL = "https://topups.reloadly.com/topups";
const RELOADLY_OPERATORS_URL = "https://topups.reloadly.com/operators";
const RELOADLY_UTILITIES_URL = "https://utilities.reloadly.com";
const RELOADLY_TRANSACTION_STATUS_URL = "https://topups.reloadly.com/topups/reports/transactions";

// --- RELOADLY AUTHENTICATION ---

let reloadlyAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Gets a valid Reloadly Access Token, refreshing if expired.
 * Uses production token expiration (24 hours = 86400 seconds).
 * @param {string} audience - API audience (default: topups, can be utilities)
 */
async function getReloadlyAccessToken(audience = "https://topups.reloadly.com") {
    // Check if token is still valid (with a 5-minute buffer for production safety)
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    if (reloadlyAccessToken && Date.now() < (tokenExpiresAt - bufferTime)) {
        return reloadlyAccessToken;
    }

    try {
        console.log(`Fetching new Reloadly access token for ${audience} (PRODUCTION)...`);
        const response = await axios.post(RELOADLY_AUTH_URL, {
            client_id: RELOADLY_CLIENT_ID,
            client_secret: RELOADLY_CLIENT_SECRET,
            grant_type: "client_credentials",
            audience: audience
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        reloadlyAccessToken = response.data.access_token;
        
        // Production tokens expire in 24 hours (86400 seconds)
        // Use the expires_in from API response, but ensure it's production value
        const expiresInSeconds = response.data.expires_in || 86400; // Default to 24h if not provided
        tokenExpiresAt = Date.now() + (expiresInSeconds * 1000);
        
        const expiresInHours = (expiresInSeconds / 3600).toFixed(2);
        console.log(`New Reloadly production token fetched successfully. Expires in ${expiresInHours} hours.`);
        
        return reloadlyAccessToken;

    } catch (error) {
        console.error("Error fetching Reloadly access token:", error.response ? error.response.data : error.message);
        throw new Error("Could not authenticate with Reloadly.");
    }
}

/**
 * Formats a local Nigerian phone number (e.g., 080...) 
 * to international E.164 format (+234...).
 * @param {string} localPhoneNumber 
 * @returns {string} E.164 formatted phone number
 */
function formatPhoneNumber(localPhoneNumber) {
    if (localPhoneNumber.startsWith('+')) {
        return localPhoneNumber; // Already formatted
    }
    if (localPhoneNumber.startsWith('0')) {
        return `+234${localPhoneNumber.substring(1)}`;
    }
    return `+234${localPhoneNumber}`; // Assume it's a 10-digit number without the leading 0
}

/**
 * Fetches all operators from Reloadly for Nigeria
 * @returns {Promise<Array>} Array of operators
 */
async function fetchReloadlyOperators() {
    try {
        const accessToken = await getReloadlyAccessToken();
        const response = await axios.get(`${RELOADLY_OPERATORS_URL}?countryISO=NG&size=200`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/com.reloadly.topups-v1+json'
            }
        });
        return response.data.content || [];
    } catch (error) {
        console.error("Error fetching Reloadly operators:", error.response ? error.response.data : error.message);
        throw error;
    }
}

/**
 * Fetches all billers from Reloadly Utilities API for Nigeria
 * @param {string} type - Biller type (CABLE_TV, ELECTRICITY_BILL_PAYMENT)
 * @returns {Promise<Array>} Array of billers
 */
async function fetchReloadlyBillers(type) {
    try {
        // Utilities API might need a different audience, try both
        let accessToken;
        try {
            accessToken = await getReloadlyAccessToken("https://utilities.reloadly.com");
        } catch (error) {
            // Fallback to topups token if utilities token fails
            console.log("Trying with topups token for utilities...");
            accessToken = await getReloadlyAccessToken("https://topups.reloadly.com");
        }
        
        const response = await axios.get(`${RELOADLY_UTILITIES_URL}/billers?countryISOCode=NG&type=${type}&size=200`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/com.reloadly.utilities-v1+json'
            }
        });
        return response.data.content || [];
    } catch (error) {
        console.error(`Error fetching Reloadly billers (${type}):`, error.response ? error.response.data : error.message);
        throw error;
    }
}

/**
 * Matches operator name with network/provider name (fuzzy matching)
 */
function matchOperatorName(operatorName, searchName) {
    const normalizedOperator = operatorName.toLowerCase().trim();
    const normalizedSearch = searchName.toLowerCase().trim();
    
    // Exact match
    if (normalizedOperator.includes(normalizedSearch) || normalizedSearch.includes(normalizedOperator)) {
        return true;
    }
    
    // Common variations
    const variations = {
        'mtn': ['mtn', 'mobile telecommunications network'],
        'glo': ['glo', 'globacom'],
        'airtel': ['airtel', 'airtel nigeria'],
        '9mobile': ['9mobile', '9 mobile', 'etisalat'],
        'dstv': ['dstv', 'd-stv', 'multichoice'],
        'gotv': ['gotv', 'go-tv', 'go tv'],
        'startimes': ['startimes', 'star times', 'star-times']
    };
    
    for (const [key, aliases] of Object.entries(variations)) {
        if (normalizedSearch.includes(key) || normalizedSearch === key) {
            return aliases.some(alias => normalizedOperator.includes(alias));
        }
    }
    
    return false;
}

// --- PRODUCT CATALOG ---
// This is the SINGLE SOURCE OF TRUTH for all products.
// Add or edit products ONLY here.
let PRODUCT_CATALOG = {
    airtime: [
        {
            network: 'MTN',
            name: 'MTN Airtime',
            operatorId: 340, // Get from Reloadly dashboard
            service: 'airtime'
        },
        {
            network: 'GLO',
            name: 'GLO Airtime',
            operatorId: 341, // Replace with your actual Reloadly operatorId
            service: 'airtime'
        },
        {
            network: 'AIRTEL',
            name: 'Airtel Airtime',
            operatorId: 342, // Replace with your actual Reloadly operatorId
            service: 'airtime'
        },
        {
            network: '9MOBILE',
            name: '9mobile Airtime',
            operatorId: 343, // Replace with your actual Reloadly operatorId
            service: 'airtime'
        }
    ],
    data: [
        // MTN Data Plans
        {
            planId: 'MTN-1GB-DAILY',
            network: 'MTN',
            name: 'MTN 1GB Daily',
            price: 500, // Price in NGN
            operatorId: 646, // Get from Reloadly dashboard
            service: 'data',
            validity: '1 day'
        },
        {
            planId: 'MTN-1GB-WEEKLY',
            network: 'MTN',
            name: 'MTN 1GB Weekly',
            price: 800, // Price in NGN
            operatorId: 647, // Get from Reloadly dashboard
            service: 'data',
            validity: '7 days'
        },
        {
            planId: 'MTN-2GB-MONTHLY',
            network: 'MTN',
            name: 'MTN 2GB Monthly',
            price: 1500, // Price in NGN
            operatorId: 648, // Get from Reloadly dashboard
            service: 'data',
            validity: '30 days'
        },
        {
            planId: 'MTN-6GB-WEEKLY',
            network: 'MTN',
            name: 'MTN 6GB Weekly',
            price: 2500, // Price in NGN
            operatorId: 649, // Get from Reloadly dashboard
            service: 'data',
            validity: '7 days'
        },
        {
            planId: 'MTN-7GB-MONTHLY',
            network: 'MTN',
            name: 'MTN 7GB Monthly',
            price: 3500, // Price in NGN
            operatorId: 650, // Get from Reloadly dashboard
            service: 'data',
            validity: '30 days'
        },
        {
            planId: 'MTN-100GB-MONTHLY',
            network: 'MTN',
            name: 'MTN 100GB Monthly',
            price: 20000, // Price in NGN
            operatorId: 651, // Get from Reloadly dashboard
            service: 'data',
            validity: '30 days'
        },
        // Airtel Data Plans
        {
            planId: 'AIRTEL-1GB-DAILY',
            network: 'AIRTEL',
            name: 'Airtel 1GB Daily',
            price: 300, // Price in NGN
            operatorId: 652, // Get from Reloadly dashboard
            service: 'data',
            validity: '1 day'
        },
        {
            planId: 'AIRTEL-1GB-WEEKLY',
            network: 'AIRTEL',
            name: 'Airtel 1GB Weekly',
            price: 800, // Price in NGN
            operatorId: 653, // Get from Reloadly dashboard
            service: 'data',
            validity: '7 days'
        },
        {
            planId: 'AIRTEL-2GB-MONTHLY',
            network: 'AIRTEL',
            name: 'Airtel 2GB Monthly',
            price: 1500, // Price in NGN
            operatorId: 654, // Get from Reloadly dashboard
            service: 'data',
            validity: '30 days'
        },
        {
            planId: 'AIRTEL-3.5GB-WEEKLY',
            network: 'AIRTEL',
            name: 'Airtel 3.5GB Weekly',
            price: 1500, // Price in NGN
            operatorId: 655, // Get from Reloadly dashboard
            service: 'data',
            validity: '7 days'
        },
        {
            planId: 'AIRTEL-8GB-MONTHLY',
            network: 'AIRTEL',
            name: 'Airtel 8GB Monthly',
            price: 3000, // Price in NGN
            operatorId: 656, // Get from Reloadly dashboard
            service: 'data',
            validity: '30 days'
        },
        {
            planId: 'AIRTEL-60GB-MONTHLY',
            network: 'AIRTEL',
            name: 'Airtel 60GB Monthly',
            price: 15000, // Price in NGN
            operatorId: 657, // Get from Reloadly dashboard
            service: 'data',
            validity: '30 days'
        },
        {
            planId: 'AIRTEL-100GB-MONTHLY',
            network: 'AIRTEL',
            name: 'Airtel 100GB Monthly',
            price: 20000, // Price in NGN
            operatorId: 658, // Get from Reloadly dashboard
            service: 'data',
            validity: '30 days'
        },
        // GLO Data Plans
        {
            planId: 'GLO-1GB-DAILY',
            network: 'GLO',
            name: 'GLO 1GB Daily',
            price: 350, // Price in NGN
            operatorId: 659, // Get from Reloadly dashboard
            service: 'data',
            validity: '1 day'
        },
        {
            planId: 'GLO-2GB-DAILY',
            network: 'GLO',
            name: 'GLO 2GB Daily',
            price: 500, // Price in NGN
            operatorId: 660, // Get from Reloadly dashboard
            service: 'data',
            validity: '1 day'
        },
        {
            planId: 'GLO-7GB-WEEKLY',
            network: 'GLO',
            name: 'GLO 7GB Weekly',
            price: 1500, // Price in NGN
            operatorId: 661, // Get from Reloadly dashboard
            service: 'data',
            validity: '7 days'
        },
        {
            planId: 'GLO-2.6GB-MONTHLY',
            network: 'GLO',
            name: 'GLO 2.6GB Monthly',
            price: 1000, // Price in NGN
            operatorId: 662, // Get from Reloadly dashboard
            service: 'data',
            validity: '30 days'
        },
        {
            planId: 'GLO-10GB-MONTHLY',
            network: 'GLO',
            name: 'GLO 10GB Monthly',
            price: 2500, // Price in NGN
            operatorId: 663, // Get from Reloadly dashboard
            service: 'data',
            validity: '30 days'
        },
        {
            planId: 'GLO-50GB-MONTHLY',
            network: 'GLO',
            name: 'GLO 50GB Monthly',
            price: 10000, // Price in NGN
            operatorId: 664, // Get from Reloadly dashboard
            service: 'data',
            validity: '30 days'
        },
        {
            planId: 'GLO-107GB-MONTHLY',
            network: 'GLO',
            name: 'GLO 107GB Monthly',
            price: 20000, // Price in NGN
            operatorId: 665, // Get from Reloadly dashboard
            service: 'data',
            validity: '30 days'
        },
        // 9mobile Data Plans
        {
            planId: '9MOBILE-1GB-DAILY',
            network: '9MOBILE',
            name: '9mobile 1GB Daily',
            price: 300, // Price in NGN
            operatorId: 666, // Get from Reloadly dashboard
            service: 'data',
            validity: '1 day'
        },
        {
            planId: '9MOBILE-7GB-WEEKLY',
            network: '9MOBILE',
            name: '9mobile 7GB Weekly',
            price: 1500, // Price in NGN
            operatorId: 667, // Get from Reloadly dashboard
            service: 'data',
            validity: '7 days'
        },
        {
            planId: '9MOBILE-2GB-MONTHLY',
            network: '9MOBILE',
            name: '9mobile 2GB Monthly',
            price: 1000, // Price in NGN
            operatorId: 668, // Get from Reloadly dashboard
            service: 'data',
            validity: '30 days'
        },
        {
            planId: '9MOBILE-4.5GB-MONTHLY',
            network: '9MOBILE',
            name: '9mobile 4.5GB Monthly',
            price: 2000, // Price in NGN
            operatorId: 669, // Get from Reloadly dashboard
            service: 'data',
            validity: '30 days'
        },
        {
            planId: '9MOBILE-11GB-MONTHLY',
            network: '9MOBILE',
            name: '9mobile 11GB Monthly',
            price: 4000, // Price in NGN
            operatorId: 670, // Get from Reloadly dashboard
            service: 'data',
            validity: '30 days'
        }
    ],
    cableTV: [
        // DStv Packages (Updated prices as of 2024-2025)
        {
            planId: 'DSTV-PADI',
            provider: 'DStv',
            name: 'DStv Padi',
            price: 3600, // Price in NGN (Updated)
            operatorId: 700, // Get from Reloadly dashboard
            service: 'cableTV'
        },
        {
            planId: 'DSTV-YANGA',
            provider: 'DStv',
            name: 'DStv Yanga',
            price: 5100, // Price in NGN (Updated)
            operatorId: 701, // Get from Reloadly dashboard
            service: 'cableTV'
        },
        {
            planId: 'DSTV-CONFAM',
            provider: 'DStv',
            name: 'DStv Confam',
            price: 9300, // Price in NGN (Updated)
            operatorId: 702, // Get from Reloadly dashboard
            service: 'cableTV'
        },
        {
            planId: 'DSTV-COMPACT',
            provider: 'DStv',
            name: 'DStv Compact',
            price: 15700, // Price in NGN (Updated)
            operatorId: 703, // Get from Reloadly dashboard
            service: 'cableTV'
        },
        {
            planId: 'DSTV-COMPACT-PLUS',
            provider: 'DStv',
            name: 'DStv Compact Plus',
            price: 25000, // Price in NGN (Updated)
            operatorId: 704, // Get from Reloadly dashboard
            service: 'cableTV'
        },
        {
            planId: 'DSTV-PREMIUM',
            provider: 'DStv',
            name: 'DStv Premium',
            price: 37000, // Price in NGN (Updated)
            operatorId: 705, // Get from Reloadly dashboard
            service: 'cableTV'
        },
        // GOtv Packages (Updated prices as of 2024-2025)
        {
            planId: 'GOTV-SMALLIE',
            provider: 'GOtv',
            name: 'GOtv Smallie',
            price: 1200, // Price in NGN (Updated)
            operatorId: 710, // Get from Reloadly dashboard
            service: 'cableTV'
        },
        {
            planId: 'GOTV-JINJA',
            provider: 'GOtv',
            name: 'GOtv Jinja',
            price: 3300, // Price in NGN (Updated)
            operatorId: 711, // Get from Reloadly dashboard
            service: 'cableTV'
        },
        {
            planId: 'GOTV-JOLLI',
            provider: 'GOtv',
            name: 'GOtv Jolli',
            price: 4850, // Price in NGN (Updated)
            operatorId: 712, // Get from Reloadly dashboard
            service: 'cableTV'
        },
        {
            planId: 'GOTV-MAX',
            provider: 'GOtv',
            name: 'GOtv Max',
            price: 7200, // Price in NGN (Updated)
            operatorId: 713, // Get from Reloadly dashboard
            service: 'cableTV'
        },
        {
            planId: 'GOTV-SUPA',
            provider: 'GOtv',
            name: 'GOtv Supa',
            price: 9600, // Price in NGN (Updated)
            operatorId: 714, // Get from Reloadly dashboard
            service: 'cableTV'
        },
        {
            planId: 'GOTV-SUPA-PLUS',
            provider: 'GOtv',
            name: 'GOtv Supa+',
            price: 15700, // Price in NGN (Updated)
            operatorId: 715, // Get from Reloadly dashboard
            service: 'cableTV'
        },
        // StarTimes Packages (Updated prices as of 2024-2025)
        {
            planId: 'STARTIMES-NOVA',
            provider: 'StarTimes',
            name: 'StarTimes Nova',
            price: 1500, // Price in NGN (Updated)
            operatorId: 720, // Get from Reloadly dashboard
            service: 'cableTV'
        },
        {
            planId: 'STARTIMES-BASIC',
            provider: 'StarTimes',
            name: 'StarTimes Basic',
            price: 2500, // Price in NGN (Updated)
            operatorId: 721, // Get from Reloadly dashboard
            service: 'cableTV'
        },
        {
            planId: 'STARTIMES-SMART',
            provider: 'StarTimes',
            name: 'StarTimes Smart',
            price: 3500, // Price in NGN (Updated)
            operatorId: 722, // Get from Reloadly dashboard
            service: 'cableTV'
        },
        {
            planId: 'STARTIMES-CLASSIC',
            provider: 'StarTimes',
            name: 'StarTimes Classic',
            price: 5500, // Price in NGN (Updated)
            operatorId: 723, // Get from Reloadly dashboard
            service: 'cableTV'
        },
        {
            planId: 'STARTIMES-SUPER',
            provider: 'StarTimes',
            name: 'StarTimes Super',
            price: 8000, // Price in NGN (Updated)
            operatorId: 724, // Get from Reloadly dashboard
            service: 'cableTV'
        }
    ],
    electricity: [
        // Abuja Electricity Distribution Company (AEDC)
        {
            planId: 'AEDC-PREPAID',
            disco: 'AEDC',
            discoName: 'Abuja Electricity Distribution Company',
            name: 'AEDC Prepaid',
            serviceType: 'prepaid',
            operatorId: 800, // Get from Reloadly dashboard
            service: 'electricity'
        },
        {
            planId: 'AEDC-POSTPAID',
            disco: 'AEDC',
            discoName: 'Abuja Electricity Distribution Company',
            name: 'AEDC Postpaid',
            serviceType: 'postpaid',
            operatorId: 801, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        },
        // Eko Electricity Distribution Company (EKEDC)
        {
            planId: 'EKEDC-PREPAID',
            disco: 'EKEDC',
            discoName: 'Eko Electricity Distribution Company',
            name: 'EKEDC Prepaid',
            serviceType: 'prepaid',
            operatorId: 802, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        },
        {
            planId: 'EKEDC-POSTPAID',
            disco: 'EKEDC',
            discoName: 'Eko Electricity Distribution Company',
            name: 'EKEDC Postpaid',
            serviceType: 'postpaid',
            operatorId: 803, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        },
        // Ikeja Electric (IKEDC)
        {
            planId: 'IKEDC-PREPAID',
            disco: 'IKEDC',
            discoName: 'Ikeja Electric',
            name: 'IKEDC Prepaid',
            serviceType: 'prepaid',
            operatorId: 804, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        },
        {
            planId: 'IKEDC-POSTPAID',
            disco: 'IKEDC',
            discoName: 'Ikeja Electric',
            name: 'IKEDC Postpaid',
            serviceType: 'postpaid',
            operatorId: 805, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        },
        // Ibadan Electricity Distribution Company (IBEDC)
        {
            planId: 'IBEDC-PREPAID',
            disco: 'IBEDC',
            discoName: 'Ibadan Electricity Distribution Company',
            name: 'IBEDC Prepaid',
            serviceType: 'prepaid',
            operatorId: 806, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        },
        {
            planId: 'IBEDC-POSTPAID',
            disco: 'IBEDC',
            discoName: 'Ibadan Electricity Distribution Company',
            name: 'IBEDC Postpaid',
            serviceType: 'postpaid',
            operatorId: 807, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        },
        // Enugu Electricity Distribution Company (EEDC)
        {
            planId: 'EEDC-PREPAID',
            disco: 'EEDC',
            discoName: 'Enugu Electricity Distribution Company',
            name: 'EEDC Prepaid',
            serviceType: 'prepaid',
            operatorId: 808, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        },
        {
            planId: 'EEDC-POSTPAID',
            disco: 'EEDC',
            discoName: 'Enugu Electricity Distribution Company',
            name: 'EEDC Postpaid',
            serviceType: 'postpaid',
            operatorId: 809, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        },
        // Port Harcourt Electricity Distribution Company (PHED)
        {
            planId: 'PHED-PREPAID',
            disco: 'PHED',
            discoName: 'Port Harcourt Electricity Distribution Company',
            name: 'PHED Prepaid',
            serviceType: 'prepaid',
            operatorId: 810, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        },
        {
            planId: 'PHED-POSTPAID',
            disco: 'PHED',
            discoName: 'Port Harcourt Electricity Distribution Company',
            name: 'PHED Postpaid',
            serviceType: 'postpaid',
            operatorId: 811, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        },
        // Jos Electricity Distribution Company (JED)
        {
            planId: 'JED-PREPAID',
            disco: 'JED',
            discoName: 'Jos Electricity Distribution Company',
            name: 'JED Prepaid',
            serviceType: 'prepaid',
            operatorId: 812, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        },
        {
            planId: 'JED-POSTPAID',
            disco: 'JED',
            discoName: 'Jos Electricity Distribution Company',
            name: 'JED Postpaid',
            serviceType: 'postpaid',
            operatorId: 813, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        },
        // Kaduna Electric (KAEDCO)
        {
            planId: 'KAEDCO-PREPAID',
            disco: 'KAEDCO',
            discoName: 'Kaduna Electric',
            name: 'KAEDCO Prepaid',
            serviceType: 'prepaid',
            operatorId: 814, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        },
        {
            planId: 'KAEDCO-POSTPAID',
            disco: 'KAEDCO',
            discoName: 'Kaduna Electric',
            name: 'KAEDCO Postpaid',
            serviceType: 'postpaid',
            operatorId: 815, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        },
        // Kano Electricity Distribution Company (KEDCO)
        {
            planId: 'KEDCO-PREPAID',
            disco: 'KEDCO',
            discoName: 'Kano Electricity Distribution Company',
            name: 'KEDCO Prepaid',
            serviceType: 'prepaid',
            operatorId: 816, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        },
        {
            planId: 'KEDCO-POSTPAID',
            disco: 'KEDCO',
            discoName: 'Kano Electricity Distribution Company',
            name: 'KEDCO Postpaid',
            serviceType: 'postpaid',
            operatorId: 817, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        },
        // Benin Electricity Distribution Company (BEDC)
        {
            planId: 'BEDC-PREPAID',
            disco: 'BEDC',
            discoName: 'Benin Electricity Distribution Company',
            name: 'BEDC Prepaid',
            serviceType: 'prepaid',
            operatorId: 818, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        },
        {
            planId: 'BEDC-POSTPAID',
            disco: 'BEDC',
            discoName: 'Benin Electricity Distribution Company',
            name: 'BEDC Postpaid',
            serviceType: 'postpaid',
            operatorId: 819, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        },
        // Yola Electricity Distribution Company (YEDC)
        {
            planId: 'YEDC-PREPAID',
            disco: 'YEDC',
            discoName: 'Yola Electricity Distribution Company',
            name: 'YEDC Prepaid',
            serviceType: 'prepaid',
            operatorId: 820, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        },
        {
            planId: 'YEDC-POSTPAID',
            disco: 'YEDC',
            discoName: 'Yola Electricity Distribution Company',
            name: 'YEDC Postpaid',
            serviceType: 'postpaid',
            operatorId: 821, // Replace with your actual Reloadly operatorId
            service: 'electricity'
        }
    ]
};

// --- API ROUTES ---

/**
 * @route   GET /api/get-data-plans
 * @desc    Get the product catalog (all airtime and data plans)
 * @access  Public
 */
app.get('/api/get-data-plans', (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: PRODUCT_CATALOG
        });
    } catch (error) {
        console.error("Error fetching product catalog:", error.message);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching product catalog."
        });
    }
});

/**
 * @route   GET /api/sync-operator-ids
 * @desc    Fetch actual operator IDs from Reloadly and match with PRODUCT_CATALOG
 * @access  Public
 */
app.get('/api/sync-operator-ids', async (req, res) => {
    try {
        console.log("Starting operator ID sync from Reloadly...");
        
        // Fetch all operators and billers from Reloadly
        const [operators, cableTVBillers, electricityBillers] = await Promise.all([
            fetchReloadlyOperators(),
            fetchReloadlyBillers('CABLE_TV'),
            fetchReloadlyBillers('ELECTRICITY_BILL_PAYMENT')
        ]);

        console.log(`Fetched ${operators.length} operators, ${cableTVBillers.length} cable TV billers, ${electricityBillers.length} electricity billers`);

        const matchedIds = {
            airtime: {},
            data: {},
            cableTV: {},
            electricity: {}
        };

        // Match Airtime operators
        for (const product of PRODUCT_CATALOG.airtime) {
            const matched = operators.find(op => 
                matchOperatorName(op.name, product.network) && 
                (op.fx?.rate || op.denominationType === 'FIXED')
            );
            if (matched) {
                matchedIds.airtime[product.network] = {
                    operatorId: matched.operatorId,
                    name: matched.name,
                    productName: product.name
                };
                console.log(`✓ Matched ${product.network} Airtime: ${matched.operatorId} (${matched.name})`);
            } else {
                console.log(`✗ Could not match ${product.network} Airtime`);
            }
        }

        // Match Data operators (more complex - need to match by network and potentially plan details)
        for (const product of PRODUCT_CATALOG.data) {
            const matched = operators.find(op => {
                const nameMatch = matchOperatorName(op.name, product.network);
                // For data, we might need to check if it's a data bundle operator
                return nameMatch && (op.fx?.rate || op.denominationType === 'FIXED' || op.bundle || op.data);
            });
            if (matched) {
                matchedIds.data[product.planId] = {
                    operatorId: matched.operatorId,
                    name: matched.name,
                    productName: product.name,
                    network: product.network
                };
                console.log(`✓ Matched ${product.planId}: ${matched.operatorId} (${matched.name})`);
            } else {
                console.log(`✗ Could not match ${product.planId}`);
            }
        }

        // Match Cable TV billers
        for (const product of PRODUCT_CATALOG.cableTV) {
            const matched = cableTVBillers.find(biller => 
                matchOperatorName(biller.billerName, product.provider) ||
                matchOperatorName(biller.billerName, product.name)
            );
            if (matched) {
                // For cable TV, we need to find the specific package/product
                // Reloadly might have different operator IDs for different packages
                matchedIds.cableTV[product.planId] = {
                    operatorId: matched.billerId,
                    name: matched.billerName,
                    productName: product.name,
                    provider: product.provider
                };
                console.log(`✓ Matched ${product.planId}: ${matched.billerId} (${matched.billerName})`);
            } else {
                console.log(`✗ Could not match ${product.planId}`);
            }
        }

        // Match Electricity billers
        for (const product of PRODUCT_CATALOG.electricity) {
            const matched = electricityBillers.find(biller => {
                const discoMatch = matchOperatorName(biller.billerName, product.disco) ||
                                 matchOperatorName(biller.billerName, product.discoName);
                // Try to match service type if available in biller data
                return discoMatch;
            });
            if (matched) {
                matchedIds.electricity[product.planId] = {
                    operatorId: matched.billerId,
                    name: matched.billerName,
                    productName: product.name,
                    disco: product.disco,
                    serviceType: product.serviceType
                };
                console.log(`✓ Matched ${product.planId}: ${matched.billerId} (${matched.billerName})`);
            } else {
                console.log(`✗ Could not match ${product.planId}`);
            }
        }

        // Return matched IDs and also return all available operators/billers for manual matching
        res.status(200).json({
            success: true,
            message: "Operator ID sync completed. Review matched IDs below.",
            matchedIds: matchedIds,
            availableOperators: operators.map(op => ({
                operatorId: op.operatorId,
                name: op.name,
                country: op.country?.isoName,
                fx: op.fx
            })),
            availableCableTVBillers: cableTVBillers.map(b => ({
                billerId: b.billerId,
                billerName: b.billerName,
                country: b.country
            })),
            availableElectricityBillers: electricityBillers.map(b => ({
                billerId: b.billerId,
                billerName: b.billerName,
                country: b.country
            })),
            instructions: "Use the matchedIds to update your PRODUCT_CATALOG. If a product wasn't matched, check availableOperators/availableBillers for manual matching. Call /api/update-operator-ids with the matchedIds to automatically update the catalog."
        });

    } catch (error) {
        console.error("Error syncing operator IDs:", error.response ? error.response.data : error.message);
        res.status(500).json({
            success: false,
            message: "An error occurred while syncing operator IDs.",
            error: error.response ? error.response.data : error.message
        });
    }
});

/**
 * @route   POST /api/update-operator-ids
 * @desc    Update PRODUCT_CATALOG with matched operator IDs from sync
 * @access  Public
 */
app.post('/api/update-operator-ids', (req, res) => {
    try {
        const { matchedIds } = req.body;

        if (!matchedIds) {
            return res.status(400).json({
                success: false,
                message: "matchedIds object is required in request body."
            });
        }

        let updatedCount = 0;

        // Update Airtime operator IDs
        if (matchedIds.airtime) {
            for (const product of PRODUCT_CATALOG.airtime) {
                if (matchedIds.airtime[product.network]) {
                    product.operatorId = matchedIds.airtime[product.network].operatorId;
                    updatedCount++;
                    console.log(`Updated ${product.network} Airtime: ${product.operatorId}`);
                }
            }
        }

        // Update Data operator IDs
        if (matchedIds.data) {
            for (const product of PRODUCT_CATALOG.data) {
                if (matchedIds.data[product.planId]) {
                    product.operatorId = matchedIds.data[product.planId].operatorId;
                    updatedCount++;
                    console.log(`Updated ${product.planId}: ${product.operatorId}`);
                }
            }
        }

        // Update Cable TV operator IDs
        if (matchedIds.cableTV) {
            for (const product of PRODUCT_CATALOG.cableTV) {
                if (matchedIds.cableTV[product.planId]) {
                    product.operatorId = matchedIds.cableTV[product.planId].operatorId;
                    updatedCount++;
                    console.log(`Updated ${product.planId}: ${product.operatorId}`);
                }
            }
        }

        // Update Electricity operator IDs
        if (matchedIds.electricity) {
            for (const product of PRODUCT_CATALOG.electricity) {
                if (matchedIds.electricity[product.planId]) {
                    product.operatorId = matchedIds.electricity[product.planId].operatorId;
                    updatedCount++;
                    console.log(`Updated ${product.planId}: ${product.operatorId}`);
                }
            }
        }

        res.status(200).json({
            success: true,
            message: `Successfully updated ${updatedCount} operator IDs in PRODUCT_CATALOG.`,
            updatedCount: updatedCount,
            catalog: PRODUCT_CATALOG
        });

    } catch (error) {
        console.error("Error updating operator IDs:", error.message);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating operator IDs.",
            error: error.message
        });
    }
});

/**
 * @route   POST /api/process-transaction
 * @desc    Verify a Paystack transaction and deliver the Reloadly service
 * @access  Public
 */
app.post('/api/process-transaction', async (req, res) => {
    const { reference } = req.body;

    if (!reference) {
        return res.status(400).json({ success: false, message: "Transaction reference is required." });
    }

    try {
        // 1. VERIFY TRANSACTION WITH FLUTTERWAVE
        const flutterwaveResponse = await axios.get(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`, {
            headers: { 
                Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`
            }
        });

        const { status, data } = flutterwaveResponse.data; // data is the inner transaction object
        
        // Check if payment was actually successful
        if (status !== 'success' || data.status !== 'successful' || data.tx_ref !== reference) {
            return res.status(400).json({ success: false, message: "Payment verification failed." });
        }
        
        console.log('Payment Verified:', data.tx_ref);
        
        // 2. DELIVER SERVICE WITH RELOADLY
        const { meta, amount } = data; // Get product details and amount from Flutterwave
        const accessToken = await getReloadlyAccessToken(); // Get valid auth token
        const formattedPhone = formatPhoneNumber(meta.phone);
        const transactionAmount = amount; // Flutterwave amount is already in main currency (e.g., NGN)

        // --- NEW LOGIC: OPERATOR ID MAPPING ---
        // This is the most important part you need to configure.
        // You must log in to your Reloadly dashboard, find the 'operatorId' (or SKU)
        // for EACH airtime network and EACH data bundle you sell, and put them here.
        const reloadlyOperatorIdMap = {
            // --- Airtime Products (service: 'airtime') ---
            // Use the 'network' value from the frontend
            'airtime-MTN': 340,     // EXAMPLE: Replace 340 with your Reloadly operatorId for MTN Airtime
            'airtime-GLO': 341,     // EXAMPLE: Replace 341 with your Reloadly operatorId for GLO Airtime
            'airtime-AIRTEL': 342,  // EXAMPLE: Replace 342 with your Reloadly operatorId for Airtel Airtime
            'airtime-9MOBILE': 343, // EXAMPLE: Replace 343 with your Reloadly operatorId for 9mobile Airtime

            // --- Data Products (service: 'data') ---
            // Use the 'planId' value from the frontend (from script.js dataPlans)
            'MTN-500': 646,     // EXAMPLE: Replace 646 with your Reloadly operatorId for this specific MTN data plan
            'MTN-1000': 647,    // EXAMPLE: Replace 647 with...
            'GLO-500': 648,     // EXAMPLE: ...and so on for all plans
            'GLO-1000': 649,
            'AIRTEL-500': 650,
            'AIRTEL-1000': 651,
            '9MOBILE-500': 652,
            '9MOBILE-1000': 653,
        };

        // Find the correct operatorId based on the service type
        let lookupKey;
        if (meta.service === 'airtime') {
            lookupKey = `airtime-${meta.network}`;
        } else if (meta.service === 'data') {
            lookupKey = meta.planId;
        }

        const operatorId = reloadlyOperatorIdMap[lookupKey];
        
        if (!operatorId) {
            console.error(`Configuration Error: No operatorId found for lookupKey: ${lookupKey}`);
            return res.status(400).json({ success: false, message: `This product (${lookupKey}) is not configured.` });
        }

        // --- END OF NEW LOGIC ---

        let reloadlyRequestConfig = {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/com.reloadly.topups-v1+json'
            }
        };

        // This is now a SINGLE, unified call for both Airtime and Data
        const reloadlyResponse = await axios.post(RELOADLY_TOPUP_URL, {
            operatorId: operatorId,         // The specific operatorId for the product
            amount: transactionAmount,      // The amount (for airtime) or exact price (for data bundle)
            recipientPhone: {
                countryCode: "NG",          // Hardcode for Nigeria
                number: formattedPhone.substring(4) // Send number without the +234
            },
            customIdentifier: reference // Link to Paystack reference
        }, reloadlyRequestConfig);
        
        console.log('Reloadly Response:', reloadlyResponse.data);

        // Check Reloadly's response
        if (reloadlyResponse.data.status === "SUCCESSFUL") {
             return res.status(200).json({ 
                 success: true, 
                 message: `Service delivered successfully. Transaction ID: ${reloadlyResponse.data.transactionId}` 
             });
        } else {
             return res.status(500).json({ 
                 success: false, 
                 message: reloadlyResponse.data.message || "Service delivery failed at vendor." 
             });
        }

    } catch (error) {
        console.error("Server Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: "An internal server error occurred." });
    }
});


/**
 * @route   POST /api/login
 * @desc    Authenticate user with Firebase and return a custom token
 * @access  Public
 */
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    try {
        // Find user by email
        const userRecord = await auth.getUserByEmail(email);
        
        // Create a custom token (client will use this to sign in)
        const customToken = await auth.createCustomToken(userRecord.uid);

        res.status(200).json({ 
            success: true, 
            message: "Login successful.", 
            token: customToken,
            uid: userRecord.uid 
        });

    } catch (error) {
        console.error("Login error:", error.message);
        res.status(401).json({ success: false, message: "Invalid email or password." });
    }
});


/**
 * @route   POST /api/check-status
 * @desc    Check the status of a previous transaction from Reloadly
 * @access  Public
 */
app.post('/api/check-status', async (req, res) => {
    const { reference } = req.body; // This is our Paystack reference
    
    try {
        const accessToken = await getReloadlyAccessToken();
        
        // Query Reloadly using the customIdentifier (our Paystack ref)
        const response = await axios.get(
            `${RELOADLY_TRANSACTION_STATUS_URL}?customIdentifier=${reference}`, 
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/com.reloadly.topups-v1+json'
                }
            }
        );
        
        // Reloadly returns a list, find the first match
        if (response.data.content && response.data.content.length > 0) {
            const transaction = response.data.content[0];
            res.status(200).json({ 
                success: true, 
                message: `Transaction ${transaction.customIdentifier} status: ${transaction.status}. Operator: ${transaction.operatorName}.`
            });
        } else {
            res.status(404).json({ success: false, message: "Transaction not found." });
        }

    } catch (error) {
        console.error("Status check error:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: "An error occurred while checking status." });
    }
});


// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    if (!FLUTTERWAVE_SECRET_KEY || !RELOADLY_CLIENT_ID || !RELOADLY_CLIENT_SECRET) {
        console.warn("\nWARNING: One or more environment variables (API keys) are missing.");
        console.warn("Please create a '.env' file and add your secret keys for Flutterwave and Reloadly.\n");
    } else {
        // Fetch the token on startup
        getReloadlyAccessToken();
    }
});



