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
    platforms?: { name: string, logo?: string }[];
    senderRating?: number | null;
    globalRating?: number | null;
    backdropPath?: string | null;
}) => {
    const { email, senderName, senderImage, mediaTitle, mediaType, mediaId, posterPath, message, overview, runtime, platforms, senderRating, globalRating, backdropPath } = params;
    
    if (!resend) {
        console.error("RESEND_API_KEY eksik!");
        return;
    }

    const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const mediaLabel = mediaType === "movie" ? "FİLM" : "DİZİ";
    const posterUrl = posterPath ? `https://image.tmdb.org/t/p/w400${posterPath}` : null;
    const backdropUrl = backdropPath ? `https://image.tmdb.org/t/p/w780${backdropPath}` : posterUrl;
    const mediaLink = `${domain}/${mediaType}/${mediaId}`;
    const addToWatchlistLink = `${domain}/api/media/action?tmdbId=${mediaId}&type=${mediaType.toUpperCase()}&action=PLAN_TO_WATCH&redirect=true`;

    const formattedRuntime = runtime ? (runtime > 60 ? `${Math.floor(runtime / 60)}s ${runtime % 60}dk` : `${runtime}dk`) : null;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `${senderName} sana bir ${mediaLabel.toLowerCase()} tavsiye etti!`,
            html: `
                <div style="background-color: #020617; padding: 40px 10px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 40px; overflow: hidden; box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.7); position: relative;">
                        
                        <!-- Background Backdrop -->
                        ${backdropUrl ? `
                        <div style="position: absolute; top: 0; left: 0; right: 0; height: 300px; z-index: 0; overflow: hidden; opacity: 0.2;">
                            <img src="${backdropUrl}" style="width: 100%; height: 100%; object-fit: cover; filter: blur(20px);" />
                            <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, transparent, #0f172a);"></div>
                        </div>
                        ` : ''}

                        <div style="position: relative; z-index: 1;">
                            <!-- Header -->
                            <div style="padding: 30px 20px; text-align: center;">
                                <div style="display: inline-flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 20px; background: rgba(30, 41, 59, 0.5); padding: 10px 20px; border-radius: 100px; border: 1px solid rgba(255,255,255,0.05);">
                                    ${senderImage ? 
                                        `<img src="${senderImage}" style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid #fbbf24; object-fit: cover;" />` :
                                        `<div style="width: 32px; height: 32px; border-radius: 50%; background-color: #1e293b; border: 2px solid #fbbf24; line-height: 32px; font-size: 16px; text-align: center;">👤</div>`
                                    }
                                    <span style="color: #ffffff; font-size: 14px; font-weight: 800;">${senderName}</span>
                                </div>
                                <h2 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -1px;">Sana harika bir tavsiyesi var!</h2>
                            </div>

                            <!-- Content -->
                            <div style="padding: 0 30px 40px 30px;">
                                <div style="display: table; width: 100%; border-collapse: separate; border-spacing: 0;">
                                    <div style="display: table-row;">
                                        <!-- Poster -->
                                        <div style="display: table-cell; width: 200px; vertical-align: top; padding-right: 30px;">
                                            ${posterUrl ? 
                                                `<img src="${posterUrl}" style="width: 100%; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 30px 60px -12px rgba(0,0,0,0.5);" />` :
                                                `<div style="width: 100%; height: 280px; background-color: #1e293b; border-radius: 24px;"></div>`
                                            }
                                        </div>
                                        
                                        <!-- Details -->
                                        <div style="display: table-cell; vertical-align: top; text-align: left;">
                                            <div style="background: #fbbf24; color: #020617; padding: 4px 10px; border-radius: 6px; font-size: 9px; font-weight: 900; display: inline-block; margin-bottom: 10px;">${mediaLabel}</div>
                                            <h3 style="color: #ffffff; font-size: 26px; font-weight: 900; margin: 0 0 12px 0; line-height: 1.1;">${mediaTitle}</h3>
                                            
                                            <div style="margin-bottom: 15px;">
                                                <span style="color: #94a3b8; font-size: 13px; font-weight: 700;">⭐ TMDB: ${globalRating?.toFixed(1) || '0.0'}</span>
                                                ${senderRating ? `
                                                    <span style="color: #fbbf24; font-size: 13px; font-weight: 700; margin-left: 15px;">👤 Senin Puanın: ${senderRating}</span>
                                                ` : ''}
                                            </div>

                                            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; color: #64748b; font-size: 12px; font-weight: 600;">
                                                ${formattedRuntime ? `<span>🕒 ${formattedRuntime}</span>` : ''}
                                            </div>

                                            ${overview ? `
                                                <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0 0 20px 0;">${overview}</p>
                                            ` : ''}

                                            <!-- Platforms -->
                                            ${platforms && platforms.length > 0 ? `
                                                <div style="display: flex; align-items: center; gap: 10px;">
                                                    ${platforms.slice(0, 3).map(p => `
                                                        <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.05); padding: 6px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                                                            ${p.logo ? `<img src="https://image.tmdb.org/t/p/w92${p.logo}" style="width: 16px; height: 16px; border-radius: 4px;" />` : ''}
                                                            <span style="color: #ffffff; font-size: 11px; font-weight: 800;">${p.name}</span>
                                                        </div>
                                                    `).join('')}
                                                </div>
                                            ` : ''}

                                            <!-- Moved Thoughts & Buttons here -->
                                            ${message ? `
                                                <div style="margin-top: 30px; padding: 20px; background: rgba(251, 191, 36, 0.05); border-left: 4px solid #fbbf24; border-radius: 16px;">
                                                    <p style="margin: 0; color: #fbbf24; font-size: 10px; font-weight: 900; text-transform: uppercase; margin-bottom: 6px;">DÜŞÜNCELERİ</p>
                                                    <p style="margin: 0; color: #f8fafc; font-size: 14px; font-weight: 500; font-style: italic; line-height: 1.4;">"${message}"</p>
                                                </div>
                                            ` : ''}

                                            <div style="margin-top: 30px;">
                                                <a href="${mediaLink}" style="display: block; background-color: #fbbf24; color: #020617; padding: 18px; border-radius: 16px; font-weight: 900; text-decoration: none; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; margin-bottom: 12px; text-align: center;">Detayları İncele</a>
                                                <a href="${addToWatchlistLink}" style="display: block; background-color: rgba(255,255,255,0.03); color: #ffffff; padding: 16px; border-radius: 16px; font-weight: 800; text-decoration: none; text-transform: uppercase; font-size: 12px; border: 1px solid #1e293b; text-align: center;">➕ İzleme Listeme Ekle</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div style="padding: 30px; text-align: center; border-top: 1px solid #1e293b;">
                                <span style="color: #ffffff; font-size: 18px; font-weight: 900; font-style: italic; opacity: 0.5;">CineLists</span>
                            </div>
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

export const sendDailyReminderEmail = async (email: string, userName: string, shows: { title: string, posterPath: string | null, episodeInfo: string, platforms: string[] }[]) => {
    if (!resend) return;

    const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `🍿 Bugün Yayında! Senin için ${shows.length} yeni bölüm var`,
            html: `
                <div style="background-color: #020617; padding: 40px 10px; font-family: 'Inter', sans-serif; color: #f8fafc; text-align: center;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 40px; overflow: hidden; box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.7);">
                        
                        <!-- Header -->
                        <div style="padding: 40px 20px; background: linear-gradient(to bottom, #1e293b, #0f172a);">
                            <div style="background-color: #fbbf24; width: 60px; height: 60px; border-radius: 20px; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center; font-size: 30px; line-height: 60px;">🍿</div>
                            <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -1px;">GÜNAYDIN ${userName.toUpperCase()}!</h1>
                            <p style="color: #94a3b8; font-size: 14px; font-weight: 600; margin-top: 10px;">Takip ettiğin dizilerin yeni bölümleri bugün yayında.</p>
                        </div>

                        <!-- Shows List -->
                        <div style="padding: 30px;">
                            ${shows.map(show => `
                                <div style="display: table; width: 100%; margin-bottom: 25px; background: rgba(255,255,255,0.02); border: 1px solid #1e293b; border-radius: 24px; padding: 15px; text-align: left;">
                                    <div style="display: table-row;">
                                        <div style="display: table-cell; width: 80px; vertical-align: middle;">
                                            <img src="https://image.tmdb.org/t/p/w200${show.posterPath}" style="width: 80px; border-radius: 12px;" />
                                        </div>
                                        <div style="display: table-cell; vertical-align: middle; padding-left: 20px;">
                                            <h3 style="color: #ffffff; font-size: 18px; font-weight: 800; margin: 0;">${show.title}</h3>
                                            <p style="color: #fbbf24; font-size: 13px; font-weight: 700; margin: 5px 0;">${show.episodeInfo}</p>
                                            <div style="color: #64748b; font-size: 11px; font-weight: 600;">
                                                ${show.platforms.join(' • ')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}

                            <a href="${domain}/calendar" style="display: block; background-color: #fbbf24; color: #020617; padding: 20px; border-radius: 20px; font-weight: 900; text-decoration: none; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; margin-top: 20px; text-align: center;">
                                Takvimi Görüntüle
                            </a>
                        </div>

                        <!-- Footer -->
                        <div style="padding: 30px; border-top: 1px solid #1e293b; opacity: 0.5;">
                            <span style="color: #ffffff; font-size: 16px; font-weight: 900; font-style: italic;">CineLists</span>
                        </div>
                    </div>
                </div>
            `
        });
    } catch (error) {
        console.error("Daily reminder email error:", error);
    }
};
