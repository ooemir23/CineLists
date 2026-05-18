-- Performance optimization: add indexes on frequently queried columns
-- to reduce query execution time, improve pagination, and fix N+1 query problems.

-- Activity table indexes
-- CreateIndex
CREATE INDEX "idx_activity_userId" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX "idx_activity_mediaId" ON "Activity"("mediaId");

-- CreateIndex
CREATE INDEX "idx_activity_createdAt" ON "Activity"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_activity_userId_createdAt" ON "Activity"("userId", "createdAt" DESC);

-- Comment table indexes
-- CreateIndex
CREATE INDEX "idx_comment_userId" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "idx_comment_activityId" ON "Comment"("activityId");

-- CreateIndex
CREATE INDEX "idx_comment_createdAt" ON "Comment"("createdAt" DESC);

-- Recommendation table indexes
-- CreateIndex
CREATE INDEX "idx_recommendation_receiverId" ON "Recommendation"("receiverId");

-- CreateIndex
CREATE INDEX "idx_recommendation_senderId" ON "Recommendation"("senderId");

-- CreateIndex
CREATE INDEX "idx_recommendation_createdAt" ON "Recommendation"("createdAt" DESC);

-- Message table indexes
-- CreateIndex
CREATE INDEX "idx_message_receiverId" ON "Message"("receiverId");

-- CreateIndex
CREATE INDEX "idx_message_senderId" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "idx_message_createdAt" ON "Message"("createdAt" DESC);

-- ToWatch table indexes
-- CreateIndex
CREATE INDEX "idx_towatch_userId" ON "ToWatch"("userId");

-- CreateIndex
CREATE INDEX "idx_towatch_mediaId" ON "ToWatch"("mediaId");

-- Watched table indexes
-- CreateIndex
CREATE INDEX "idx_watched_userId" ON "Watched"("userId");

-- CreateIndex
CREATE INDEX "idx_watched_mediaId" ON "Watched"("mediaId");

-- Follow table indexes
-- CreateIndex
CREATE INDEX "idx_follow_followerId" ON "Follow"("followerId");

-- CreateIndex
CREATE INDEX "idx_follow_followingId" ON "Follow"("followingId");

-- Episode table indexes
-- CreateIndex
CREATE INDEX "idx_episode_mediaId" ON "Episode"("mediaId");
