"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState, useTransition } from "react";

type GoogleCredentialResponse = {
    credential?: string;
};

type GooglePromptNotification = {
    isNotDisplayed: () => boolean;
    isSkippedMoment: () => boolean;
    getNotDisplayedReason: () => string;
    getSkippedReason: () => string;
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
        prompt: (momentListener?: (notification: GooglePromptNotification) => void) => void;
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
    const [googleReady, setGoogleReady] = useState(false);
    const [googleError, setGoogleError] = useState<string | null>(null);
    const [googlePrompting, setGooglePrompting] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function initializeGoogle() {
            try {
                const clientResponse = await fetch("/api/auth/google-client-id", { cache: "no-store" });
                if (!clientResponse.ok) throw new Error("Google client id is not configured.");

                const { clientId } = (await clientResponse.json()) as { clientId?: string };
                if (!clientId) throw new Error("Google client id is missing.");

                await loadGoogleScript();
                if (cancelled || !window.google?.accounts?.id) return;

                window.google.accounts.id.initialize({
                    client_id: clientId,
                    auto_select: false,
                    cancel_on_tap_outside: true,
                    use_fedcm_for_prompt: true,
                    callback: (response) => {
                        if (!response.credential) {
                            setGooglePrompting(false);
                            setGoogleError("Google girişi tamamlanamadı.");
                            return;
                        }

                        setGoogleError(null);
                        startTransition(async () => {
                            const result = await signIn("google-identity", {
                                credential: response.credential,
                                redirect: false,
                            });

                            setGooglePrompting(false);

                            if (result?.error) {
                                setGoogleError("Google hesabı doğrulanamadı. Lütfen tekrar deneyin.");
                                return;
                            }

                            window.location.assign("/onboarding");
                        });
                    },
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
    }, [startTransition]);

    const handleGoogleClick = () => {
        if (isPending || googlePrompting) return;

        const googleAccounts = window.google?.accounts?.id;
        if (!googleAccounts || !googleReady) {
            setGoogleError("Google girişi şu anda hazırlanamadı.");
            return;
        }

        setGoogleError(null);
        setGooglePrompting(true);

        try {
            googleAccounts.prompt((notification) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    setGooglePrompting(false);
                }
            });
        } catch (error) {
            console.error("Google prompt failed:", error);
            setGooglePrompting(false);
            setGoogleError("Google girişi şu anda hazırlanamadı.");
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
                <button
                    type="button"
                    onClick={handleGoogleClick}
                    disabled={isPending || googlePrompting || !googleReady}
                    className="group w-full min-h-[96px] rounded-2xl border border-white/10 bg-[#1b2030] px-4 py-3 text-white shadow-[0_14px_35px_rgba(0,0,0,0.28)] transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#21283a] disabled:opacity-60 disabled:hover:translate-y-0"
                >
                    <div className="flex h-full flex-col items-center justify-center gap-2">
                        <svg
                            className="h-9 w-9 select-none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                            focusable="false"
                        >
                            <path
                                fill="#FFC107"
                                d="M43.611 20.083H42V20H24v8h11.303C33.655 32.659 29.353 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.055 0 5.827 1.152 7.927 3.036l5.657-5.657C34.873 6.053 29.708 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                            />
                            <path
                                fill="#FF3D00"
                                d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.055 0 5.827 1.152 7.927 3.036l5.657-5.657C34.873 6.053 29.708 4 24 4c-7.682 0-14.373 4.337-17.694 10.691z"
                            />
                            <path
                                fill="#4CAF50"
                                d="M24 44c5.562 0 10.618-2.122 14.425-5.575l-6.658-5.476C29.905 34.808 27.115 36 24 36c-5.331 0-9.821-3.387-11.427-8.074l-6.53 5.024C9.337 39.556 16.096 44 24 44z"
                            />
                            <path
                                fill="#1976D2"
                                d="M43.611 20.083H42V20H24v8h11.303c-1.287 3.771-4.037 6.774-7.536 8.449l.006-.004 6.658 5.476C33.94 41.523 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                            />
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
