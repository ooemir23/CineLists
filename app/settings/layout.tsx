import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsSidebar } from "@/components/profile/settings-sidebar";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    return (
        <div className="min-h-screen bg-[#020617] pt-2 sm:pt-8 pb-24 md:pb-12 px-3.5 sm:px-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:gap-10 min-h-[500px]">
                    <SettingsSidebar />
                    <div className="flex-1 py-2 md:py-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
