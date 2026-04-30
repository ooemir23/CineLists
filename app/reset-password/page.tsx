import { Film, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PosterBackground } from "@/components/auth/poster-background";
import { resetPassword } from "@/lib/auth-actions";

type ResetPasswordPageProps = {
    searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
    const params = await searchParams;
    const token = params.token;
    const errorMessage =
        params.error === "invalid"
            ? "Geçersiz veya süresi dolmuş sıfırlama bağlantısı."
            : params.error === "mismatch"
                ? "Şifreler birbiriyle eşleşmiyor."
                : params.error === "weak"
                    ? "Şifre en az 6 karakter olmalıdır."
                    : null;

    if (!token && !errorMessage) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-white">
                <p>Geçersiz sıfırlama bağlantısı.</p>
                <Link href="/login" className="text-amber-400 mt-4 underline">Giriş'e Dön</Link>
            </div>
        );
    }

    return (
        <div className="relative min-h-[calc(100svh-72px)] flex items-center justify-center px-4 py-12 overflow-hidden bg-[#020617]">
            <PosterBackground />

            <div className="w-full max-w-md relative z-20 animate-in fade-in zoom-in-95 duration-500">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
                        <div className="bg-amber-400 p-2.5 rounded-2xl shadow-lg shadow-amber-400/20 group-hover:scale-110 transition-transform duration-300">
                            <Film className="w-8 h-8 text-slate-950" strokeWidth={2.5} />
                        </div>
                        <span className="text-3xl font-black text-white tracking-tighter uppercase italic">CineLists</span>
                    </Link>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-2">Yeni Şifre Oluştur</h1>
                    <p className="text-neutral-400 font-medium">Lütfen hesabın için yeni ve güvenli bir şifre belirle.</p>
                </div>

                {/* Main Card */}
                <div className="glass-panel border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-transparent opacity-50 pointer-events-none" />
                    
                    {errorMessage && (
                        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs font-black uppercase tracking-widest px-4 py-4 text-center animate-in shake duration-500">
                            {errorMessage}
                        </div>
                    )}

                    <form action={resetPassword} className="space-y-5">
                        <input type="hidden" name="token" value={token || ""} />
                        
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-4">
                                Yeni Şifre
                            </label>
                            <div className="relative group/input">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within/input:text-amber-400 transition-colors" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400/50 focus:ring-4 focus:ring-amber-400/10 transition-all font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="confirmPassword" className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-4">
                                Şifreyi Onayla
                            </label>
                            <div className="relative group/input">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within/input:text-amber-400 transition-colors" />
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400/50 focus:ring-4 focus:ring-amber-400/10 transition-all font-bold"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-amber-400 text-slate-950 font-black py-4 rounded-2xl hover:bg-amber-300 transition-all active:scale-[0.98] shadow-xl shadow-amber-400/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                        >
                            Şifreyi Güncelle
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest hover:text-white transition-colors">
                            <ArrowLeft className="w-3 h-3" />
                            Vazgeç ve Giriş'e Dön
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
