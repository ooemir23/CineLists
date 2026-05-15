import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsSidebar } from "@/components/profile/settings-sidebar";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    return (
        <div className="min-h-screen bg-[#020617] pt-20 pb-12 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:gap-12 min-h-[600px]">
                    <SettingsSidebar />
                    <div className="flex-1 py-4 md:py-8 overflow-y-auto">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
