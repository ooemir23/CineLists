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
    const googleButtonRef = useRef<HTMLDivElement>(null);
    const [isPending, startTransition] = useTransition();
    const [googleReady, setGoogleReady] = useState(false);
    const [googleError, setGoogleError] = useState<string | null>(null);

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
                    logo_alignment: "left",
                    width: 180,
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
                <div className="w-full min-h-[68px] flex items-center justify-center bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                    {!googleReady && (
                        <span className="text-[10px] font-semibold uppercase text-white/50">
                            Google yükleniyor
                        </span>
                    )}
                    <div
                        ref={googleButtonRef}
                        className={isPending ? "pointer-events-none opacity-60" : ""}
                    />
                </div>

                <button
                    type="button"
                    onClick={handleMailClick}
                    disabled={isPending}
                    className="w-full flex flex-col items-center justify-center gap-1 bg-white/5 text-white py-3 rounded-xl hover:bg-white/10 transition-colors border border-white/10 disabled:opacity-50"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    <span className="text-[10px] font-semibold uppercase opacity-60">Mail</span>
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
