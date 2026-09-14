CREATE TABLE "UserAdminProfile" (
    "userId" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "country" TEXT,
    CONSTRAINT "UserAdminProfile_pkey" PRIMARY KEY ("userId")
);
CREATE INDEX "UserAdminProfile_registeredAt_idx" ON "UserAdminProfile"("registeredAt");
CREATE INDEX "UserAdminProfile_lastSeenAt_idx" ON "UserAdminProfile"("lastSeenAt");
CREATE INDEX "UserAdminProfile_country_idx" ON "UserAdminProfile"("country");
ALTER TABLE "UserAdminProfile" ADD CONSTRAINT "UserAdminProfile_userId_fkey"
 FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AnalyticsDaily" (
    "id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "country" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AnalyticsDaily_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AnalyticsDaily_day_country_device_path_audience_key" ON "AnalyticsDaily"("day", "country", "device", "path", "audience");
CREATE INDEX "AnalyticsDaily_day_idx" ON "AnalyticsDaily"("day");
CREATE INDEX "AnalyticsDaily_country_day_idx" ON "AnalyticsDaily"("country", "day");

CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AdminAuditLog_actorId_idx" ON "AdminAuditLog"("actorId");
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt" DESC);
CREATE INDEX "AdminAuditLog_targetId_createdAt_idx" ON "AdminAuditLog"("targetId", "createdAt" DESC);
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorId_fkey"
 FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
