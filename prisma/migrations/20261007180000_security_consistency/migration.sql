BEGIN;
-- DropIndex
DROP INDEX "ToWatch_userId_idx";

-- DropIndex
DROP INDEX "Message_senderId_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'TR',
ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- Use previously recorded country when available; do not infer geography from language.
UPDATE "User" u SET "country" = upper(p."country")
FROM "UserAdminProfile" p WHERE p."userId" = u.id AND p."country" ~ '^[A-Za-z]{2}$';

-- AlterTable
ALTER TABLE "Indicates" ADD COLUMN     "payload" JSONB;

-- CreateTable
CREATE TABLE "ActivityVote" (
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "ActivityVote_pkey" PRIMARY KEY ("userId","activityId")
);

-- CreateTable
CREATE TABLE "CommentVote" (
    "userId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "CommentVote_pkey" PRIMARY KEY ("userId","commentId")
);

-- CreateTable
CREATE TABLE "AuthRateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "FavoriteMedia" (
    "userId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteMedia_pkey" PRIMARY KEY ("userId","mediaId")
);

-- CreateTable
CREATE TABLE "UsernameAlias" (
    "username" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UsernameAlias_pkey" PRIMARY KEY ("username")
);

-- CreateIndex
CREATE INDEX "ActivityVote_activityId_idx" ON "ActivityVote"("activityId");

-- CreateIndex
CREATE INDEX "CommentVote_commentId_idx" ON "CommentVote"("commentId");

-- CreateIndex
CREATE INDEX "AuthRateLimit_expires_idx" ON "AuthRateLimit"("expires");

-- CreateIndex
CREATE INDEX "FavoriteMedia_mediaId_idx" ON "FavoriteMedia"("mediaId");

-- CreateIndex
CREATE INDEX "FavoriteMedia_userId_position_idx" ON "FavoriteMedia"("userId", "position");

-- CreateIndex
CREATE INDEX "UsernameAlias_userId_idx" ON "UsernameAlias"("userId");

-- CreateIndex
CREATE INDEX "Watched_userId_watchedAt_idx" ON "Watched"("userId", "watchedAt" DESC);

-- CreateIndex
CREATE INDEX "ToWatch_userId_addedAt_idx" ON "ToWatch"("userId", "addedAt" DESC);

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_createdAt_id_idx" ON "Message"("senderId", "receiverId", "createdAt" DESC, "id");

-- AddForeignKey
ALTER TABLE "ActivityVote" ADD CONSTRAINT "ActivityVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityVote" ADD CONSTRAINT "ActivityVote_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentVote" ADD CONSTRAINT "CommentVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentVote" ADD CONSTRAINT "CommentVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteMedia" ADD CONSTRAINT "FavoriteMedia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteMedia" ADD CONSTRAINT "FavoriteMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsernameAlias" ADD CONSTRAINT "UsernameAlias_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Votes now have attributable owners. Preserve old aggregates as a baseline;
-- new vote transitions add only the difference between a user's previous state.
ALTER TABLE "ActivityVote" ADD CONSTRAINT "ActivityVote_value_check" CHECK (value IN (-1, 1));
ALTER TABLE "CommentVote" ADD CONSTRAINT "CommentVote_value_check" CHECK (value IN (-1, 1));

-- Pending plaintext reset links are deliberately expired after the hash change.
DELETE FROM "VerificationToken" WHERE identifier NOT LIKE 'auth:%';

-- Preserve old profile URLs while normalizing usernames. Conflicts use a stable
-- suffix derived from the user ID. This runs inside the migration transaction.
CREATE TEMP TABLE username_mapping ON COMMIT DROP AS
WITH normalized AS (
  SELECT id, username AS old_name,
    CASE WHEN lower(trim(username)) ~ '^[a-z0-9_]{1,30}$'
      THEN lower(trim(username)) ELSE 'user_' || substr(md5(id), 1, 24) END AS base
  FROM "User"
), ranked AS (
  SELECT *, count(*) OVER (PARTITION BY base) AS group_count FROM normalized
)
SELECT id, old_name, CASE WHEN group_count = 1 THEN base
  ELSE left(base, 20) || '_' || substr(md5(id), 1, 9) END AS new_name FROM ranked;
INSERT INTO "UsernameAlias" (username, "userId")
SELECT old_name, id FROM username_mapping WHERE old_name <> new_name;
UPDATE "User" AS u SET username = '__migration_' || u.id FROM username_mapping AS m WHERE u.id = m.id AND m.old_name <> m.new_name;
UPDATE "User" AS u SET username = m.new_name FROM username_mapping AS m WHERE u.id = m.id;
CREATE UNIQUE INDEX "User_username_lower_key" ON "User" (lower(username));

-- Collapse duplicate singleton watch/rating activities, preserving comments.
-- Reviews are intentionally repeatable and are not included in this constraint.
CREATE TEMP TABLE activity_mapping ON COMMIT DROP AS
SELECT id, first_value(id) OVER (
  PARTITION BY "userId", "mediaId", type ORDER BY "createdAt" DESC, id DESC
) AS keep_id FROM "Activity" WHERE "episodeId" IS NULL AND type IN ('WATCHED', 'RATED');
UPDATE "Comment" AS c SET "activityId" = m.keep_id FROM activity_mapping AS m
WHERE c."activityId" = m.id AND m.id <> m.keep_id;
DELETE FROM "Activity" AS a USING activity_mapping AS m WHERE a.id = m.id AND m.id <> m.keep_id;
CREATE UNIQUE INDEX "Activity_singleton_media_key"
ON "Activity" ("userId", "mediaId", type) WHERE "episodeId" IS NULL AND type IN ('WATCHED', 'RATED');

-- Resolve only unambiguous legacy favorite IDs; keep ambiguous/unresolved numeric
-- entries in the old array for manual resolution instead of guessing movie/TV.
INSERT INTO "FavoriteMedia" ("userId", "mediaId", position, "addedAt")
SELECT u.id, min(m.id), min(f.position)::integer, CURRENT_TIMESTAMP
FROM "User" u CROSS JOIN LATERAL unnest(u."favoriteMediaIds") WITH ORDINALITY AS f(key, position)
JOIN "MediaItem" m ON f.key = lower(m.type::text) || ':' || m."tmdbId"::text
  OR (f.key ~ '^[0-9]+$' AND f.key = m."tmdbId"::text AND m.type IN ('MOVIE', 'TV'))
GROUP BY u.id, f.key HAVING count(DISTINCT m.id) = 1
ON CONFLICT ("userId", "mediaId") DO NOTHING;
UPDATE "User" u SET "favoriteMediaIds" =
  ARRAY(SELECT lower(m.type::text) || ':' || m."tmdbId"::text FROM "FavoriteMedia" f JOIN "MediaItem" m ON m.id = f."mediaId" WHERE f."userId" = u.id ORDER BY f.position)
  || ARRAY(SELECT key FROM unnest(u."favoriteMediaIds") AS key WHERE key ~ '^[0-9]+$'
       AND NOT EXISTS (SELECT 1 FROM "FavoriteMedia" f JOIN "MediaItem" m ON m.id = f."mediaId" WHERE f."userId" = u.id AND m."tmdbId"::text = key));

COMMIT;
