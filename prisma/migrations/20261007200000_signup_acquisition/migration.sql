BEGIN;
ALTER TABLE "UserAdminProfile"
 ADD COLUMN "acquisitionSource" TEXT,
 ADD COLUMN "acquisitionMedium" TEXT,
 ADD COLUMN "acquisitionCampaign" TEXT,
 ADD COLUMN "referrerHost" TEXT,
 ADD COLUMN "acquisitionCapturedAt" TIMESTAMP(3),
 ADD COLUMN "discoveryAnswer" TEXT;
CREATE INDEX "UserAdminProfile_acquisitionSource_registeredAt_idx" ON "UserAdminProfile"("acquisitionSource", "registeredAt");
CREATE INDEX "UserAdminProfile_discoveryAnswer_registeredAt_idx" ON "UserAdminProfile"("discoveryAnswer", "registeredAt");
COMMIT;
