const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("Email skipped: SMTP settings are not configured.");
        return false;
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: String(process.env.SMTP_SECURE || "false") === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to,
            subject,
            text,
            html
        });

        console.log(`Email sent successfully to ${to}`);
        return true;
    } catch (error) {
        // A mail-provider failure must never undo a saved reservation.
        console.error("Email sending failed:", error.message);
        return false;
    }
};

module.exports = sendEmail;
