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
        await resend.emails.send({
            from: "CineLists <info@cinelists.com>",
            to: email,
            subject: "Şifrenizi Sıfırlayın",
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
                    <h1 style="color: #f59e0b; text-transform: uppercase; letter-spacing: -0.05em;">CineLists</h1>
                    <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 20px;">Şifre Sıfırlama Talebi</h2>
                    <p style="font-size: 16px; line-height: 24px; margin-bottom: 30px;">
                        Hesabınız için bir şifre sıfırlama talebinde bulunuldu. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:
                    </p>
                    <a href="${resetLink}" style="display: inline-block; background-color: #f59e0b; color: #0f172a; padding: 12px 24px; border-radius: 12px; font-weight: 800; text-decoration: none; text-transform: uppercase; font-size: 14px;">
                        Şifremi Sıfırla
                    </a>
                    <p style="font-size: 14px; color: #64748b; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                        Bu talep sizin tarafınızdan yapılmadıysa bu e-postayı güvenle görmezden gelebilirsiniz. Bağlantının süresi 1 saat içinde dolacaktır.
                    </p>
                </div>
            `,
        });
    } catch (error) {
        console.error("Email sending error:", error);
        throw new Error("E-posta gönderilemedi.");
    }
};
