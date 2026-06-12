CREATE TABLE users (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                       VARCHAR(255) NOT NULL UNIQUE,
    password_hash               VARCHAR(255),
    name                        VARCHAR(200) NOT NULL,
    profile_picture_url         VARCHAR(512),
    bio                         TEXT,
    phone_number                VARCHAR(30),
    role                        user_role NOT NULL DEFAULT 'TENANT',
    is_verified                 BOOLEAN NOT NULL DEFAULT FALSE,
    verification_badge_expires_at TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
