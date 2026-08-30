-- Add profile fields: avatar image (stored as a data URL) and unit preference.
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "units" TEXT DEFAULT 'metric';
