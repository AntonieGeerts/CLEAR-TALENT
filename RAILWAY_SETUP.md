# Railway Environment Variables Setup

Your backend is deployed but needs environment variables to function correctly, especially for CORS and database connection.

## Critical Environment Variables

### 1. DATABASE_URL
**Value:** `postgresql://postgres:jnnKwxQbWACNSqedJIzFzcVrnVCWRsSJ@trolley.proxy.rlwy.net:21484/railway`

This connects your backend to the Railway PostgreSQL database.

### 2. CORS_ORIGIN
**Value:** `https://clear-talent.vercel.app,http://localhost:3000,http://localhost:5173`

This allows your Vercel frontend to make API requests to the backend.

### 3. JWT_SECRET
**Value:** `your-super-secret-jwt-key-change-this-in-production`

Used for signing JWT tokens. Change this to a random secure string.

### 4. OPENAI_API_KEY
**Value:** Your OpenAI API key (starts with `sk-proj-...`)

Required for AI features.

## How to Set Environment Variables in Railway

1. **Go to Railway Dashboard:**
   - Visit https://railway.app/dashboard
   - Open your project: CLEAR-TALENT

2. **Select the Backend Service:**
   - Click on your backend service (the one running the Node.js API)

3. **Go to Variables Tab:**
   - Click on "Variables" in the top navigation

4. **Add Each Variable:**
   - Click "+ New Variable"
   - Enter the variable name (e.g., `CORS_ORIGIN`)
   - Enter the value (copy from above)
   - Click "Add"

5. **Railway Will Auto-Redeploy:**
   - After adding/changing variables, Railway automatically redeploys your service
   - Wait 1-2 minutes for the deployment to complete

## Required Variables for Login to Work

At minimum, you need these three:

```
DATABASE_URL=postgresql://postgres:jnnKwxQbWACNSqedJIzFzcVrnVCWRsSJ@trolley.proxy.rlwy.net:21484/railway
CORS_ORIGIN=https://clear-talent.vercel.app,http://localhost:3000,http://localhost:5173
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Testing After Setup

After setting the environment variables, test the login:

1. **Visit:** https://clear-talent.vercel.app/login
2. **Login with:**
   - Email: `admin@demo-org.com`
   - Password: `admin123`

3. **Check Browser Console:**
   - Open DevTools (F12)
   - Check Console for any CORS errors
   - Check Network tab to see API requests

## Troubleshooting

### CORS Errors in Browser Console
- Make sure `CORS_ORIGIN` includes `https://clear-talent.vercel.app`
- Wait 2-3 minutes after setting the variable for Railway to redeploy

### "DATABASE_URL not found" Errors
- Add the `DATABASE_URL` variable exactly as shown above
- The database connection string uses the Railway PostgreSQL proxy

### Login Fails
- Verify database has data: Check the seed was successful
- Check backend logs in Railway dashboard for errors

## Current Deployment Status

- ✅ Backend API: https://clear-talent-production.up.railway.app/api/v1
- ✅ Frontend: https://clear-talent.vercel.app
- ✅ Database: Tables created and seeded with demo data
- ⚠️  **Action Required:** Set environment variables in Railway (especially CORS_ORIGIN and DATABASE_URL)

## Demo Users Created

| Email | Password | Role |
|-------|----------|------|
| admin@demo-org.com | admin123 | Admin |
| hr@demo-org.com | hr123 | HR Manager |
