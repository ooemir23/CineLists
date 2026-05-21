-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Comment_episodeId_idx" ON "Comment"("episodeId");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE INDEX "Indicates_userId_idx" ON "Indicates"("userId");

-- CreateIndex
CREATE INDEX "Indicates_userId_isRead_idx" ON "Indicates"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Indicates_userId_createdAt_idx" ON "Indicates"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "WatchedEpisode_episodeId_idx" ON "WatchedEpisode"("episodeId");
