import { registerUser } from "@/lib/auth-actions";
import { Mail, Lock, UserPlus } from "lucide-react";
import Link from "next/link";
import { SocialAuth } from "@/components/auth/social-auth";
import { PosterBackground } from "@/components/auth/poster-background";
import { BrandLogo } from "@/components/layout/brand-logo";

type RegisterPageProps = {
    searchParams: Promise<{ error?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
    const params = await searchParams;
    const errorMessage =
        params.error === "missing"
            ? "Mail ve şifre zorunludur."
            : params.error === "weak"
                ? "Şifre en az 6 karakter olmalıdır."
                : params.error === "exists"
                    ? "Bu e-posta zaten kayıtlı."
                    : params.error === "db"
                        ? "Kayıt servisine şu anda bağlanılamıyor. Lütfen birazdan tekrar deneyin."
                        : params.error === "unknown"
                            ? "Kayıt sırasında beklenmeyen bir hata oluştu."
                    : null;

    return (
        <div className="relative flex items-center justify-center px-4 overflow-hidden bg-[#020617]"
            style={{ minHeight: 'calc(100svh - 56px - 80px)' }}>
            <PosterBackground />

            <div className="w-full max-w-md relative z-20 animate-in fade-in zoom-in-95 duration-500">
                {/* Logo & Header */}
                <div className="text-center mb-3 sm:mb-8">
                    <BrandLogo href="/" size="lg" className="hidden sm:flex mb-6 justify-center" />
                    <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight uppercase mb-1">Aramıza Katıl</h1>
                    <p className="text-neutral-400 font-medium text-xs sm:text-sm">Kendi listelerini oluştur ve paylaşmaya başla.</p>
                </div>

                {/* Main Card */}
                <div className="glass-panel border-white/10 p-5 sm:p-8 md:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-transparent opacity-50 pointer-events-none" />

                    {errorMessage && (
                        <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs font-black uppercase tracking-widest px-3 py-3 text-center animate-in shake duration-500">
                            {errorMessage}
                        </div>
                    )}

                    <form action={registerUser} className="space-y-3 sm:space-y-5">
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-4">
                                E-posta Adresi
                            </label>
                            <div className="relative group/input">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within/input:text-amber-400 transition-colors" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="mail@ornek.com"
                                    required
                                    className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400/50 focus:ring-4 focus:ring-amber-400/10 transition-all font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-4">
                                Güçlü Bir Şifre
                            </label>
                            <div className="relative group/input">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within/input:text-amber-400 transition-colors" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="En az 6 karakter"
                                    required
                                    minLength={6}
                                    className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400/50 focus:ring-4 focus:ring-amber-400/10 transition-all font-bold"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-amber-400 text-slate-950 font-black py-3 sm:py-4 rounded-2xl hover:bg-amber-300 transition-all active:scale-[0.98] shadow-xl shadow-amber-400/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                        >
                            Kayıt Ol
                            <UserPlus className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="relative my-4 sm:my-8">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/5" />
                        </div>
                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                            <span className="bg-[#121a2c] px-4 text-neutral-500">Hızlı Kayıt</span>
                        </div>
                    </div>

                    <SocialAuth />
                </div>

                <p className="mt-4 sm:mt-8 text-center text-sm font-bold text-neutral-400">
                    Zaten bir hesabın var mı?{" "}
                    <Link href="/login" className="text-amber-400 hover:text-amber-300 transition-colors font-black uppercase tracking-tight ml-1">
                        Giriş Yap
                    </Link>
                </p>
            </div>
        </div>
    );
}
