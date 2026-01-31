# Digital-ID Setup Guide

This guide will help you set up and run the Digital-ID system with both backend and frontend-mobile components.

## Prerequisites

- Node.js 18+ and pnpm
- MySQL database server
- Expo CLI (for mobile development)

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory (a template `.env.example` is provided):

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database Configuration
DATABASE_URL=mysql://user:password@localhost:3306/digitalid

# Session Configuration
SESSION_SECRET=your-secret-key-here-change-in-production

# Owner Configuration (Admin User)
OWNER_OPEN_ID=your-admin-open-id

# Server Configuration
PORT=3000
NODE_ENV=development
```

**Important:** Make sure to replace the database credentials with your actual MySQL connection details.

### 3. Initialize Database

Run the database migrations:

```bash
pnpm db:push
```

This will create all necessary tables in your MySQL database.

### 4. Start Backend Server

```bash
pnpm dev
```

The backend server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## Frontend-Mobile Setup

### 1. Install Dependencies

```bash
cd frontend-mobile
npm install
```

### 2. Configure API Endpoint

Create a `.env` file in the `frontend-mobile/` directory:

```bash
cp .env.example .env
```

Edit the `.env` file:

```env
# For local development, use your computer's IP address (not localhost)
# Find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3000

# Replace 192.168.1.100 with your actual local IP address
```

**Important:** 
- Do NOT use `localhost` or `127.0.0.1` - the mobile app needs your computer's network IP
- Make sure your phone and computer are on the same network
- For production, use your deployed backend URL (e.g., `https://id.efimef.org`)

### 3. Start Mobile App

```bash
npx expo start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your physical device

## Common Issues and Solutions

### Issue 1: KYC Submission Fails

**Symptoms:**
- Mobile app shows "Upload Failed" alert
- Backend logs show database errors

**Solutions:**
1. Verify `DATABASE_URL` is correctly configured in `backend/.env`
2. Ensure MySQL server is running
3. Check that database migrations were applied: `pnpm db:push`
4. Check backend logs for detailed error messages

### Issue 2: Mobile App Cannot Connect to Backend

**Symptoms:**
- Network errors in mobile app
- "Unable to submit your registration" message

**Solutions:**
1. Verify `EXPO_PUBLIC_API_BASE_URL` in `frontend-mobile/.env` uses your computer's IP (not localhost)
2. Ensure backend server is running
3. Check that both devices are on the same network
4. Disable firewall temporarily to test
5. Try accessing `http://YOUR_IP:3000` from your phone's browser to verify connectivity

### Issue 3: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- API requests blocked

**Solutions:**
- CORS is now configured in the backend to allow all origins in development mode
- For production, set `ALLOWED_ORIGINS` in `.env` with comma-separated allowed origins

### Issue 4: Database Connection Fails

**Symptoms:**
- "Database connection may not be available" errors
- User creation fails

**Solutions:**
1. Verify MySQL is running: `mysql --version`
2. Test database connection: `mysql -u user -p`
3. Check database exists: `CREATE DATABASE IF NOT EXISTS digitalid;`
4. Verify credentials in `DATABASE_URL`

## Testing KYC Submission

1. Start the backend server
2. Start the mobile app
3. In the mobile app, go to Register/KYC screen
4. Take photos of:
   - National ID front
   - National ID back
   - Selfie with ID
5. Submit the form
6. Check backend logs for processing status
7. Log into the admin dashboard to review pending KYC submissions

## Architecture Overview

### Backend Endpoints

The backend provides multiple endpoints for KYC submission:

**REST Endpoints:**
- `POST /api/kyc/submit`
- `POST /kyc/submit`

**tRPC Endpoint:**
- `auth.submitKYC` (via `/api/trpc` or `/trpc`)

The mobile app tries REST endpoints first, then falls back to tRPC if needed.

### Database Schema

Key tables:
- `users` - User accounts and profile information
- `kycDocuments` - KYC verification documents (images)
- `activityLogs` - System activity audit trail
- `activeSessions` - User login sessions

### Error Handling

The system now includes comprehensive error handling:
- Detailed error messages in responses
- Console logging for debugging
- Validation error details
- Database connection checks

## Development Tips

1. **Check Backend Logs:** Always monitor backend console for detailed error messages
2. **Use Network Inspector:** In Expo, shake device and enable "Debug Remote JS" to see network requests
3. **Test Database:** Verify database connection before testing KYC submission
4. **Clear Cache:** If issues persist, try `npx expo start --clear` for mobile app

## Production Deployment

### Backend

1. Set `NODE_ENV=production` in `.env`
2. Configure `ALLOWED_ORIGINS` with your frontend domain
3. Use strong `SESSION_SECRET`
4. Set up proper database with backups
5. Build: `pnpm build`
6. Start: `pnpm start`

### Frontend-Mobile

1. Update `EXPO_PUBLIC_API_BASE_URL` to production backend URL
2. Build for iOS/Android using EAS Build
3. Submit to App Store/Play Store

## Support

If you encounter issues not covered in this guide:
1. Check backend console logs for detailed error messages
2. Check mobile app console (React Native debugger)
3. Verify all environment variables are set correctly
4. Ensure all dependencies are installed
5. Try restarting both backend and mobile app

## Security Notes

- Never commit `.env` files to version control
- Change default `SESSION_SECRET` in production
- Use HTTPS for production deployments
- Regularly update dependencies
- Implement rate limiting for API endpoints
- Validate and sanitize all user inputs
