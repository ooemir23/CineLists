import { registerUser } from "@/lib/auth-actions";
import { Mail, Lock, UserPlus, User } from "lucide-react";
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
            ? "Tüm zorunlu alanları doldurunuz."
            : params.error === "weak"
                ? "Şifre en az 6 karakter olmalıdır."
                : params.error === "exists"
                    ? "Bu e-posta zaten kayıtlı."
                    : params.error === "OAuthNotConfigured"
                        ? "Google ile kayıt bu ortamda henüz yapılandırılmamış. Lütfen e-posta ve şifrenizle kayıt olun."
                    : params.error === "db"
                        ? "Kayıt servisine şu anda bağlanılamıyor. Lütfen birazdan tekrar deneyin."
                        : params.error === "unknown"
                            ? "Kayıt sırasında beklenmeyen bir hata oluştu."
                        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-6">
            <div className="absolute inset-0 bg-[#020617] pointer-events-none" />
            <PosterBackground />

            <div className="w-full max-w-md relative z-20 animate-in fade-in zoom-in-95 duration-500 py-4 sm:py-8">
                {/* Logo & Header — mobilde gizli */}
                <div className="text-center mb-3 sm:mb-8">
                    <div className="hidden sm:flex justify-center mb-6">
                        <BrandLogo href="/" size="lg" />
                    </div>
                    <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight uppercase mb-1">Aramıza Katıl</h1>
                    <p className="text-neutral-400 font-medium text-xs sm:text-sm">Kendi listelerini oluştur ve paylaşmaya başla.</p>
                </div>

                {/* Main Card */}
                <div className="glass-panel border-white/10 p-4 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-transparent opacity-50 pointer-events-none" />

                    {errorMessage && (
                        <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-[10px] font-black uppercase tracking-widest px-3 py-2.5 text-center animate-in shake duration-500">
                            {errorMessage}
                        </div>
                    )}

                    <form action={registerUser} className="space-y-3">
                        <div className="space-y-1">
                            <label htmlFor="name" className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-3">
                                Ad Soyad / İsim
                            </label>
                            <div className="relative group/input">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within/input:text-amber-400 transition-colors" />
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="Adınız Soyadınız"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400/50 focus:ring-4 focus:ring-amber-400/10 transition-all font-bold text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="email" className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-3">
                                E-posta Adresi
                            </label>
                            <div className="relative group/input">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within/input:text-amber-400 transition-colors" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="mail@ornek.com"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400/50 focus:ring-4 focus:ring-amber-400/10 transition-all font-bold text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="password" className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-3">
                                Güçlü Bir Şifre
                            </label>
                            <div className="relative group/input">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within/input:text-amber-400 transition-colors" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="En az 6 karakter"
                                    required
                                    minLength={6}
                                    className="w-full pl-10 pr-4 py-2.5 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400/50 focus:ring-4 focus:ring-amber-400/10 transition-all font-bold text-sm"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-amber-400 text-slate-950 font-black py-2.5 sm:py-4 rounded-xl sm:rounded-2xl hover:bg-amber-300 transition-all active:scale-[0.98] shadow-xl shadow-amber-400/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                        >
                            Kayıt Ol
                            <UserPlus className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="relative my-3 sm:my-8">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/5" />
                        </div>
                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                            <span className="bg-[#121a2c] px-4 text-neutral-500">Hızlı Kayıt</span>
                        </div>
                    </div>

                    <SocialAuth />
                </div>

                <p className="mt-3 sm:mt-8 text-center text-sm font-bold text-neutral-400">
                    Zaten bir hesabın var mı?{" "}
                    <Link href="/login" className="text-amber-400 hover:text-amber-300 transition-colors font-black uppercase tracking-tight ml-1">
                        Giriş Yap
                    </Link>
                </p>
            </div>
        </div>
    );
}
