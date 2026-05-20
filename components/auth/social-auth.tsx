"use client";

import { signIn } from "next-auth/react";
import { useEffect, useRef, useState, useTransition } from "react";

type GoogleCredentialResponse = {
    credential?: string;
};

type GoogleAccounts = {
    id: {
        initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
        }) => void;
        renderButton: (
            element: HTMLElement,
            options: {
                theme?: "outline" | "filled_blue" | "filled_black";
                size?: "large" | "medium" | "small";
                text?: "signin_with" | "signup_with" | "continue_with" | "signin";
                shape?: "rectangular" | "pill" | "circle" | "square";
                logo_alignment?: "left" | "center";
                width?: number;
            }
        ) => void;
        prompt: () => void;
    };
};

declare global {
    interface Window {
        google?: {
            accounts?: GoogleAccounts;
        };
    }
}

function loadGoogleScript() {
    return new Promise<void>((resolve, reject) => {
        const existingScript = document.querySelector<HTMLScriptElement>("script[data-google-identity]");

        if (window.google?.accounts?.id) {
            resolve();
            return;
        }

        if (existingScript) {
            existingScript.addEventListener("load", () => resolve(), { once: true });
            existingScript.addEventListener("error", () => reject(new Error("Google script could not be loaded.")), { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.dataset.googleIdentity = "true";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Google script could not be loaded."));
        document.head.appendChild(script);
    });
}

function GoogleLogo() {
    return (
        <svg
            className="h-8 w-8 select-none"
            viewBox="0 0 48 48"
            aria-hidden="true"
            focusable="false"
        >
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.655 32.659 29.353 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.269 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.269 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.019 0-9.304-3.104-11.082-7.491l-6.571 5.065C9.664 39.653 16.306 44 24 44z" />
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.193 5.238C36.973 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
        </svg>
    );
}

export function SocialAuth() {
    const googleButtonRef = useRef<HTMLDivElement>(null);
    const [isPending, startTransition] = useTransition();
    const [googleReady, setGoogleReady] = useState(false);
    const [googleError, setGoogleError] = useState<string | null>(null);
    const [googleBusy, setGoogleBusy] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function initializeGoogle() {
            try {
                const clientResponse = await fetch("/api/auth/google-client-id", { cache: "no-store" });
                if (!clientResponse.ok) throw new Error("Google client id is not configured.");

                const { clientId } = (await clientResponse.json()) as { clientId?: string };
                if (!clientId) throw new Error("Google client id is missing.");

                await loadGoogleScript();
                if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;

                window.google.accounts.id.initialize({
                    client_id: clientId,
                    auto_select: false,
                    cancel_on_tap_outside: true,
                    use_fedcm_for_prompt: true,
                    callback: (response) => {
                        if (!response.credential) {
                            setGoogleError("Google girişi tamamlanamadı.");
                            return;
                        }

                        setGoogleError(null);
                        startTransition(async () => {
                            const result = await signIn("google-identity", {
                                credential: response.credential,
                                redirect: false,
                            });

                            if (result?.error) {
                                setGoogleError("Google hesabı doğrulanamadı. Lütfen tekrar deneyin.");
                                return;
                            }

                            window.location.assign("/onboarding");
                        });
                    },
                });

                googleButtonRef.current.innerHTML = "";
                window.google.accounts.id.renderButton(googleButtonRef.current, {
                    theme: "outline",
                    size: "large",
                    text: "continue_with",
                    shape: "rectangular",
                    logo_alignment: "center",
                    width: 360,
                });
                setGoogleReady(true);
            } catch (error) {
                console.error("Google Identity Services setup failed:", error);
                if (!cancelled) setGoogleError("Google girişi şu anda hazırlanamadı.");
            }
        }

        initializeGoogle();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleGoogleClick = () => {
        if (isPending || googleBusy || !googleReady) return;

        setGoogleError(null);
        setGoogleBusy(true);

        try {
            window.google?.accounts?.id?.prompt();
        } catch (error) {
            console.error("Google prompt failed:", error);
            setGoogleError("Google girişi şu anda başlatılamadı.");
        } finally {
            window.setTimeout(() => setGoogleBusy(false), 600);
        }
    };

    const handleMailClick = () => {
        const emailInput = document.getElementById("email");
        if (emailInput) {
            emailInput.focus();
            emailInput.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="relative w-full min-h-[96px] overflow-hidden rounded-2xl border border-white/10 bg-[#1b2030] px-4 py-3 text-white shadow-[0_14px_35px_rgba(0,0,0,0.28)] transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#21283a]">
                    <div
                        ref={googleButtonRef}
                        onClick={handleGoogleClick}
                        className={`absolute inset-0 z-20 scale-[3] opacity-0 ${isPending ? "pointer-events-none" : ""}`}
                        aria-hidden="true"
                    />
                    <button
                        type="button"
                        onClick={handleGoogleClick}
                        disabled={isPending || googleBusy || !googleReady}
                        className={`relative z-10 flex h-full w-full flex-col items-center justify-center gap-2 ${!googleReady || isPending ? "opacity-60" : ""}`}
                    >
                        <GoogleLogo />
                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/72">
                            Google
                        </span>
                    </button>
                </div>

                <button
                    type="button"
                    onClick={handleMailClick}
                    disabled={isPending}
                    className="group w-full min-h-[92px] rounded-2xl border border-white/10 bg-[#1a1f2d] px-4 py-3 text-white shadow-[0_14px_35px_rgba(0,0,0,0.28)] transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#202637] disabled:opacity-60 disabled:hover:translate-y-0"
                >
                    <div className="flex h-full flex-col items-center justify-center gap-1">
                        <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                            Mail
                        </span>
                    </div>
                </button>
            </div>

            {googleError && (
                <p className="text-center text-[11px] font-bold text-rose-300">
                    {googleError}
                </p>
            )}
        </div>
    );
}
