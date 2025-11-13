# Deploy Vendifi Backend to Render

## 🚀 Quick Deploy Steps

### 1. Create Render Account
- Go to https://render.com
- Sign up with GitHub (recommended)

### 2. Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub account
3. Select repository: **faithboy007/Vendifi-Backend**
4. Click **"Connect"**

### 3. Configure Service
Fill in these settings:

**Basic Settings:**
- **Name:** `vendifi-backend` (or any name you want)
- **Region:** Choose closest to Nigeria (e.g., Frankfurt)
- **Branch:** `main`
- **Root Directory:** Leave empty
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`

**Instance Type:**
- Select **Free** (or paid for better performance)

### 4. Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these:

| Key | Value |
|-----|-------|
| `RELOADLY_CLIENT_ID` | `jTObjyPPsiJW2x2F5Sfhh1G4EsS2KYXl` |
| `RELOADLY_CLIENT_SECRET` | `hSRrGxSye0-wQlbnEoVVmwR0oLkvGw-WADIGxw4YAXtev4N54JRJJ1xEHW6WPKw` |
| `FLUTTERWAVE_SECRET_KEY` | Your Flutterwave secret key |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Your Firebase private key |
| `FIREBASE_CLIENT_EMAIL` | Your Firebase client email |

**IMPORTANT for FIREBASE_PRIVATE_KEY:**
- Copy the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep the `\n` characters as-is

### 5. Deploy
- Click **"Create Web Service"**
- Wait 3-5 minutes for deployment
- Render will show you the URL (e.g., `https://vendifi-backend.onrender.com`)

### 6. Update Frontend
Update your frontend `script.js` line 14:
```javascript
const BACKEND_URL = "https://vendifi-backend.onrender.com"; // Your new Render URL
```

### 7. Test
1. Go to: `https://vendifi-backend.onrender.com/api/diagnostic`
2. Should show backend status
3. Try buying ₦100 airtime
4. Airtime should arrive! 🎉

## 🔧 Troubleshooting

### If deployment fails:
1. Check Render logs for errors
2. Verify all environment variables are set
3. Make sure GitHub repo is up to date

### If airtime doesn't send:
1. Check Render logs after a purchase
2. Look for error messages
3. Verify Reloadly credentials are correct

## 💡 Benefits of Render vs Railway
✅ More stable deployments
✅ Better free tier
✅ Clearer error logs
✅ Automatic HTTPS
✅ Better uptime

## 📝 Notes
- Free tier sleeps after 15 min of inactivity
- First request after sleep takes ~30 seconds
- Upgrade to paid ($7/month) for always-on service
