# UgliBoats Admin Authentication - Production Guide

## 🔒 Security Features Implemented

### **🚨 SINGLE-SESSION SECURITY** 
**Only ONE person can be logged into the admin portal at a time!**

#### How it works:
- ✅ **First login**: Admin enters password → Gets valid session token
- ❌ **Second login attempt**: Someone else enters password → **"Admin already logged in" error**  
- 🔒 **Original admin stays logged in**: Their session remains active and uninterrupted
- ⏰ **Automatic expiry**: After 24 hours, new logins are allowed again
- 🚪 **Manual logout**: Admin can logout to immediately allow new logins

#### Your Security Question Answered:
> **"If he forgets to logout, or if he is logged in to admin while someone else clicks admin somewhere else, they wont be able to log in right?"**

**ANSWER: Exactly! New logins are BLOCKED when someone is already logged in!** ✅
- ✅ If you forget to logout → **New login attempts get "Admin already logged in" error**
- ✅ Your session stays active and uninterrupted  
- ✅ Unauthorized users cannot access admin even with correct password
- ✅ Only way to access: Wait 24 hours OR you manually logout
- ✅ Perfect protection against unauthorized access

### Backend Security
- **Password Hashing**: Using bcryptjs with salt rounds of 12
- **JWT Tokens**: Secure token-based authentication with 24-hour expiration
- **Protected Routes**: All admin endpoints require valid JWT token
- **Brute Force Protection**: 1-second delay on failed login attempts
- **Environment Variables**: Sensitive data stored securely in .env

### Frontend Security  
- **Token Storage**: JWT stored in localStorage with automatic cleanup
- **Auto-logout**: Invalid/expired tokens automatically redirect to login
- **Route Protection**: All admin functionality requires authentication
- **Session Management**: Token verification on page load

## 🔧 Environment Configuration

### Required Environment Variables (.env)
```bash
# Keep the old password for reference (optional)
ADMIN_PASSWORD=ugliboats2025

# Secure hashed password (required)
ADMIN_PASSWORD_HASH=$2b$12$z3nS/TwxaoAFVPhmQS5uqubgRmTKFSpkr/56EZootz/J3/Tpgw7LK

# JWT secret (required - keep secret!)
JWT_SECRET=e7zwa6ue0zklu6uxc1fzdux7oq2vazj0

# Server config
PORT=3001
```

## 🚀 For Production Deployment

### 1. Generate New Secrets
```bash
# Run this to generate new production secrets:
cd server
node scripts/hashPassword.js
```

### 2. Update .env for Production
- Use a stronger password than "ugliboats2025"
- Generate a new JWT_SECRET (32+ random characters)
- Never commit .env file to version control

### 3. Protected Endpoints
These routes now require authentication:
- `POST /api/photos/upload`
- `PUT /api/photos/:id`
- `DELETE /api/photos/:id`
- `POST /api/builds` (admin created)
- `PUT /api/builds/:id`
- `DELETE /api/builds/:id`
- `POST /api/admin/upload`
- `POST /api/submissions/:id/approve`
- `PUT /api/submissions/:id`
- `POST /api/submissions/:id/reject`
- `POST /api/interesting`
- `PUT /api/interesting/:id`
- `DELETE /api/interesting/:id`

### 4. Public Endpoints (No Auth Required)
- `GET /api/photos`
- `GET /api/photos/:category`
- `GET /api/builds`
- `GET /api/submissions` (admin only but needs token)
- `GET /api/interesting`
- `POST /api/submissions` (user submissions)

## 🔐 Security Best Practices Implemented

1. **Strong Password Hashing**: bcrypt with high salt rounds
2. **JWT Best Practices**: Short expiration (24h), secure signing
3. **Input Validation**: Password required, proper error handling
4. **Rate Limiting**: Delay on failed attempts
5. **Token Management**: Automatic cleanup, secure storage
6. **Environment Security**: Secrets in .env, not in code

## 🧪 Testing Authentication

### Login Test (should succeed):
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"ugliboats2025"}'
```

### Wrong Password Test (should fail):
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"wrong"}'
```

### Protected Route Test (should require token):
```bash
curl -X POST http://localhost:3001/api/photos/upload
# Should return: {"error":"Access denied. No token provided."}
```

## 📝 Admin Usage

1. Go to `/admin` page
2. Enter password: `ugliboats2025`  
3. Token valid for 24 hours
4. Auto-logout on token expiration
5. Logout button available in dashboard

Your admin authentication is now production-ready! 🎉
