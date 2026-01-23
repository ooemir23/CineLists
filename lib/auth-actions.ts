"use server";

import { signOut, auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function handleSignOut() {
    const session = await auth();
    const user = session?.user;

    if (user?.email?.endsWith("@guest.watchgo.local")) {
        try {
            // Delete the guest user from the database
            // onDelete: Cascade in schema.prisma will handle associated data
            await prisma.user.delete({
                where: { id: user.id },
            });
            console.log(`Guest user ${user.id} deleted successfully.`);
        } catch (error) {
            console.error("Error deleting guest user:", error);
        }
    }

    await signOut({ redirectTo: "/" });
}
