import nodemailer from "nodemailer";
import { logger } from "../lib/logger.js";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface ContactEmailData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  source?: string;
}

export interface LeadEmailData {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  source: string;
}

function htmlWrap(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #0a0a0a; }
    .container { max-width: 600px; margin: 0 auto; background: #111; border: 1px solid #222; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #FF6A00, #FF8C00); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 13px; }
    .body { padding: 32px; }
    .field { margin-bottom: 20px; }
    .field label { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #FF6A00; letter-spacing: 1px; margin-bottom: 6px; }
    .field .value { color: #e5e5e5; font-size: 15px; line-height: 1.5; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 12px 16px; }
    .footer { background: #0a0a0a; padding: 16px 32px; text-align: center; }
    .footer p { color: #555; font-size: 12px; margin: 0; }
    .badge { display: inline-block; background: rgba(255,106,0,0.15); color: #FF6A00; border: 1px solid rgba(255,106,0,0.3); border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Connect Marketing Solutions</h1>
      <p>${title}</p>
    </div>
    <div class="body">
      ${body}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Connect Marketing Solutions · AI-Powered Growth</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendContactNotification(data: ContactEmailData): Promise<boolean> {
  if (!process.env.EMAIL_NOTIFY || !process.env.SMTP_USER) {
    logger.warn("Email not configured — skipping notification");
    return false;
  }

  const body = `
    <div class="field"><label>Name</label><div class="value">${data.name}</div></div>
    <div class="field"><label>Email</label><div class="value">${data.email}</div></div>
    ${data.phone ? `<div class="field"><label>Phone</label><div class="value">${data.phone}</div></div>` : ""}
    <div class="field"><label>Message</label><div class="value">${data.message}</div></div>
    ${data.source ? `<div class="field"><label>Source</label><div class="value"><span class="badge">${data.source}</span></div></div>` : ""}
    <div class="field"><label>Received</label><div class="value">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</div></div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: process.env.EMAIL_NOTIFY,
      subject: `🚀 New Contact Form Submission — ${data.name}`,
      html: htmlWrap("New Contact Form Submission", body),
    });

    // Auto-reply to user
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: data.email,
      subject: "We received your message — Connect Marketing Solutions",
      html: htmlWrap("Thanks for reaching out!", `
        <div class="field"><div class="value">Hi ${data.name},<br><br>
        Thank you for contacting Connect Marketing Solutions! We've received your message and our team will get back to you within <strong style="color:#FF6A00">24 hours</strong> with a custom strategy tailored to your business goals.<br><br>
        In the meantime, feel free to reach us on WhatsApp for faster support.<br><br>
        — The Connect Marketing Team 🚀
        </div></div>
      `),
    });

    logger.info({ to: data.email }, "Contact emails sent");
    return true;
  } catch (err) {
    logger.error({ err }, "Failed to send contact email");
    return false;
  }
}

export async function sendLeadNotification(data: LeadEmailData): Promise<boolean> {
  if (!process.env.EMAIL_NOTIFY || !process.env.SMTP_USER) {
    logger.warn("Email not configured — skipping lead notification");
    return false;
  }

  const body = `
    <div class="field"><label>Name</label><div class="value">${data.name}</div></div>
    <div class="field"><label>Email</label><div class="value">${data.email}</div></div>
    ${data.phone ? `<div class="field"><label>Phone</label><div class="value">${data.phone}</div></div>` : ""}
    ${data.service ? `<div class="field"><label>Interested Service</label><div class="value">${data.service}</div></div>` : ""}
    <div class="field"><label>Lead Source</label><div class="value"><span class="badge">${data.source}</span></div></div>
    <div class="field"><label>Captured At</label><div class="value">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</div></div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: process.env.EMAIL_NOTIFY,
      subject: `🎯 New Lead Captured — ${data.name} (${data.source})`,
      html: htmlWrap("New Lead Captured", body),
    });
    logger.info({ to: data.email, source: data.source }, "Lead notification sent");
    return true;
  } catch (err) {
    logger.error({ err }, "Failed to send lead notification");
    return false;
  }
}
