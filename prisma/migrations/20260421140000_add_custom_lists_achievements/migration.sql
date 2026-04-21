-- CreateTable
CREATE TABLE "CustomList" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "coverImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CustomList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomListItem" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "CustomListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListLike" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomList_userId_idx" ON "CustomList"("userId");

-- CreateIndex
CREATE INDEX "CustomListItem_listId_idx" ON "CustomListItem"("listId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomListItem_listId_mediaId_key" ON "CustomListItem"("listId", "mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "ListLike_listId_userId_key" ON "ListLike"("listId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_userId_type_key" ON "Achievement"("userId", "type");

-- CreateIndex
CREATE INDEX "Achievement_userId_idx" ON "Achievement"("userId");

-- AddForeignKey
ALTER TABLE "CustomList" ADD CONSTRAINT "CustomList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomListItem" ADD CONSTRAINT "CustomListItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "CustomList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomListItem" ADD CONSTRAINT "CustomListItem_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListLike" ADD CONSTRAINT "ListLike_listId_fkey" FOREIGN KEY ("listId") REFERENCES "CustomList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListLike" ADD CONSTRAINT "ListLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
