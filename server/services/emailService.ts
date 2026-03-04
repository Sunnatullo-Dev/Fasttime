import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

export const sendResetPasswordEmail = async (email: string, token: string) => {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;

    // If SMTP is not configured, log to console
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.log("---------------------------------------");
        console.log("RESET PASSWORD EMAIL SIMULATION");
        console.log(`To: ${email}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log("---------------------------------------");
        return;
    }

    const mailOptions = {
        from: `"FastTime" <${SMTP_USER}>`,
        to: email,
        subject: "Parolni tiklash - FastTime",
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2d3748;">Salom!</h2>
        <p style="color: #4a5568;">Sizning FastTime hisobingiz uchun parolni tiklash so'rovi yuborildi.</p>
        <p style="color: #4a5568;">Parolingizni tiklash uchun quyidagi tugmani bosing:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Parolni tiklash</a>
        </div>
        <p style="color: #4a5568;">Ushbu havola 15 daqiqa davomida amal qiladi.</p>
        <p style="color: #4a5568;">Agar siz ushbu so'rovni yubormagan bo'lsangiz, hech qanday chora ko'rish shart emas.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="font-size: 12px; color: #a0aec0;">Agar tugma ishlamasa, quyidagi havolani nusxalang va brauzeringizga kiriting:</p>
        <p style="font-size: 12px; color: #a0aec0;">${resetUrl}</p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Reset email sent to: ${email}`);
    } catch (error) {
        console.error("Error sending reset password email:", error);
        throw new Error("Emailni yuborib bo'lmadi");
    }
};
