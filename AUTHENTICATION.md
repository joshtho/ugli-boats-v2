# UgliBoats Admin Authentication

> **Never put real secrets in this file.** It is committed to a public repo.
> Real values live only in `server/.env` (gitignored) and in Render's environment settings.

## Single-Session Security

Only ONE person can be logged into the admin portal at a time.

- **First login**: admin enters password → gets a valid session token
- **Second login attempt** while a session is active → `"Admin already logged in"` error
- **Original admin stays logged in**: their session is uninterrupted
- **Automatic expiry**: after 24 hours, new logins are allowed again
- **Manual logout**: admin can log out to immediately allow a new login

The active token is held in server memory, so a server restart (including a Render redeploy) clears it.

### Backend
- **Password hashing**: bcryptjs, 12 salt rounds
- **JWT tokens**: 24-hour expiration
- **Protected routes**: all admin endpoints require a valid JWT
- **Brute-force slowdown**: 1-second delay on failed login attempts
- **Secrets**: read from environment variables only

### Frontend
- **Token storage**: JWT in `localStorage`, cleared on logout/expiry
- **Auto-logout**: invalid/expired tokens redirect to login
- **Route protection**: all admin functionality requires authentication
- **Session check**: token verified on page load

## Environment Variables

Add these to `server/.env` locally and to the Render service's environment:

```bash
# Secure hashed password (required) — generate with scripts/hashPassword.js
ADMIN_PASSWORD_HASH=<bcrypt-hash>

# JWT signing secret (required) — 32+ random characters
JWT_SECRET=<random-32+-char-string>

# Server config
PORT=3001
```

See `server/.env.example` for the full list (MongoDB, Cloudinary, Resend, etc.).

## Generating / Rotating Secrets

```bash
# New password hash
cd server
node scripts/hashPassword.js

# New JWT secret
openssl rand -hex 32
```

After rotating either value:
1. Update `server/.env` locally
2. Update the Render environment variable (the service restarts automatically)
3. All existing admin sessions are invalidated

## Endpoints

### Protected (require `Authorization: Bearer <token>`)
- `POST /api/photos/upload`
- `PUT /api/photos/:id`
- `DELETE /api/photos/:id`
- `PUT /api/builds/:id`
- `DELETE /api/builds/:id`
- `POST /api/admin/upload`
- `GET /api/submissions`
- `POST /api/submissions/:id/approve`
- `PUT /api/submissions/:id`
- `POST /api/submissions/:id/reject`
- `POST /api/interesting`
- `PUT /api/interesting/:id`
- `DELETE /api/interesting/:id`

### Public
- `GET /api/photos`
- `GET /api/photos/:category`
- `GET /api/builds`
- `GET /api/interesting`
- `POST /api/builds` (submission form)
- `POST /api/submissions` (submission form)
- `POST /api/auth/login`, `/api/auth/verify`, `/api/auth/logout`

## Testing Locally

```bash
# Login (should succeed with the correct password)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"<your-admin-password>"}'

# Wrong password (should fail)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"wrong"}'

# Protected route without token (should return "Access denied. No token provided.")
curl -X POST http://localhost:3001/api/photos/upload
```

## Admin Usage

1. Go to `/#/admin`
2. Enter the admin password
3. Token is valid for 24 hours
4. Auto-logout on token expiration
5. Logout button available in the dashboard
