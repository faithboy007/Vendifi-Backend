# 🚂 Railway Deployment Guide

## Error Fix: `Service account object must contain a string "project_id" property`

This error means Railway doesn't have your environment variables configured.

## ✅ Solution: Configure Environment Variables

### Step 1: Go to Railway Dashboard
1. Visit [railway.app](https://railway.app)
2. Select your project
3. Click on your service
4. Go to **Variables** tab

### Step 2: Add All Environment Variables

Click **"New Variable"** and add each of these:

#### Required Variables:

**1. PORT**
```
PORT
3000
```

**2. FIREBASE_PROJECT_ID**
```
FIREBASE_PROJECT_ID
your-firebase-project-id
```

**3. FIREBASE_PRIVATE_KEY**
```
FIREBASE_PRIVATE_KEY
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
[paste your ENTIRE private key here including BEGIN and END lines]
...
-----END PRIVATE KEY-----
```

⚠️ **IMPORTANT**: 
- Copy the ENTIRE key from your `.env` file
- Include `-----BEGIN PRIVATE KEY-----` at the start
- Include `-----END PRIVATE KEY-----` at the end
- Keep the `\n` characters (Railway handles them automatically)
- Don't add extra quotes

**4. FIREBASE_CLIENT_EMAIL**
```
FIREBASE_CLIENT_EMAIL
firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

**5. FLUTTERWAVE_SECRET_KEY**
```
FLUTTERWAVE_SECRET_KEY
FLWSECK-xxxxxxxxxxxxxxxxxxxxxxxxxx-X
```

**6. RELOADLY_CLIENT_ID**
```
RELOADLY_CLIENT_ID
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**7. RELOADLY_CLIENT_SECRET**
```
RELOADLY_CLIENT_SECRET
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Step 3: Redeploy

After adding all variables:
1. Click **"Deploy"** button
2. Or Railway will automatically redeploy

## 🔍 Verify Deployment

Once deployed, check the logs:

### Good Output:
```
✓ Firebase initialized successfully
✓ Server is running on http://localhost:3000
✓ All required environment variables are configured
✓ Reloadly authentication successful
```

### Bad Output (Missing Variables):
```
⚠️  WARNING: Firebase credentials are missing!
✗ Firebase initialization failed
```

## 📝 How to Get Your Environment Variables

### From Your Local `.env` File:

1. Open your `.env` file locally
2. Copy each value exactly
3. Paste into Railway variables

### Firebase Credentials:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Project Settings > Service Accounts
3. Generate new private key if needed
4. Copy values from the JSON file

### Flutterwave:
1. [Flutterwave Dashboard](https://dashboard.flutterwave.com)
2. Settings > API Keys
3. Copy Secret Key

### Reloadly:
1. [Reloadly Dashboard](https://www.reloadly.com)
2. API section
3. Copy Client ID and Client Secret

## 🐛 Troubleshooting

### Error: "Service account object must contain..."
**Fix**: Make sure ALL Firebase variables are added in Railway

### Error: "Could not authenticate with Reloadly"
**Fix**: Check Reloadly credentials are correct (sandbox vs production)

### Error: "Missing environment variables"
**Fix**: Add all 7 required variables listed above

### Server keeps crashing
**Possible causes:**
1. Missing environment variables
2. Wrong credentials
3. Port already in use (Railway handles this automatically)

**Check Railway logs:**
- Click on your service
- Go to "Deployments" tab
- Click latest deployment
- View logs for errors

## 🔐 Security Notes

✅ Railway environment variables are:
- Encrypted at rest
- Only accessible to your project
- Not visible in logs
- Separate from your code

❌ Never:
- Commit `.env` to GitHub
- Share screenshots of Railway variables
- Expose API keys in client code

## 🚀 Production Checklist

Before going live, make sure:

- [ ] All environment variables configured
- [ ] Using **production** credentials (not sandbox)
- [ ] Firebase project is in production mode
- [ ] Reloadly account is verified
- [ ] Flutterwave account is verified
- [ ] Domain configured (if using custom domain)
- [ ] SSL/HTTPS enabled (Railway does this automatically)

## 📊 Railway-Specific Configuration

### Custom Start Command (if needed):
Railway usually detects this automatically, but you can set:
```
npm start
```

### Health Check:
Railway monitors your app automatically. Your server responds on:
```
http://your-app.railway.app/api/get-data-plans
```

### Auto-Deploy:
Railway automatically deploys when you push to GitHub main branch.

To disable:
1. Service Settings
2. Uncheck "Auto Deploy"

## 💡 Pro Tips

1. **Use Railway CLI** for faster debugging:
   ```bash
   npm i -g @railway/cli
   railway login
   railway logs
   ```

2. **Test locally first**:
   - Make sure `npm start` works locally
   - Fix all errors before deploying

3. **Monitor your deployment**:
   - Check Railway logs regularly
   - Set up alerts for errors

4. **Separate environments**:
   - Create separate Railway projects for:
     - Development
     - Staging
     - Production
   - Use different credentials for each

## 🎯 Quick Fix Checklist

If deployment fails:

1. [ ] Check all 7 environment variables are added
2. [ ] Verify FIREBASE_PRIVATE_KEY format is correct
3. [ ] Check Railway deployment logs
4. [ ] Verify credentials work locally first
5. [ ] Restart deployment manually

## 📞 Need Help?

- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Check deployment logs for specific errors

---

**After fixing, your Railway deployment should work perfectly! 🎉**
