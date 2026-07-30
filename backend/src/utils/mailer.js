import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

export async function sendEmail({ to, subject, html, text }) {
  const host = process.env.SMTP_HOST || config.smtp.host || 'smtp.hostinger.com';
  const port = parseInt(process.env.SMTP_PORT || config.smtp.port || '465', 10);
  const user = process.env.SMTP_USER || config.smtp.user || 'support@rukhi.in';
  const pass = process.env.SMTP_PASS || config.smtp.pass || '192357@Rukhi';

  if (!user || !pass) {
    console.warn('[MAILER] SMTP credentials missing. Skipping email dispatch.');
    return null;
  }

  try {
    const isSSL = port === 465;
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: isSSL, // true for port 465 SSL, false for 587 TLS
      auth: {
        user: user.trim(),
        pass: pass ? pass.replace(/\s+/g, '') : '',
      },
      tls: {
        rejectUnauthorized: false, // Prevents self-signed cert handshake blocks
      },
    });

    const info = await transporter.sendMail({
      from: `"rukhi.in Support" <${user}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ''),
      html,
    });
    console.log(`[MAILER] ✅ Email sent cleanly to ${to} (MessageId: ${info.messageId})`);
    return info;
  } catch (err) {
    console.warn(`[MAILER WARNING] Failed sending email to ${to}: ${err.message}`);
    return null;
  }
}

export { sendEmail as sendMail };

