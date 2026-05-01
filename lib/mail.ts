import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const sendPasswordResetEmail = async (email: string, token: string) => {
    if (!resend) {
        console.error("RESEND_API_KEY eksik! Lütfen .env dosyanızı kontrol edin.");
        return;
    }
    const domain = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetLink = `${domain}/reset-password?token=${token}`;

    try {
        const data = await resend.emails.send({
            from: "CineLists <info@cinelists.com>",
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
