# VENDIFI Backend API

Backend API for VENDIFI - A comprehensive platform for Airtime, Data, Cable TV, and Electricity services in Nigeria, powered by Reloadly and Flutterwave.

## 🚀 Features

- **Airtime Top-up**: MTN, GLO, Airtel, 9mobile
- **Data Bundles**: Multiple data plans across all major networks
- **Cable TV**: DStv, GOtv, StarTimes subscriptions
- **Electricity Bills**: All major DISCOs (AEDC, EKEDC, IKEDC, etc.)
- **Payment Processing**: Flutterwave integration
- **Firebase Authentication**: Secure user authentication
- **Automatic Operator ID Sync**: Smart matching with Reloadly services

## 📋 Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher
- **Reloadly Account**: [Sign up here](https://www.reloadly.com)
- **Flutterwave Account**: [Sign up here](https://flutterwave.com)
- **Firebase Project**: [Create one here](https://console.firebase.google.com)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/faithboy007/Vendifi-Backend.git
   cd "VENDIFI BACKEND"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   PORT=3000

   # Firebase Configuration
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com

   # Flutterwave Configuration
   FLUTTERWAVE_SECRET_KEY=your-flutterwave-secret-key

   # Reloadly Configuration
   RELOADLY_CLIENT_ID=your-reloadly-client-id
   RELOADLY_CLIENT_SECRET=your-reloadly-client-secret
   ```

4. **Start the server**
   ```bash
   npm start
   ```

   The server will display a detailed startup report showing:
   - Environment variable validation
   - Reloadly authentication status
   - Product configuration status
   - Available endpoints

## ⚙️ Configuration

### Operator ID Sync (IMPORTANT!)

The placeholder operator IDs in the code **will not work** with Reloadly. You must sync with real operator IDs:

#### Automatic Sync (Recommended)

1. Start your server:
   ```bash
   npm start
   ```

2. Open your browser or use curl to call:
   ```bash
   GET http://localhost:3000/api/sync-operator-ids
   ```

3. Review the response, which contains:
   - `matchedIds`: Automatically matched operator IDs
   - `availableOperators`: All Reloadly operators for manual matching
   - `availableCableTVBillers`: All cable TV providers
   - `availableElectricityBillers`: All electricity DISCOs

4. Update your catalog with the matched IDs:
   ```bash
   POST http://localhost:3000/api/update-operator-ids
   Content-Type: application/json

   {
     "matchedIds": <paste the matchedIds object from step 3>
   }
   ```

#### Manual Configuration

1. Login to [Reloadly Dashboard](https://www.reloadly.com)
2. Navigate to API documentation
3. Find operator IDs for each service
4. Update `PRODUCT_CATALOG` in `server.js` with real operator IDs
5. Restart the server

## 📡 API Endpoints

### Product Management

- **GET** `/api/get-data-plans`
  - Get all available products (airtime, data, cable TV, electricity)
  - Response: Full product catalog

- **GET** `/api/sync-operator-ids`
  - Fetch real operator IDs from Reloadly and match with your products
  - Response: Matched IDs and available operators/billers

- **POST** `/api/update-operator-ids`
  - Update product catalog with matched operator IDs
  - Body: `{ "matchedIds": {...} }`

### Transaction Processing

- **POST** `/api/process-transaction`
  - Verify Flutterwave payment and deliver service via Reloadly
  - Body: `{ "reference": "flutterwave-tx-ref" }`

- **POST** `/api/check-status`
  - Check status of a previous transaction
  - Body: `{ "reference": "flutterwave-tx-ref" }`

### Authentication

- **POST** `/api/login`
  - Verify Firebase authentication token
  - Body: `{ "idToken": "firebase-id-token" }`
  - **Note**: Password verification must be done client-side using Firebase SDK

## 🔐 Security Notes

### Firebase Authentication

**IMPORTANT**: The backend does not handle password verification directly. This is by design for security.

**Correct Authentication Flow:**
1. Client authenticates with Firebase SDK: `signInWithEmailAndPassword(email, password)`
2. Client receives ID token from Firebase
3. Client sends ID token to backend `/api/login` endpoint
4. Backend verifies token and returns user data

**Why?**
- Firebase Admin SDK doesn't support password verification
- Passwords should never be sent to backend in plain text
- Firebase Client SDK handles encryption and secure authentication

## 🐛 Troubleshooting

### Issue: "npm: cannot be loaded because running scripts is disabled"
**Solution**: Use `cmd /c npm install` instead of `npm install` in PowerShell

### Issue: "Configuration Error: Operator ID not configured"
**Solution**: Run the operator ID sync process (see Configuration section above)

### Issue: "Could not authenticate with Reloadly"
**Possible causes**:
- Wrong `RELOADLY_CLIENT_ID` or `RELOADLY_CLIENT_SECRET`
- Using sandbox credentials in production (or vice versa)
- Network connectivity issues

**Solution**: 
- Verify credentials in your Reloadly dashboard
- Check if you're using the correct environment (sandbox vs production)

### Issue: Firebase authentication errors
**Possible causes**:
- Missing or incorrect Firebase credentials in `.env`
- Private key format issues (newlines not properly escaped)

**Solution**:
- Download fresh service account JSON from Firebase Console
- Copy values exactly as shown in `.env.example`
- Ensure private key has `\n` for newlines, not actual line breaks

### Issue: "Payment verification failed"
**Possible causes**:
- Wrong `FLUTTERWAVE_SECRET_KEY`
- Transaction reference doesn't exist
- Transaction not yet completed

**Solution**:
- Verify Flutterwave credentials
- Ensure payment completed successfully on Flutterwave
- Check transaction reference is correct

## 🛠️ Development

### Project Structure
```
VENDIFI BACKEND/
├── server.js           # Main application file
├── package.json        # Dependencies and scripts
├── .env               # Environment variables (not in git)
├── .env.example       # Environment template
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

### Running in Development
```bash
npm run dev
```

### Environment Variables Validation

The server automatically validates all required environment variables on startup and provides clear feedback on what's missing.

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## 🔄 Updates & Maintenance

### Adding New Products

1. Add product to `PRODUCT_CATALOG` in `server.js`
2. Run `/api/sync-operator-ids` to get the operator ID
3. Update catalog with `/api/update-operator-ids`

### Updating Product Prices

Edit the `price` field in `PRODUCT_CATALOG` and restart the server.

## 📞 Support

For issues, questions, or contributions:
- GitHub: [faithboy007/Vendifi-Backend](https://github.com/faithboy007/Vendifi-Backend)
- Open an issue on GitHub

## 📄 License

ISC License - See LICENSE file for details

## 👨‍💻 Author

**faithboy007**

---

**Last Updated**: January 2025
**Version**: 1.0.0
