import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function OldProfileRedirect({ params }: { params: Promise<{ id: string }> }) {
    const { id: userId } = await params;

    // Find user by ID and redirect to their username-based profile
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
    });

    if (!user) {
        redirect("/");
    }

    // Redirect to new username-based URL
    redirect(`/${user.username}`);
}

