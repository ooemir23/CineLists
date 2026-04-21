"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ============================================
// CUSTOM LIST CRUD İŞLEMLERİ
// ============================================

export async function createList(data: {
  title: string;
  description?: string;
  isPublic?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Giriş yapmanız gerekiyor.");

  const list = await prisma.customList.create({
    data: {
      title: data.title,
      description: data.description || null,
      isPublic: data.isPublic ?? true,
      userId: session.user.id,
    },
  });

  revalidatePath("/lists");
  return list;
}

export async function updateList(
  listId: string,
  data: {
    title?: string;
    description?: string;
    isPublic?: boolean;
    coverImage?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Giriş yapmanız gerekiyor.");

  const list = await prisma.customList.findUnique({
    where: { id: listId },
  });

  if (!list || list.userId !== session.user.id) {
    throw new Error("Bu listeyi düzenleme yetkiniz yok.");
  }

  const updated = await prisma.customList.update({
    where: { id: listId },
    data,
  });

  revalidatePath(`/lists/${listId}`);
  revalidatePath("/lists");
  return updated;
}

export async function deleteList(listId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Giriş yapmanız gerekiyor.");

  const list = await prisma.customList.findUnique({
    where: { id: listId },
  });

  if (!list || list.userId !== session.user.id) {
    throw new Error("Bu listeyi silme yetkiniz yok.");
  }

  await prisma.customList.delete({
    where: { id: listId },
  });

  revalidatePath("/lists");
  return { success: true };
}

// ============================================
// LİSTE ÖĞE İŞLEMLERİ
// ============================================

export async function addToList(listId: string, mediaId: string, note?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Giriş yapmanız gerekiyor.");

  // Liste sahipliğini kontrol et
  const list = await prisma.customList.findUnique({
    where: { id: listId },
  });

  if (!list || list.userId !== session.user.id) {
    throw new Error("Bu listeye ekleme yetkiniz yok.");
  }

  // Zaten ekli mi kontrol et
  const existing = await prisma.customListItem.findUnique({
    where: {
      listId_mediaId: { listId, mediaId },
    },
  });

  if (existing) {
    throw new Error("Bu içerik zaten listede.");
  }

  // Mevcut maksimum sıra numarasını bul
  const maxOrderItem = await prisma.customListItem.findFirst({
    where: { listId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const item = await prisma.customListItem.create({
    data: {
      listId,
      mediaId,
      note: note || null,
      order: (maxOrderItem?.order ?? -1) + 1,
    },
    include: {
      media: true,
    },
  });

  // İlk öğe ekleniyorsa kapak görseli olarak ayarla
  if (!list.coverImage && item.media.posterPath) {
    await prisma.customList.update({
      where: { id: listId },
      data: { coverImage: item.media.posterPath },
    });
  }

  revalidatePath(`/lists/${listId}`);
  revalidatePath("/lists");
  return item;
}

export async function removeFromList(listId: string, mediaId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Giriş yapmanız gerekiyor.");

  const list = await prisma.customList.findUnique({
    where: { id: listId },
  });

  if (!list || list.userId !== session.user.id) {
    throw new Error("Bu listeden çıkarma yetkiniz yok.");
  }

  await prisma.customListItem.delete({
    where: {
      listId_mediaId: { listId, mediaId },
    },
  });

  revalidatePath(`/lists/${listId}`);
  revalidatePath("/lists");
  return { success: true };
}

export async function reorderListItems(
  listId: string,
  itemIds: string[]
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Giriş yapmanız gerekiyor.");

  const list = await prisma.customList.findUnique({
    where: { id: listId },
  });

  if (!list || list.userId !== session.user.id) {
    throw new Error("Bu listeyi düzenleme yetkiniz yok.");
  }

  // Transaction ile tüm sıralamayı güncelle
  await prisma.$transaction(
    itemIds.map((id, index) =>
      prisma.customListItem.update({
        where: { id },
        data: { order: index },
      })
    )
  );

  revalidatePath(`/lists/${listId}`);
  return { success: true };
}

// ============================================
// LİSTE SORGULAMA
// ============================================

export async function getUserLists(userId?: string) {
  const session = await auth();
  const currentUserId = userId || session?.user?.id;

  if (!currentUserId) throw new Error("Kullanıcı bulunamadı.");

  const lists = await prisma.customList.findMany({
    where: {
      userId: currentUserId,
      ...(currentUserId !== session?.user?.id ? { isPublic: true } : {}),
    },
    include: {
      _count: {
        select: { items: true, likes: true },
      },
      items: {
        take: 4,
        orderBy: { order: "asc" },
        select: {
          media: {
            select: {
              posterPath: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return lists;
}

export async function getListById(listId: string) {
  const session = await auth();

  const list = await prisma.customList.findUnique({
    where: { id: listId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          username: true,
        },
      },
      items: {
        orderBy: { order: "asc" },
        include: {
          media: true,
        },
      },
      _count: {
        select: { likes: true, items: true },
      },
      likes: session?.user?.id
        ? {
            where: { userId: session.user.id },
            select: { id: true },
          }
        : false,
    },
  });

  if (!list) return null;

  // Özel liste kontrolü
  if (!list.isPublic && list.userId !== session?.user?.id) {
    return null;
  }

  return {
    ...list,
    isLiked: session?.user?.id ? list.likes?.length > 0 : false,
  };
}

// ============================================
// LİSTE BEĞENİ
// ============================================

export async function toggleListLike(listId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Giriş yapmanız gerekiyor.");

  const existing = await prisma.listLike.findUnique({
    where: {
      listId_userId: { listId, userId: session.user.id },
    },
  });

  if (existing) {
    await prisma.listLike.delete({
      where: { id: existing.id },
    });
  } else {
    await prisma.listLike.create({
      data: {
        listId,
        userId: session.user.id,
      },
    });
  }

  revalidatePath(`/lists/${listId}`);
  return { liked: !existing };
}

// ============================================
// HIZLI LİSTE İŞLEMLERİ (Medya detay sayfası için)
// ============================================

export async function getListsForMedia(mediaId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const lists = await prisma.customList.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        where: { mediaId },
        select: { id: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return lists.map((list) => ({
    id: list.id,
    title: list.title,
    hasItem: list.items.length > 0,
  }));
}

export async function quickToggleMediaInList(
  listId: string,
  mediaId: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Giriş yapmanız gerekiyor.");

  const existing = await prisma.customListItem.findUnique({
    where: {
      listId_mediaId: { listId, mediaId },
    },
  });

  if (existing) {
    await prisma.customListItem.delete({
      where: { id: existing.id },
    });
    return { added: false };
  } else {
    await addToList(listId, mediaId);
    return { added: true };
  }
}
