-- Migration: Add Authentication Features
-- Adds OAuth support, email verification, and password reset

-- Modify users table to add auth fields
ALTER TABLE users
  ALTER COLUMN password DROP NOT NULL; -- Allow null for OAuth-only users

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500),
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_password_token ON users(reset_password_token);

-- Create oauth_accounts table for social login
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  provider VARCHAR(50) NOT NULL, -- 'google', 'facebook', 'apple'
  provider_id VARCHAR(255) NOT NULL, -- OAuth provider's user ID
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Foreign key constraint
  CONSTRAINT fk_oauth_accounts_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  -- Ensure one OAuth account per provider per user
  UNIQUE(provider, provider_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider);

-- Add comments
COMMENT ON TABLE oauth_accounts IS 'Stores OAuth provider information for social login';
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN users.verification_token IS 'Token sent in verification email';
COMMENT ON COLUMN users.reset_password_token IS 'Token for password reset flow';
COMMENT ON COLUMN users.reset_password_expires IS 'When the reset token expires';
COMMENT ON COLUMN users.last_login IS 'Timestamp of last successful login';

-- Update existing users to be verified (for development)
UPDATE users SET email_verified = true WHERE email_verified IS NULL;
