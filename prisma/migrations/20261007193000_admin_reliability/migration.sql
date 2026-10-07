BEGIN;
ALTER TABLE "UserAdminProfile" ADD COLUMN IF NOT EXISTS "activeSeconds" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserAdminProfile" ADD COLUMN "heartbeatAt" TIMESTAMP(3);
UPDATE "UserAdminProfile" SET "activeSeconds" = GREATEST("activeSeconds", "totalMinutes" * 60);
CREATE TABLE "MemberDailyVisit" (
 "id" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "day" DATE NOT NULL,
 "views" INTEGER NOT NULL DEFAULT 0,
 "activeSeconds" INTEGER NOT NULL DEFAULT 0,
 "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "MemberDailyVisit_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "MemberDailyVisit_nonnegative" CHECK ("views" >= 0 AND "activeSeconds" >= 0)
);
CREATE UNIQUE INDEX "MemberDailyVisit_userId_day_key" ON "MemberDailyVisit"("userId", "day");
CREATE INDEX "MemberDailyVisit_day_lastSeen_idx" ON "MemberDailyVisit"("day", "lastSeen" DESC);
CREATE INDEX "MemberDailyVisit_userId_lastSeen_idx" ON "MemberDailyVisit"("userId", "lastSeen" DESC);
ALTER TABLE "MemberDailyVisit" ADD CONSTRAINT "MemberDailyVisit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Preserve measured legacy visits without copying orphaned user references.
-- The original table is left intact for rollback and historical inspection.
DO $$ BEGIN
 IF to_regclass('public."UserDailyVisit"') IS NOT NULL THEN
  INSERT INTO "MemberDailyVisit" ("id", "userId", "day", "views", "lastSeen")
  SELECT v."id", v."userId", v."day", GREATEST(0,v."views"), v."lastSeen"
  FROM "UserDailyVisit" v INNER JOIN "User" u ON u.id=v."userId"
  ON CONFLICT ("userId", "day") DO NOTHING;
 END IF;
END $$;

COMMIT;
