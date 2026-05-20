"use client";

import { signIn } from "next-auth/react";
import { useEffect, useRef, useState, useTransition } from "react";

type GoogleTokenResponse = {
    access_token?: string;
    error?: string;
};

type GoogleTokenClient = {
    requestAccessToken: () => void;
};

type GoogleAccounts = {
    oauth2: {
        initTokenClient: (options: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: unknown) => void;
        }) => GoogleTokenClient;
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

        if (window.google?.accounts?.oauth2) {
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
    const tokenClientRef = useRef<GoogleTokenClient | null>(null);
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
                if (cancelled || !window.google?.accounts?.oauth2) return;

                tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: "openid email profile",
                    callback: (response) => {
                        if (response.error || !response.access_token) {
                            setGoogleError("Google girişi tamamlanamadı.");
                            return;
                        }

                        setGoogleError(null);
                        startTransition(async () => {
                            const result = await signIn("google-identity", {
                                accessToken: response.access_token,
                                redirect: false,
                            });

                            if (result?.error) {
                                setGoogleError("Google hesabı doğrulanamadı. Lütfen tekrar deneyin.");
                                return;
                            }

                            window.location.assign("/onboarding");
                        });
                    },
                    error_callback: (error) => {
                        console.error("Google popup failed:", error);
                        setGoogleError("Google penceresi açılamadı. Lütfen tekrar deneyin.");
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
    }, []);

    const handleGoogleLogin = () => {
        if (!tokenClientRef.current) {
            setGoogleError("Google girişi henüz hazır değil. Lütfen birkaç saniye sonra tekrar deneyin.");
            return;
        }

        setGoogleError(null);
        tokenClientRef.current.requestAccessToken();
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
                    onClick={handleGoogleLogin}
                    disabled={isPending || !googleReady}
                    data-testid="google-identity-login"
                    className="w-full flex flex-col items-center justify-center gap-1 bg-white/5 text-white py-3 rounded-xl hover:bg-white/10 transition-colors border border-white/10 disabled:opacity-50"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 2.09 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    <span className="text-[10px] font-semibold uppercase opacity-60">
                        {googleReady ? "Google" : "Hazırlanıyor"}
                    </span>
                </button>

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
