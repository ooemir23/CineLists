import { auth } from "@/auth";
import { getNotifications } from "@/lib/notification-actions";
import { redirect } from "next/navigation";
import { NotificationsList } from "@/components/notifications/notifications-list";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const notifications = await getNotifications();

    return (
        <div className="container mx-auto px-6 py-12 min-h-screen">
            <NotificationsList initialNotifications={notifications} />
        </div>
    );
}
