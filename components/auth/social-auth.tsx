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
        }) => void;
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

export function SocialAuth() {
    const [isPending, startTransition] = useTransition();
    const [googleError, setGoogleError] = useState<string | null>(null);
    const [googleBusy, setGoogleBusy] = useState(false);
    const googleInitPromiseRef = useRef<Promise<void> | null>(null);
    const googleInitializedRef = useRef(false);

    useEffect(() => {
        return () => {
            // Google auth is initialized lazily on click.
        };
    }, []);

    const initializeGoogle = async () => {
        if (googleInitPromiseRef.current) return googleInitPromiseRef.current;

        googleInitPromiseRef.current = (async () => {
            const clientResponse = await fetch("/api/auth/google-client-id", { cache: "no-store" });
            if (!clientResponse.ok) throw new Error("Google client id is not configured.");

            const { clientId } = (await clientResponse.json()) as { clientId?: string };
            if (!clientId) throw new Error("Google client id is missing.");

            await loadGoogleScript();
            if (!window.google?.accounts?.id) {
                throw new Error("Google accounts API is unavailable.");
            }

            window.google.accounts.id.initialize({
                client_id: clientId,
                auto_select: false,
                cancel_on_tap_outside: true,
                callback: (response) => {
                    if (!response.credential) {
                        setGoogleBusy(false);
                        setGoogleError("Google girişi tamamlanamadı.");
                        return;
                    }

                    setGoogleError(null);
                    startTransition(async () => {
                        const result = await signIn("google-identity", {
                            credential: response.credential,
                            redirect: false,
                        });

                        setGoogleBusy(false);

                        if (result?.error) {
                            setGoogleError("Google hesabı doğrulanamadı. Lütfen tekrar deneyin.");
                            return;
                        }

                        window.location.assign("/onboarding");
                    });
                },
            });

            googleInitializedRef.current = true;
        })();

        try {
            return await googleInitPromiseRef.current;
        } catch (error) {
            googleInitPromiseRef.current = null;
            googleInitializedRef.current = false;
            throw error;
        }
    };

    const handleGoogleClick = () => {
        if (isPending || googleBusy) return;

        setGoogleError(null);
        setGoogleBusy(true);

        initializeGoogle()
            .then(() => {
                window.google?.accounts?.id?.prompt();
            })
            .catch((error) => {
                console.error("Google Identity Services setup failed:", error);
                setGoogleBusy(false);
                setGoogleError("Google girişi şu anda hazırlanamadı.");
            });
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
                <button
                    type="button"
                    onClick={handleGoogleClick}
                    disabled={isPending || googleBusy}
                    className="group relative w-full min-h-[96px] rounded-2xl border border-white/10 bg-[#1b2030] px-4 py-3 text-white shadow-[0_14px_35px_rgba(0,0,0,0.28)] transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#21283a] disabled:opacity-70 disabled:hover:translate-y-0"
                >
                    {googleBusy && (
                        <span className="absolute inset-0 rounded-2xl bg-black/10" />
                    )}
                    <div className="relative flex h-full flex-col items-center justify-center gap-2">
                        <svg
                            className="h-9 w-9 select-none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                            focusable="false"
                        >
                            <path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303C33.655 32.659 29.353 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.055 0 5.827 1.152 7.927 3.036l5.657-5.657C34.873 6.053 29.708 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                            <path fill="#34A853" d="M24 44c5.562 0 10.618-2.122 14.425-5.575l-6.658-5.476C29.905 34.808 27.115 36 24 36c-5.331 0-9.821-3.387-11.427-8.074l-6.53 5.024C9.337 39.556 16.096 44 24 44z" />
                            <path fill="#FBBC05" d="M8.5 16.4l6.8 5.2C16.5 18 19.9 15.5 24 15.5c2.4 0 4.6.9 6.2 2.5l6.3-6.3C33.5 7.8 29.1 6 24 6c-7.7 0-14.3 4.6-17.1 11.3.3-.2.8-.7 1.6-.9z" />
                            <path fill="#EA4335" d="M8.5 16.4c-.7 1.6-1 3.4-1 5.5 0 1.8.3 3.5.9 5l6.8-5.3c-.2-.9-.3-1.7-.3-2.5 0-.9.1-1.8.3-2.7L8.5 16.4z" />
                        </svg>
                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/72">
                            Google
                        </span>
                    </div>
                </button>

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
