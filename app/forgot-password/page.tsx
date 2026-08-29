import { Mail, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PosterBackground } from "@/components/auth/poster-background";
import { requestPasswordReset } from "@/lib/auth-actions";
import { BrandLogo } from "@/components/layout/brand-logo";

type ForgotPasswordPageProps = {
    searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
    const params = await searchParams;
    const errorMessage =
        params.error === "not-found"
            ? "Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı."
            : params.error === "db"
                ? "Bir hata oluştu. Lütfen daha sonra tekrar deneyin."
                : null;
    
    const successMessage = params.success === "sent" 
        ? "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi." 
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-6">
            <div className="absolute inset-0 bg-[#020617] pointer-events-none" />
            <PosterBackground />

            <div className="w-full max-w-md relative z-20 animate-in fade-in zoom-in-95 duration-500 py-4 sm:py-8">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <BrandLogo href="/" size="lg" className="mb-6 justify-center" />
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-2">Şifreni mi Unuttun?</h1>
                    <p className="text-neutral-400 font-medium">E-posta adresini gir, sana bir sıfırlama bağlantısı gönderelim.</p>
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

                    <form action={requestPasswordReset} className="space-y-6">
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

                        <button
                            type="submit"
                            className="w-full bg-amber-400 text-slate-950 font-black py-4 rounded-2xl hover:bg-amber-300 transition-all active:scale-[0.98] shadow-xl shadow-amber-400/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                        >
                            Sıfırlama Bağlantısı Gönder
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest hover:text-white transition-colors">
                            <ArrowLeft className="w-3 h-3" />
                            Giriş Sayfasına Dön
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
