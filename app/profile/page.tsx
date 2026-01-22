import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { LogOut, Film, Tv, Heart, Users } from "lucide-react";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    // Fetch user stats
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            _count: {
                select: {
                    watchlistItems: true,
                    activities: true,
                    followedBy: true,
                    following: true,
                },
            },
        },
    });

    if (!user) return null;

    return (
        <div className="container mx-auto px-6 py-10">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Profile Card */}
                <div className="w-full md:w-1/3 bg-card border border-white/10 rounded-2xl p-6 shadow-xl sticky top-24">
                    <div className="flex flex-col items-center">
                        <div className="w-32 h-32 rounded-full overflow-hidden mb-4 ring-4 ring-primary/20 relative">
                            {user.image ? (
                                <Image src={user.image} alt={user.name || "User"} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-4xl">👤</div>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                        <p className="text-neutral-400 text-sm">{user.email}</p>

                        <div className="flex gap-4 mt-6 w-full justify-center text-center">
                            <div>
                                <span className="block text-xl font-bold text-white">{(user as any)._count.followedBy}</span>
                                <span className="text-xs text-neutral-500">Takipçi</span>
                            </div>
                            <div>
                                <span className="block text-xl font-bold text-white">{(user as any)._count.following}</span>
                                <span className="text-xs text-neutral-500">Takip</span>
                            </div>
                        </div>

                        <form
                            action={async () => {
                                "use server";
                                await signOut({ redirectTo: "/" });
                            }}
                            className="w-full mt-8"
                        >
                            <button className="w-full flex items-center justify-center gap-2 py-3 border border-white/10 rounded-xl hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all text-neutral-400">
                                <LogOut className="w-4 h-4" />
                                Çıkış Yap
                            </button>
                        </form>
                    </div>
                </div>

                {/* Stats & Activity */}
                <div className="flex-1 space-y-6 w-full">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <Film className="w-6 h-6 text-primary mb-2" />
                            <div className="text-2xl font-bold text-white">{(user as any)._count.activities}</div>
                            <div className="text-xs text-neutral-400">İzlenen Film</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <Tv className="w-6 h-6 text-purple-400 mb-2" />
                            <div className="text-2xl font-bold text-white">0</div>
                            <div className="text-xs text-neutral-400">İzlenen Dizi</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <Heart className="w-6 h-6 text-pink-500 mb-2" />
                            <div className="text-2xl font-bold text-white">{(user as any)._count.watchlistItems}</div>
                            <div className="text-xs text-neutral-400">İzlenecekler</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <Users className="w-6 h-6 text-blue-400 mb-2" />
                            <div className="text-2xl font-bold text-white">0</div>
                            <div className="text-xs text-neutral-400">Arkadaş</div>
                        </div>
                    </div>

                    <div className="bg-card border border-white/10 rounded-2xl p-6 min-h-[300px] flex items-center justify-center text-neutral-500">
                        <p>Henüz aktivite yok.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
