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
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-8">
            <NotificationsList initialNotifications={notifications} />
        </div>
    );
}
