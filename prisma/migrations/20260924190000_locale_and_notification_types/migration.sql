-- Persisted per-user language preference, used to send transactional emails
-- (follower/recommendation/daily-reminder notices) in the recipient's chosen
-- language instead of always Turkish. Additive with a default: safe on
-- existing rows, no data loss.
ALTER TABLE "User" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'tr';

-- New notification types for messages and achievement unlocks. Additive enum
-- values: safe, existing rows/values are untouched.
ALTER TYPE "NotificationType" ADD VALUE 'NEW_MESSAGE';
ALTER TYPE "NotificationType" ADD VALUE 'ACHIEVEMENT_UNLOCKED';
