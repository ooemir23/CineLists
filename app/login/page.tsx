import { loginUser } from "@/lib/auth-actions";
import { Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SocialAuth } from "@/components/auth/social-auth";
import { PosterBackground } from "@/components/auth/poster-background";
import { BrandLogo } from "@/components/layout/brand-logo";

type LoginPageProps = {
    searchParams: Promise<{ error?: string; reset?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const params = await searchParams;
    let errorMessage = null;
    if (params.error) {
        switch (params.error) {
            case "invalid":
                errorMessage = "E-posta veya şifre hatalı.";
                break;
            case "missing":
                errorMessage = "E-posta ve şifre zorunludur.";
                break;
            case "OAuthAccountNotLinked":
                errorMessage = "Bu e-posta adresiyle zaten bir hesap var (Şifre ile kayıt olmuş olabilirsiniz). Lütfen e-posta ve şifrenizle giriş yapın ve ardından profil ayarlarından Google hesabınızı bağlayın.";
                break;
            case "AccessDenied":
                errorMessage = "Giriş izni reddedildi. Google hesabınızın e-postası doğrulanmamış olabilir.";
                break;
            case "CallbackRouteError":
                errorMessage = "Giriş işlemi sırasında sunucu hatası oluştu. Lütfen tekrar deneyin.";
                break;
            case "Configuration":
                errorMessage = "Google giriş yapılandırmasında sunucu taraflı bir sorun var. Lütfen tekrar deneyin veya e-posta ile giriş yapın.";
                break;
            case "OAuthCallbackError":
            case "OAuthCallback":
                errorMessage = "Google servisinden kullanıcı bilgileri alınırken hata oluştu.";
                break;
            default:
                errorMessage = "Giriş yapılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
        }
    }

    const successMessage = params.reset === "success"
        ? "Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz."
        : null;

    return (
        <div className="relative min-h-[calc(100svh-72px)] flex items-center justify-center px-4 py-12 overflow-hidden bg-[#020617]">
            <PosterBackground />

            <div className="w-full max-w-md relative z-20 animate-in fade-in zoom-in-95 duration-500">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <BrandLogo href="/" size="lg" className="mb-6 justify-center" />
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-2">Tekrar Hoş Geldin</h1>
                    <p className="text-neutral-400 font-medium">Sinema dünyasına kaldığın yerden devam et.</p>
                </div>

                {/* Main Card */}
                <div className="glass-panel border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-transparent opacity-50 pointer-events-none" />
                    
                    {errorMessage && (
                        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs font-black uppercase tracking-widest px-4 py-4 text-center animate-in shake duration-500">
                            {errorMessage}
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-xs font-black uppercase tracking-widest px-4 py-4 text-center animate-in fade-in duration-500">
                            {successMessage}
                        </div>
                    )}

                    <form action={loginUser} className="space-y-5">
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
                                    placeholder="ornek@mail.com"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400/50 focus:ring-4 focus:ring-amber-400/10 transition-all font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between px-4">
                                <label htmlFor="password" className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                    Şifre
                                </label>
                                <Link href="/forgot-password" className="text-[10px] font-black text-amber-400 uppercase tracking-widest hover:underline">
                                    Şifremi Unuttum
                                </Link>
                            </div>
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

                        <button
                            type="submit"
                            className="w-full bg-amber-400 text-slate-950 font-black py-4 rounded-2xl hover:bg-amber-300 transition-all active:scale-[0.98] shadow-xl shadow-amber-400/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                        >
                            Giriş Yap
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/5" />
                        </div>
                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                            <span className="bg-[#121a2c] px-4 text-neutral-500">Veya Bunlarla</span>
                        </div>
                    </div>

                    <SocialAuth />
                </div>

                <p className="mt-8 text-center text-sm font-bold text-neutral-400">
                    Henüz bir hesabın yok mu?{" "}
                    <Link href="/register" className="text-amber-400 hover:text-amber-300 transition-colors font-black uppercase tracking-tight ml-1">
                        Kayıt Ol
                    </Link>
                </p>
            </div>
        </div>
    );
}
