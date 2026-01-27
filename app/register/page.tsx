import { signIn } from "@/auth";
import { Film } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
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
                        WatchGo dünyasına katılın.
                    </p>
                </div>

                <form
                    action={async (formData) => {
                        "use server";
                        const email = formData.get("email") as string;
                        await signIn("email", { email, redirectTo: "/onboarding" });
                    }}
                    className="space-y-4"
                >
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
                    <button
                        type="submit"
                        className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98]"
                    >
                        Hesap Oluştur
                    </button>
                </form>

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
