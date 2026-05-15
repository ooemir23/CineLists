import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const FROM_EMAIL = process.env.MAIL_FROM || "CineLists <info@cinelists.com>";

export const sendPasswordResetEmail = async (email: string, token: string) => {
    if (!resend) {
        console.error("RESEND_API_KEY eksik! Lütfen .env dosyanızı kontrol edin.");
        return;
    }
    const domain = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetLink = `${domain}/reset-password?token=${token}`;

    try {
        const data = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: "Şifrenizi Sıfırlayın",
            html: `
                <div style="background-color: #020617; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #f8fafc; text-align: center;">
                    <div style="max-width: 500px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 32px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                        
                        <!-- Logo -->
                        <div style="margin-bottom: 30px;">
                            <div style="background-color: #fbbf24; width: 60px; height: 60px; border-radius: 18px; margin: 0 auto; display: flex; align-items: center; justify-content: center; line-height: 60px; font-size: 30px;">
                                🎬
                            </div>
                            <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; letter-spacing: -1px; margin-top: 15px; text-transform: uppercase; font-style: italic;">
                                CineLists
                            </h1>
                        </div>

                        <!-- Content -->
                        <h2 style="color: #ffffff; font-size: 22px; font-weight: 800; margin-bottom: 15px; text-transform: uppercase;">
                            Şifre Sıfırlama
                        </h2>
                        <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 30px; text-align: center;">
                            Hesabın için bir şifre sıfırlama talebi aldık. Eğer bu işlemi sen başlattıysan, aşağıdaki butona tıklayarak yeni şifreni belirleyebilirsin.
                        </p>

                        <!-- Action Button -->
                        <a href="${resetLink}" style="display: inline-block; background-color: #fbbf24; color: #020617; padding: 18px 36px; border-radius: 16px; font-weight: 900; text-decoration: none; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; box-shadow: 0 10px 20px rgba(251, 191, 36, 0.2);">
                            Şifremi Sıfırla
                        </a>

                        <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #1e293b;">
                            <p style="color: #64748b; font-size: 12px; line-height: 1.5; text-align: center;">
                                Bu talep senin tarafın yapılmadıysa bu e-postayı silebilirsin.<br>
                                Güvenliğin için bu bağlantı <strong>1 saat</strong> içinde geçerliliğini yitirecektir.
                            </p>
                        </div>
                    </div>
                    
                    <p style="margin-top: 25px; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">
                        © 2026 CineLists • Sinema Sosyal Ağı
                    </p>
                </div>
            `,
        });
    } catch (error) {
        console.error("Email sending error:", error);
        throw new Error("E-posta gönderilemedi.");
    }
};

export const sendRecommendationEmail = async (params: {
    email: string;
    senderName: string;
    senderImage?: string | null;
    mediaTitle: string;
    mediaType: string;
    mediaId: number;
    posterPath: string | null;
    message?: string;
    overview?: string | null;
    runtime?: number | null;
    platforms?: string[];
}) => {
    const { email, senderName, senderImage, mediaTitle, mediaType, mediaId, posterPath, message, overview, runtime, platforms } = params;
    
    if (!resend) {
        console.error("RESEND_API_KEY eksik!");
        return;
    }

    const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const mediaLabel = mediaType === "movie" ? "FİLM" : "DİZİ";
    const posterUrl = posterPath ? `https://image.tmdb.org/t/p/w400${posterPath}` : null;
    const mediaLink = `${domain}/${mediaType}/${mediaId}`;
    const addToWatchlistLink = `${domain}/api/media/action?tmdbId=${mediaId}&type=${mediaType.toUpperCase()}&action=PLAN_TO_WATCH&redirect=true`;

    const formattedRuntime = runtime ? (runtime > 60 ? `${Math.floor(runtime / 60)}s ${runtime % 60}dk` : `${runtime}dk`) : null;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `${senderName} sana bir ${mediaLabel.toLowerCase()} tavsiye etti!`,
            html: `
                <div style="background-color: #020617; padding: 40px 10px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; text-align: center;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 40px; overflow: hidden; box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.7);">
                        
                        <!-- Header Banner -->
                        <div style="background: linear-gradient(to right, #1e293b, #0f172a); padding: 30px 20px; border-bottom: 1px solid #1e293b; position: relative;">
                            <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 20px;">
                                ${senderImage ? 
                                    `<img src="${senderImage}" style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid #fbbf24; object-cover: cover;" />` :
                                    `<div style="width: 44px; height: 44px; border-radius: 50%; background-color: #1e293b; border: 2px solid #fbbf24; line-height: 44px; font-size: 20px;">👤</div>`
                                }
                                <div style="text-align: left;">
                                    <p style="margin: 0; color: #94a3b8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Sana Bir Mesaj Var</p>
                                    <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 900;">${senderName}</p>
                                </div>
                            </div>
                            <h2 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">Sana harika bir tavsiyesi var!</h2>
                        </div>

                        <!-- Content Area -->
                        <div style="padding: 40px 30px;">
                            <div style="display: table; width: 100%; border-collapse: separate; border-spacing: 0;">
                                <div style="display: table-row;">
                                    <!-- Poster Column -->
                                    <div style="display: table-cell; width: 180px; vertical-align: top; padding-right: 30px;">
                                        ${posterUrl ? 
                                            `<img src="${posterUrl}" style="width: 100%; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 40px rgba(0,0,0,0.4);" />` :
                                            `<div style="width: 100%; height: 260px; background-color: #1e293b; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 40px;">🎬</div>`
                                        }
                                    </div>
                                    
                                    <!-- Info Column -->
                                    <div style="display: table-cell; vertical-align: top; text-align: left;">
                                        <div style="display: inline-block; background-color: rgba(251, 191, 36, 0.1); color: #fbbf24; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 900; letter-spacing: 1px; margin-bottom: 10px;">
                                            ${mediaLabel}
                                        </div>
                                        <h3 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0 0 10px 0; line-height: 1.2;">${mediaTitle}</h3>
                                        
                                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                                            ${formattedRuntime ? `
                                                <div style="color: #94a3b8; font-size: 12px; font-weight: 600;">
                                                    🕒 ${formattedRuntime}
                                                </div>
                                            ` : ''}
                                            ${platforms && platforms.length > 0 ? `
                                                <div style="color: #94a3b8; font-size: 12px; font-weight: 600;">
                                                    📺 ${platforms[0]}
                                                </div>
                                            ` : ''}
                                        </div>

                                        ${overview ? `
                                            <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;">
                                                ${overview}
                                            </p>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>

                            ${message ? `
                                <div style="margin-top: 35px; background: rgba(30, 41, 59, 0.5); border: 1px solid #1e293b; border-radius: 24px; padding: 25px; position: relative;">
                                    <div style="position: absolute; top: -12px; left: 30px; background: #fbbf24; color: #020617; padding: 2px 10px; border-radius: 6px; font-size: 9px; font-weight: 900; text-transform: uppercase;">Not</div>
                                    <p style="color: #f8fafc; font-size: 15px; font-weight: 600; font-style: italic; margin: 0; line-height: 1.5;">"${message}"</p>
                                </div>
                            ` : ''}

                            <!-- Actions -->
                            <div style="margin-top: 40px;">
                                <a href="${mediaLink}" style="display: block; background-color: #fbbf24; color: #020617; padding: 20px; border-radius: 20px; font-weight: 900; text-decoration: none; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; margin-bottom: 15px; text-align: center; box-shadow: 0 15px 30px rgba(251, 191, 36, 0.2);">
                                    Detayları İncele
                                </a>
                                <a href="${addToWatchlistLink}" style="display: block; background-color: rgba(255,255,255,0.03); color: #ffffff; padding: 18px; border-radius: 20px; font-weight: 800; text-decoration: none; text-transform: uppercase; font-size: 13px; letter-spacing: 0.5px; border: 1px solid #1e293b; text-align: center;">
                                    ➕ İzleme Listeme Ekle
                                </a>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style="padding: 30px; background-color: rgba(2, 6, 23, 0.4); border-top: 1px solid #1e293b;">
                            <div style="color: #ffffff; font-size: 18px; font-weight: 900; font-style: italic; margin-bottom: 10px; opacity: 0.5;">CineLists</div>
                            <p style="color: #64748b; font-size: 11px; margin: 0;">
                                Bu e-posta sana bir CineLists kullanıcısı tavsiye gönderdiği için iletildi.<br>
                                © 2026 CineLists • Herkes İçin Sinema
                            </p>
                        </div>
                    </div>
                </div>
            `,
        });
    } catch (error: any) {
        console.error("Recommendation email error details:", {
            error: error.message,
            stack: error.stack,
            email,
            mediaTitle
        });
    }
};
