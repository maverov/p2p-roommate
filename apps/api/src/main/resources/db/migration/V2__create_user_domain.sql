-- Create an explicit ENUM for strict type-safety on user platform roles
CREATE TYPE user_role AS ENUM ('TENANT', 'OWNER', 'ADMIN');

-- Core Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255), -- Nullable to allow passwordless Google OAuth sign-ins
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(30), -- Supports international formatting for expats/nomads
    role user_role NOT NULL DEFAULT 'TENANT',
    
    -- Verification & Trust Metrics
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_badge_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for ultra-fast lookups during authentication and filtering
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Automatically update updated_at timestamp on record changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();