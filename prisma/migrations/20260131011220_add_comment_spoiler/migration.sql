/*
  Warnings:

  - A unique constraint covering the columns `[userId,mediaId,type,episodeId]` on the table `Activity` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Activity_userId_mediaId_type_key";

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "isSpoiler" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSuspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showActivities" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showStats" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Activity_userId_mediaId_type_episodeId_key" ON "Activity"("userId", "mediaId", "type", "episodeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
