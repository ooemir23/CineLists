import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const FROM_EMAIL = (process.env.MAIL_FROM && !process.env.MAIL_FROM.includes("onboarding@resend.dev"))
    ? process.env.MAIL_FROM
    : "CineLists <noreply@cinelists.com>";

export function getAppDomain(): string {
    if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
        return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
    }
    if (process.env.AUTH_URL && !process.env.AUTH_URL.includes("localhost")) {
        return process.env.AUTH_URL.replace(/\/$/, "");
    }
    if (process.env.NODE_ENV === "production") {
        return "https://cinelists.com";
    }
    return (process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

export const sendPasswordResetEmail = async (email: string, token: string) => {
    if (!resend) {
        console.error("RESEND_API_KEY eksik! Lütfen .env dosyanızı kontrol edin.");
        throw new Error("E-posta servisi yapilandirilmamis.");
    }
    const domain = getAppDomain();
    const resetLink = `${domain}/reset-password?token=${token}`;

    try {
        const result = await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: "Şifrenizi Sıfırlayın",
            html: `
                <div style="background-color: #020617; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #f8fafc; text-align: center;">
                    <div style="max-width: 500px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 32px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                        
                        <!-- Logo -->
                        <div style="margin-bottom: 30px;">
                            <img src="${domain}/icon-192.png" width="60" height="60" alt="CineLists" style="width: 60px; height: 60px; border-radius: 16px; margin: 0 auto; display: block; border: 1px solid rgba(255, 255, 255, 0.1);" />
                            <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; letter-spacing: -1px; margin-top: 15px; text-transform: uppercase; font-style: italic;">
                                <span style="color: #fbbf24;">cine</span>lists
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
        if (result.error) {
            console.error("Password reset email provider error:", result.error);
            throw new Error("E-posta gonderilemedi.");
        }
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

    const domain = getAppDomain();
    const mediaLabel = mediaType === "movie" ? "FİLM" : "DİZİ";
    const posterUrl = posterPath ? `https://image.tmdb.org/t/p/w400${posterPath}` : null;
    const backdropUrl = backdropPath ? `https://image.tmdb.org/t/p/w780${backdropPath}` : posterUrl;
    const mediaLink = `${domain}/${mediaType}/${mediaId}`;
    const baseUrl = `${domain}/api/media/action?tmdbId=${mediaId}&type=${mediaType.toUpperCase()}&redirect=true`;
    
    const watchlistLink = `${baseUrl}&action=PLAN_TO_WATCH`;
    const watchedLink = `${baseUrl}&action=WATCHED`;
    const watchingLink = `${baseUrl}&action=WATCHING`;

    const formattedRuntime = runtime ? (runtime > 60 ? `${Math.floor(runtime / 60)}s ${runtime % 60}dk` : `${runtime}dk`) : null;

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `${senderName} sana bir ${mediaLabel.toLowerCase()} tavsiye etti!`,
            html: `
                <div style="background-color: #020617; ${backdropUrl ? `background-image: linear-gradient(rgba(2, 6, 23, 0.7), rgba(2, 6, 23, 0.85)), url('${backdropUrl}'); background-size: cover; background-position: center;` : ''} padding: 60px 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; text-align: center; min-height: 100%;">
                    <div style="max-width: 740px; margin: 0 auto; background-color: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.12); border-radius: 40px; overflow: hidden; box-shadow: 0 60px 120px -20px rgba(0, 0, 0, 0.8); text-align: left; backdrop-filter: blur(10px);">
                        
                        <!-- Header with Sender Info -->
                        <div style="padding: 40px 40px 20px 40px; text-align: left;">
                            <div style="display: table; width: 100%;">
                                <div style="display: table-row;">
                                    <div style="display: table-cell; width: 48px; vertical-align: middle; padding-right: 20px;">
                                        ${senderImage ? 
                                            `<img src="${senderImage}" style="width: 48px; height: 48px; border-radius: 16px; border: 2.5px solid #fbbf24; object-fit: cover;" />` :
                                            `<div style="width: 48px; height: 48px; border-radius: 16px; background-color: #fbbf24; color: #020617; line-height: 48px; font-size: 20px; font-weight: 900; text-align: center;">${senderName[0].toUpperCase()}</div>`
                                        }
                                    </div>
                                    <div style="display: table-cell; vertical-align: middle;">
                                        <h2 style="color: #ffffff; font-size: 16px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">${senderName} <span style="color: #94a3b8; font-weight: 500; font-size: 14px; margin-left: 5px;">sana bir öneride bulundu</span></h2>
                                        <p style="color: #fbbf24; font-size: 11px; font-weight: 800; margin-top: 2px; text-transform: uppercase; letter-spacing: 1px;">Sana harika bir tavsiyesi var!</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Main Grid Layout -->
                        <div style="padding: 20px 40px 10px 40px;">
                            <div style="display: table; width: 100%; border-collapse: separate; border-spacing: 0;">
                                <div style="display: table-row;">
                                    
                                    <!-- Column 1: Poster & Label/Platforms -->
                                    <div style="display: table-cell; width: 160px; vertical-align: top; padding-right: 30px;">
                                        <a href="${mediaLink}" style="text-decoration: none; border: none; outline: none;">
                                            ${posterUrl ? 
                                                `<img src="${posterUrl}" style="width: 160px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 40px rgba(0,0,0,0.5);" />` :
                                                `<div style="width: 160px; height: 240px; background-color: rgba(255,255,255,0.05); border-radius: 20px;"></div>`
                                            }
                                        </a>
                                        <div style="margin-top: 15px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap;">
                                            <div style="background: #fbbf24; color: #020617; padding: 4px 10px; border-radius: 6px; font-size: 9px; font-weight: 900; text-transform: uppercase; white-space: nowrap;">${mediaLabel}</div>
                                            
                                            ${platforms && platforms.length > 0 ? `
                                                <div style="display: inline-flex; align-items: center; gap: 6px;">
                                                    ${platforms.slice(0, 3).map(p => `
                                                        <div style="background: rgba(255,255,255,0.08); padding: 4px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);" title="${p.name}">
                                                            ${p.logo ? `<img src="https://image.tmdb.org/t/p/w92${p.logo}" style="width: 16px; height: 16px; border-radius: 3px; display: block;" />` : ''}
                                                        </div>
                                                    `).join('')}
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>

                                    <!-- Column 2: Summary -->
                                    <div style="display: table-cell; vertical-align: top; padding-right: 30px;">
                                        <a href="${mediaLink}" style="text-decoration: none; color: inherit; display: block;">
                                            <h3 style="color: #ffffff; font-size: 26px; font-weight: 900; margin: 0 0 10px 0; line-height: 1.1; letter-spacing: -0.8px;">${mediaTitle}</h3>
                                            
                                            <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 12px;">
                                                <span style="color: #94a3b8; font-size: 13px; font-weight: 800;">⭐ TMDB: ${globalRating?.toFixed(1) || '0.0'}</span>
                                                ${senderRating ? `<span style="color: #fbbf24; font-size: 13px; font-weight: 800;">🎬 Puanı: ${senderRating}/10</span>` : ''}
                                                ${formattedRuntime ? `<span style="color: #94a3b8; font-size: 13px; font-weight: 600;">⏱️ ${formattedRuntime}</span>` : ''}
                                            </div>

                                            <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0; font-weight: 500;">
                                                ${overview ? (overview.length > 250 ? overview.substring(0, 250) + '...' : overview) : 'Bu içerik hakkında özet bulunmuyor.'}
                                            </p>
                                        </a>
                                    </div>

                                    <!-- Column 3: Actions -->
                                    <div style="display: table-cell; width: 220px; vertical-align: top;">
                                        <div style="display: table; width: 100%; border-collapse: separate; border-spacing: 0;">
                                            <div style="display: table-row;">
                                                <div style="display: table-cell; width: 50%; padding-right: 5px;">
                                                    <a href="${watchedLink}" style="display: block; background-color: rgba(34, 197, 94, 0.1); color: #22c55e; padding: 12px; border-radius: 14px; font-weight: 800; text-decoration: none; text-transform: uppercase; font-size: 10px; border: 1px solid rgba(34, 197, 94, 0.2); text-align: center;">✅ İzledim</a>
                                                </div>
                                                <div style="display: table-cell; width: 50%; padding-left: 5px;">
                                                    <a href="${watchingLink}" style="display: block; background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 12px; border-radius: 14px; font-weight: 800; text-decoration: none; text-transform: uppercase; font-size: 10px; border: 1px solid rgba(59, 130, 246, 0.2); text-align: center;">📺 İzliyorum</a>
                                                </div>
                                            </div>
                                        </div>

                                        <a href="${watchlistLink}" style="display: block; background-color: rgba(255,255,255,0.05); color: #ffffff; padding: 12px; border-radius: 14px; font-weight: 800; text-decoration: none; text-transform: uppercase; font-size: 11px; border: 1px solid rgba(255,255,255,0.1); text-align: center; margin-top: 10px;">➕ Listeme Ekle</a>
                                    </div>

                                </div>
                            </div>
                        </div>

                        <!-- Thoughts Section (Bottom Full Width) -->
                        ${message ? `
                            <div style="padding: 0 40px 10px 40px;">
                                <div style="padding: 20px; background: rgba(255, 255, 255, 0.03); border-left: 4px solid #fbbf24; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);">
                                    <p style="margin: 0; color: #fbbf24; font-size: 9px; font-weight: 900; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">DÜŞÜNCELERİ</p>
                                    <p style="margin: 0; color: #f8fafc; font-size: 14px; font-weight: 500; font-style: italic; line-height: 1.5;">"${message}"</p>
                                </div>
                            </div>
                        ` : ''}

                        <!-- Branding inside card -->
                        <div style="padding: 10px 40px 30px 40px; text-align: center;">
                            <span style="color: #ffffff; font-size: 18px; font-weight: 900; font-style: italic; opacity: 0.35;">CineLists</span>
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

    const domain = getAppDomain();

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

export const sendFollowerEmail = async (params: {
    toEmail: string;
    recipientName: string;
    followerName: string;
    followerUsername?: string;
    followerImage?: string | null;
    followerId: string;
}) => {
    const { toEmail, recipientName, followerName, followerUsername, followerImage, followerId } = params;

    const client = resend || (process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null);
    if (!client) {
        console.warn("[Mail] RESEND_API_KEY eksik, takipçi e-postası gönderilemedi.");
        return;
    }

    const domain = getAppDomain();
    const profileLink = `${domain}/profile/${followerId}`;
    const initials = followerName ? followerName.slice(0, 2).toUpperCase() : "CL";

    try {
        await client.emails.send({
            from: FROM_EMAIL,
            to: toEmail,
            subject: `🎬 ${followerName} seni CineLists'te takip etmeye başladı!`,
            html: `
                <div style="background-color: #020617; padding: 40px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; text-align: center;">
                    <div style="max-width: 540px; margin: 0 auto; background-color: #0f172a; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 28px; padding: 36px 24px; box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.7);">
                        
                        <!-- Logo Header -->
                        <div style="margin-bottom: 28px;">
                            <img src="${domain}/icon-192.png" width="48" height="48" alt="CineLists" style="width: 48px; height: 48px; border-radius: 14px; margin: 0 auto 12px auto; display: block; border: 1px solid rgba(255, 255, 255, 0.1);" />
                            <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; margin: 0; text-transform: uppercase; font-style: italic;">
                                <span style="color: #fbbf24;">cine</span>lists
                            </h1>
                        </div>

                        <!-- Follower Card -->
                        <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 24px; margin-bottom: 24px;">
                            <div style="margin-bottom: 16px;">
                                ${followerImage ? `
                                    <img src="${followerImage}" width="72" height="72" alt="${followerName}" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; margin: 0 auto; display: block; border: 3px solid #fbbf24; box-shadow: 0 8px 16px rgba(251, 191, 36, 0.2);" />
                                ` : `
                                    <div style="width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #fbbf24, #d97706); color: #020617; line-height: 72px; font-size: 24px; font-weight: 900; margin: 0 auto; display: block; box-shadow: 0 8px 16px rgba(251, 191, 36, 0.2);">
                                        ${initials}
                                    </div>
                                `}
                            </div>
                            
                            <h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 0 0 4px 0;">
                                ${followerName}
                            </h2>
                            ${followerUsername ? `
                                <p style="color: #fbbf24; font-size: 13px; font-weight: 700; margin: 0 0 12px 0;">
                                    @${followerUsername}
                                </p>
                            ` : ''}
                            
                            <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin: 0;">
                                Merhaba <strong>${recipientName}</strong>, CineLists sinema topluluğunda yeni bir takipçin var! Artık izlediğin filmleri, dizi bölümlerini ve incelemelerini takip edebilecek.
                            </p>
                        </div>

                        <!-- CTA Button -->
                        <div style="margin-bottom: 28px;">
                            <a href="${profileLink}" style="display: inline-block; background-color: #fbbf24; color: #020617; padding: 15px 32px; border-radius: 14px; font-weight: 900; text-decoration: none; text-transform: uppercase; font-size: 13px; letter-spacing: 0.5px; box-shadow: 0 8px 24px rgba(251, 191, 36, 0.25);">
                                Profili İncele & Geri Takip Et ↗
                            </a>
                        </div>

                        <!-- Footer notes -->
                        <div style="padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
                            <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.4;">
                                Bu bildirimi CineLists hesabına kayıtlı olduğun için aldın.<br>
                                <a href="${domain}/settings" style="color: #94a3b8; text-decoration: underline;">Bildirim ayarlarını</a> dilediğin zaman güncelleyebilirsin.
                            </p>
                        </div>
                    </div>

                    <p style="margin-top: 20px; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px;">
                        © 2026 CineLists • Sinema ve Dizi Sosyal Ağı
                    </p>
                </div>
            `,
        });
    } catch (err: any) {
        console.error("[Mail] sendFollowerEmail error:", err?.message || err);
    }
};

export const sendCommentNotificationEmail = async (params: {
    toEmail: string;
    recipientName: string;
    commenterName: string;
    commentContent: string;
    mediaTitle: string;
    mediaLink: string;
}) => {
    const { toEmail, recipientName, commenterName, commentContent, mediaTitle, mediaLink } = params;

    const client = resend || (process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null);
    if (!client) return;

    const domain = getAppDomain();
    const fullLink = mediaLink.startsWith("http") ? mediaLink : `${domain}${mediaLink}`;

    try {
        await client.emails.send({
            from: FROM_EMAIL,
            to: toEmail,
            subject: `💬 ${commenterName}, ${mediaTitle} paylaşımına yorum yaptı`,
            html: `
                <div style="background-color: #020617; padding: 40px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; text-align: center;">
                    <div style="max-width: 540px; margin: 0 auto; background-color: #0f172a; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 28px; padding: 36px 24px; box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.7);">
                        <div style="margin-bottom: 24px;">
                            <h1 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 0; text-transform: uppercase; font-style: italic;">
                                <span style="color: #fbbf24;">cine</span>lists
                            </h1>
                        </div>
                        <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 20px; margin-bottom: 24px; text-align: left;">
                            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 10px 0;">
                                Merhaba <strong>${recipientName}</strong>, <strong>${commenterName}</strong> içeriğine bir yorum bıraktı:
                            </p>
                            <blockquote style="margin: 0; padding: 12px 16px; background-color: rgba(0, 0, 0, 0.3); border-left: 3px solid #fbbf24; border-radius: 8px; color: #ffffff; font-size: 14px; font-style: italic;">
                                "${commentContent}"
                            </blockquote>
                        </div>
                        <div style="margin-bottom: 24px;">
                            <a href="${fullLink}" style="display: inline-block; background-color: #fbbf24; color: #020617; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px;">
                                Yorumu Gör ve Yanıtla ↗
                            </a>
                        </div>
                    </div>
                </div>
            `,
        });
    } catch (err: any) {
        console.error("[Mail] sendCommentNotificationEmail error:", err?.message || err);
    }
};
