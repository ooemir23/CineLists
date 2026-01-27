/*
  Warnings:

  - You are about to drop the `WatchlistItem` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,mediaId,type]` on the table `Activity` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "WatchlistItem" DROP CONSTRAINT "WatchlistItem_mediaId_fkey";

-- DropForeignKey
ALTER TABLE "WatchlistItem" DROP CONSTRAINT "WatchlistItem_userId_fkey";

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "recommendedById" TEXT,
ADD COLUMN     "recommendedByText" TEXT;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "personId" INTEGER;

-- AlterTable
ALTER TABLE "MediaItem" ADD COLUMN     "genres" TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "favoriteGenres" TEXT[],
ADD COLUMN     "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "platforms" TEXT[];

-- DropTable
DROP TABLE "WatchlistItem";

-- DropEnum
DROP TYPE "WatchStatus";

-- CreateTable
CREATE TABLE "FavoritePerson" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "profilePath" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoritePerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watched" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recommendedById" TEXT,
    "recommendedByText" TEXT,

    CONSTRAINT "Watched_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToWatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToWatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FavoritePerson_userId_tmdbId_key" ON "FavoritePerson"("userId", "tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "Watched_userId_mediaId_key" ON "Watched"("userId", "mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "ToWatch_userId_mediaId_key" ON "ToWatch"("userId", "mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_userId_mediaId_type_key" ON "Activity"("userId", "mediaId", "type");

-- AddForeignKey
ALTER TABLE "FavoritePerson" ADD CONSTRAINT "FavoritePerson_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watched" ADD CONSTRAINT "Watched_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watched" ADD CONSTRAINT "Watched_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watched" ADD CONSTRAINT "Watched_recommendedById_fkey" FOREIGN KEY ("recommendedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToWatch" ADD CONSTRAINT "ToWatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToWatch" ADD CONSTRAINT "ToWatch_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_recommendedById_fkey" FOREIGN KEY ("recommendedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
