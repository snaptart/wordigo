# Authentication System Implementation Plan

## Overview
Complete authentication system with email/password and Google OAuth 2.0

## Tech Stack
- **Backend**: Express.js + Passport.js + JWT
- **Frontend**: Next.js + React Context API
- **Database**: PostgreSQL via Prisma
- **Email**: Nodemailer
- **OAuth**: Google OAuth 2.0

## Database Schema Changes

### Users Table (Modified)
```sql
- password: nullable (for OAuth-only users)
+ name: VARCHAR(100)
+ profilePicture: VARCHAR(500)
+ emailVerified: BOOLEAN DEFAULT false
+ verificationToken: VARCHAR(255) UNIQUE
+ resetPasswordToken: VARCHAR(255) UNIQUE
+ resetPasswordExpires: TIMESTAMP
+ lastLogin: TIMESTAMP
```

### New Table: oauth_accounts
```sql
CREATE TABLE oauth_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50), -- 'google', 'facebook', 'apple'
  provider_id VARCHAR(255), -- OAuth provider's user ID
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_id)
);
```

## Backend Implementation

### File Structure
```
wordigo-backend/src/
├── config/
│   ├── jwt.ts              # JWT configuration
│   └── passport.ts         # Passport strategies
├── services/
│   ├── authService.ts      # Core auth logic
│   └── emailService.ts     # Email sending
├── controllers/
│   └── authController.ts   # Auth endpoints
├── middleware/
│   └── auth.ts             # Auth middleware
└── routes/
    └── auth.ts             # Auth routes
```

### API Endpoints

#### Public Endpoints
```
POST   /api/auth/register           - Email/password registration
POST   /api/auth/login              - Email/password login
POST   /api/auth/refresh            - Refresh access token
GET    /api/auth/verify-email/:token - Verify email address
POST   /api/auth/forgot-password    - Request password reset
POST   /api/auth/reset-password     - Reset password with token
GET    /api/auth/google             - Initiate Google OAuth
GET    /api/auth/google/callback    - Google OAuth callback
```

#### Protected Endpoints
```
GET    /api/auth/me                 - Get current user
POST   /api/auth/logout             - Logout (invalidate tokens)
PUT    /api/auth/profile            - Update profile
POST   /api/auth/change-password    - Change password
```

### Token Strategy
- **Access Token**: 15 minutes (JWT)
- **Refresh Token**: 30 days (stored in DB)
- **Remember Me**: 90 days refresh token
- **Storage**: httpOnly cookies + localStorage (fallback)

### Security Features
- Password hashing with bcrypt (10 rounds)
- CSRF protection
- Rate limiting on auth endpoints
- Email verification required
- Secure password reset flow
- OAuth state validation

## Frontend Implementation

### File Structure
```
wordigo-web/src/
├── contexts/
│   └── AuthContext.tsx     # Auth state management
├── components/auth/
│   ├── LoginForm.tsx       # Login UI
│   ├── RegisterForm.tsx    # Registration UI
│   ├── GoogleButton.tsx    # Google OAuth button
│   └── AuthModal.tsx       # Modal wrapper
├── hooks/
│   └── useAuth.tsx         # Auth hook
└── utils/
    └── auth.ts             # Auth utilities
```

### Pages
```
/login                      - Login page
/register                   - Registration page
/verify-email               - Email verification page
/forgot-password            - Password reset request
/reset-password/:token      - Password reset form
/profile                    - User profile (protected)
```

### Auth Flow

#### Email/Password Registration
1. User fills form → POST /api/auth/register
2. Backend creates user, sends verification email
3. User clicks email link → GET /api/auth/verify-email/:token
4. Email verified → user can login

#### Email/Password Login
1. User enters credentials → POST /api/auth/login
2. Backend validates, returns tokens
3. Frontend stores tokens, redirects to app

#### Google OAuth
1. User clicks "Sign in with Google"
2. Redirect to Google consent screen
3. User approves → callback to /api/auth/google/callback
4. Backend creates/links account, returns tokens
5. Frontend stores tokens, redirects to app

#### Token Refresh
1. Access token expires (15 min)
2. Frontend detects 401
3. Automatically calls /api/auth/refresh with refresh token
4. Gets new access token
5. Retries original request

## Environment Variables

### Backend (.env)
```bash
# JWT
JWT_SECRET=your-secret-key-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@wordigo.com

# URLs
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## Google OAuth Setup

### 1. Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Create new project "Wordigo"
3. Enable Google+ API

### 2. Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Create "OAuth 2.0 Client ID"
3. Application type: "Web application"
4. Authorized JavaScript origins:
   - http://localhost:3001
   - https://yourdomain.com
5. Authorized redirect URIs:
   - http://localhost:3000/api/auth/google/callback
   - https://api.yourdomain.com/api/auth/google/callback

### 3. Get Credentials
- Copy Client ID
- Copy Client Secret
- Add to .env files

## Email Setup (Gmail)

### 1. Enable 2-Factor Authentication
- Go to Google Account settings
- Enable 2FA

### 2. Create App Password
- Go to Security → App passwords
- Generate password for "Mail"
- Use this as SMTP_PASS

## Testing Checklist

### Registration Flow
- [ ] Register with valid email
- [ ] Receive verification email
- [ ] Click verification link
- [ ] Email verified successfully
- [ ] Can login after verification

### Login Flow
- [ ] Login with correct credentials
- [ ] Login fails with wrong password
- [ ] Login fails with unverified email
- [ ] "Remember me" extends token expiry
- [ ] Tokens stored securely

### Google OAuth
- [ ] Click "Sign in with Google"
- [ ] Redirect to Google
- [ ] Approve permissions
- [ ] Redirected back to app
- [ ] User logged in
- [ ] Account linked to existing email (if applicable)

### Password Reset
- [ ] Request password reset
- [ ] Receive reset email
- [ ] Click reset link
- [ ] Enter new password
- [ ] Can login with new password

### Token Management
- [ ] Access token expires after 15 min
- [ ] Refresh token auto-renews
- [ ] Logout invalidates tokens
- [ ] Protected routes require auth

### Security
- [ ] Passwords hashed in DB
- [ ] Tokens in httpOnly cookies
- [ ] CSRF protection active
- [ ] Rate limiting works
- [ ] SQL injection prevented
- [ ] XSS prevented

## Deployment Notes

### Production Checklist
- [ ] Update FRONTEND_URL and BACKEND_URL
- [ ] Add production callback URLs to Google OAuth
- [ ] Use secure SMTP provider (SendGrid, Mailgun)
- [ ] Set secure JWT_SECRET (use crypto.randomBytes)
- [ ] Enable HTTPS
- [ ] Set secure cookie flags
- [ ] Enable rate limiting
- [ ] Add logging

### Recommended Services
- **Email**: SendGrid, Mailgun, AWS SES
- **Storage**: AWS S3 for profile pictures
- **Monitoring**: Sentry for error tracking

## Next Steps

1. ✅ Update Prisma schema
2. ✅ Install dependencies
3. ✅ Create auth types
4. ⏳ Implement JWT utilities
5. ⏳ Create email service
6. ⏳ Implement auth service
7. ⏳ Create controllers
8. ⏳ Add middleware
9. ⏳ Create routes
10. ⏳ Build frontend

This implementation provides:
- ✅ Secure authentication
- ✅ OAuth integration (Google)
- ✅ Email verification
- ✅ Password reset
- ✅ Token refresh
- ✅ Remember me
- ✅ Protected routes
- ✅ Account linking
