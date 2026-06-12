-- Append MVP profile fields to the user domain
ALTER TABLE users
ADD COLUMN profile_picture_url VARCHAR(512),
ADD COLUMN bio TEXT;