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
            ? "Ad, e-posta ve şifre zorunludur."
            : params.error === "weak"
                ? "Şifre en az 6 karakter olmalıdır."
                : params.error === "exists"
                    ? "Bu e-posta zaten kayıtlı."
                    : null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm space-y-8 bg-card p-8 rounded-2xl border border-white/10 shadow-2xl">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary/20 p-3 rounded-xl">
                            <Film className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Kayıt Ol</h2>
                    <p className="mt-2 text-sm text-neutral-400">
                        cinelists dünyasına katılın.
                    </p>
                </div>

                {errorMessage && (
                    <div className="rounded-xl border border-red-400/30 bg-red-500/10 text-red-200 text-sm font-medium px-4 py-3">
                        {errorMessage}
                    </div>
                )}

                <form action={registerUser} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-neutral-400 ml-1">
                            Ad
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Adın"
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-neutral-400 ml-1">
                            E-posta
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="ornek@mail.com"
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
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
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98]"
                    >
                        E-posta ile Kayıt Ol
                    </button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-neutral-500">Alternatif Kayıt</span>
                    </div>
                </div>

                <SocialAuth />

                <p className="text-center text-sm text-neutral-400">
                    Zaten bir hesabınız var mı?{" "}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                        Giriş Yap
                    </Link>
                </p>
            </div>
        </div>
    );
}
