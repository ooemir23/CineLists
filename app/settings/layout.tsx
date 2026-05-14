import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsSidebar } from "@/components/profile/settings-sidebar";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-black text-white mb-8 tracking-tight uppercase">Ayarlar</h1>
                <div className="flex flex-col md:flex-row gap-8 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[600px]">
                    <SettingsSidebar />
                    <div className="flex-1 p-8 overflow-y-auto">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
