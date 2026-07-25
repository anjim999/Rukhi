import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

export async function sendEmail({ to, subject, html, text }) {
  if (!config.smtp.user || !config.smtp.pass) {
    console.warn('[MAILER] SMTP credentials missing. Skipping email dispatch.');
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: false, // TLS via port 587
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass ? config.smtp.pass.replace(/\s+/g, '') : '',
      },
    });

    const info = await transporter.sendMail({
      from: `"Auto Captions" <${config.smtp.user}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ''),
      html,
    });
    console.log(`[MAILER] Email sent cleanly to ${to} (MessageId: ${info.messageId})`);
    return info;
  } catch (err) {
    console.warn(`[MAILER WARNING] Failed sending email to ${to}: ${err.message}`);
    return null;
  }
}
