import { registerUser } from "@/lib/auth-actions";
import { Film } from "lucide-react";
import Link from "next/link";
import { SocialAuth } from "@/components/auth/social-auth";

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
        <div className="min-h-screen bg-background px-4 py-8 md:py-10 flex items-center justify-center">
            <div className="w-full max-w-[380px] bg-card/95 p-5 md:p-6 rounded-2xl border border-white/10 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.9)]">
                <div className="text-center mb-4">
                    <div className="flex justify-center mb-2">
                        <div className="bg-primary/15 p-2.5 rounded-lg border border-primary/20">
                            <Film className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Kayıt Ol</h2>
                    <p className="mt-1 text-sm text-neutral-400">
                        cinelists dünyasına katılın.
                    </p>
                </div>

                {errorMessage && (
                    <div className="rounded-lg border border-red-400/30 bg-red-500/10 text-red-200 text-sm font-medium px-3 py-2.5 mb-3">
                        {errorMessage}
                    </div>
                )}

                <form action={registerUser} className="space-y-3">
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="text-sm font-medium text-neutral-400 ml-1">
                            Mail
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="mail@ornek.com"
                            required
                            className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="password" className="text-sm font-medium text-neutral-400 ml-1">
                            Şifre
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="En az 6 karakter"
                            required
                            minLength={6}
                            className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-all active:scale-[0.98] mt-1"
                    >
                        E-posta ile Kayıt Ol
                    </button>
                </form>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-neutral-500 tracking-wide">Alternatif</span>
                    </div>
                </div>

                <SocialAuth />

                <p className="text-center text-sm text-neutral-400 mt-4">
                    Zaten bir hesabınız var mı?{" "}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                        Giriş Yap
                    </Link>
                </p>
            </div>
        </div>
    );
}
