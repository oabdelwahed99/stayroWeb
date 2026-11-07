import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || "Stayro <noreply@stayro.com>";

  if (!transporter) {
    console.log("\n========== EMAIL (dev) ==========");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(html);
    console.log("=================================\n");
    return { ok: true, dev: true };
  }

  await transporter.sendMail({ from, to, subject, html });
  return { ok: true, dev: false };
}

export function verificationEmailHtml(name: string, url: string, locale: string) {
  const isAr = locale === "ar";
  return `
    <div style="font-family: Tajawal, Arial, sans-serif; direction: ${isAr ? "rtl" : "ltr"};">
      <h2>${isAr ? "مرحباً" : "Hello"} ${name}</h2>
      <p>${isAr ? "يرجى تأكيد بريدك الإلكتروني للمتابعة على ستيرو للملاك." : "Please verify your email to continue on Stayro for Owners."}</p>
      <p><a href="${url}" style="background:#ff6b3d;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
        ${isAr ? "تأكيد البريد" : "Verify email"}
      </a></p>
      <p style="color:#666;font-size:12px;">${url}</p>
    </div>
  `;
}

export function resetPasswordEmailHtml(name: string, url: string, locale: string) {
  const isAr = locale === "ar";
  return `
    <div style="font-family: Tajawal, Arial, sans-serif; direction: ${isAr ? "rtl" : "ltr"};">
      <h2>${isAr ? "مرحباً" : "Hello"} ${name}</h2>
      <p>${isAr ? "اضغط الرابط أدناه لإعادة تعيين كلمة المرور." : "Click the link below to reset your password."}</p>
      <p><a href="${url}" style="background:#ff6b3d;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
        ${isAr ? "تعيين كلمة مرور جديدة" : "Reset password"}
      </a></p>
      <p style="color:#666;font-size:12px;">${url}</p>
    </div>
  `;
}
