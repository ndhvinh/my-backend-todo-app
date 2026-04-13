import nodemailer from "nodemailer";

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } =
    process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP is not configured");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

export async function sendVerificationEmail({ to, code }) {
  const transporter = createTransporter();
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
  const appName = process.env.APP_NAME || "Todo App";

  await transporter.sendMail({
    from: `${appName} <${fromAddress}>`,
    to,
    subject: `${appName} - Verification code`,
    text: `Your verification code is ${code}. The code expires in 15 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>${appName} verification code</h2>
        <p>Your verification code is:</p>
        <div style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</div>
        <p>This code expires in 15 minutes.</p>
      </div>
    `,
  });
}
