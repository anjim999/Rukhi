import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { query } from '../db/pool.js';
import { config } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendEmail } from '../utils/mailer.js';

/**
 * Sign JWT token for user
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

/**
 * Register a new user with email and password
 */
export async function registerUser({ name, email, password }) {
  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required.', 400);
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters long.', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if user exists
  const existingRes = await query(`SELECT id FROM users WHERE LOWER(email) = $1`, [normalizedEmail]);
  if (existingRes.rows.length > 0) {
    throw new AppError('An account with this email already exists.', 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = uuidv4();

  const insertRes = await query(
    `INSERT INTO users (id, name, email, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, avatar_url, created_at`,
    [userId, name.trim(), normalizedEmail, passwordHash]
  );

  const user = insertRes.rows[0];
  const token = generateToken(user);

  // Send Welcome Email
  try {
    const welcomeHtml = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #09090b; color: #ffffff; border-radius: 16px; border: 1px solid #27272a;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #facc15; font-size: 32px; font-weight: 800; margin: 0;">Rocky Captions</h1>
          <p style="color: #a1a1aa; font-size: 16px; margin-top: 8px;">Your AI Reel Studio</p>
        </div>
        <div style="background-color: #18181b; padding: 30px; border-radius: 12px; border: 1px solid #3f3f46;">
          <h2 style="font-size: 24px; margin-top: 0;">Welcome aboard, ${user.name}! 🚀</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #d4d4d8;">
            We're thrilled to have you! You now have access to the ultimate AI-powered captioning engine. 
            Turn your raw videos into viral masterpieces in seconds.
          </p>
          <ul style="color: #d4d4d8; font-size: 15px; line-height: 1.8; margin-top: 20px; padding-left: 20px;">
            <li>✨ <strong>100% Accurate Sync:</strong> Zero drift, sample-accurate timelines.</li>
            <li>🎨 <strong>Viral Styles:</strong> Hormozi, MrBeast, and Gold Luxury presets.</li>
            <li>🌍 <strong>Multi-Lingual:</strong> English, Telugu, Hindi, and Teluglish support.</li>
          </ul>
          <div style="text-align: center; margin-top: 35px;">
            <a href="${(process.env.FRONTEND_URL || '').split(',')[0].trim()}" style="display: inline-block; background-color: #facc15; color: #000000; font-weight: 700; font-size: 16px; padding: 14px 32px; border-radius: 8px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">Create Your First Reel</a>
          </div>
        </div>
        <p style="text-align: center; color: #71717a; font-size: 13px; margin-top: 30px;">
          © ${new Date().getFullYear()} Rocky Captions. All rights reserved.
        </p>
      </div>
    `;
    await sendEmail({
      to: normalizedEmail,
      subject: '🚀 Welcome to Rocky Captions! Your AI Studio is ready.',
      html: welcomeHtml,
    });
  } catch (err) {
    console.error('[MAILER] Welcome email failed silently:', err.message);
  }

  return { user, token };
}

/**
 * Login user with email and password
 */
export async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new AppError('Email and password are required.', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const res = await query(
    `SELECT id, name, email, password_hash, avatar_url FROM users WHERE LOWER(email) = $1`,
    [normalizedEmail]
  );

  if (res.rows.length === 0) {
    throw new AppError('Invalid email or password.', 401);
  }

  const user = res.rows[0];
  if (!user.password_hash) {
    throw new AppError('This account was created with Google Sign In. Please use Google to log in.', 400);
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = generateToken(user);
  const { password_hash, ...userWithoutPassword } = user;

  // Send Login Alert Email
  try {
    const loginHtml = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #09090b; color: #ffffff; border-radius: 16px; border: 1px solid #27272a;">
        <h2 style="color: #facc15; text-align: center; font-size: 24px; font-weight: 800; margin-bottom: 30px;">🔒 New Login Detected</h2>
        <div style="background-color: #18181b; padding: 25px; border-radius: 12px; border: 1px solid #3f3f46;">
          <p style="font-size: 16px; color: #d4d4d8; margin-top: 0;">Hi ${user.name},</p>
          <p style="font-size: 15px; color: #a1a1aa; line-height: 1.6;">
            We noticed a new login to your Rocky Captions account. If this was you, you can safely ignore this email.
          </p>
          <div style="background-color: #27272a; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px; color: #e4e4e7;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="font-size: 14px; color: #ef4444; margin-top: 20px; line-height: 1.5;">
            If you did not authorize this login, please reset your password immediately to secure your account.
          </p>
        </div>
      </div>
    `;
    await sendEmail({
      to: normalizedEmail,
      subject: '🔒 Security Alert: New Login to Rocky Captions',
      html: loginHtml,
    });
  } catch (err) {
    console.error('[MAILER] Login alert email failed silently:', err.message);
  }

  return { user: userWithoutPassword, token };
}

/**
 * Authenticate or provision user via Google OAuth
 */
export async function googleAuth({ googleId, email, name, avatarUrl }) {
  if (!email) {
    throw new Error('Google authentication requires a valid email address.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Search by google_id or email
  const existingRes = await query(
    `SELECT id, name, email, avatar_url FROM users WHERE google_id = $1 OR LOWER(email) = $2`,
    [googleId || '', normalizedEmail]
  );

  let user;

  if (existingRes.rows.length > 0) {
    user = existingRes.rows[0];
    // Update google_id / avatar_url if missing
    await query(
      `UPDATE users SET google_id = COALESCE(google_id, $1), avatar_url = COALESCE(avatar_url, $2) WHERE id = $3`,
      [googleId || null, avatarUrl || null, user.id]
    );
  } else {
    // Create new user
    const userId = uuidv4();
    const insertRes = await query(
      `INSERT INTO users (id, name, email, google_id, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, avatar_url, created_at`,
      [userId, name || 'Google User', normalizedEmail, googleId || null, avatarUrl || null]
    );
    user = insertRes.rows[0];

    // Send Welcome Email for new Google signups
    try {
      const welcomeHtml = `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #09090b; color: #ffffff; border-radius: 16px; border: 1px solid #27272a;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #facc15; font-size: 32px; font-weight: 800; margin: 0;">Rocky Captions</h1>
            <p style="color: #a1a1aa; font-size: 16px; margin-top: 8px;">Your AI Reel Studio</p>
          </div>
          <div style="background-color: #18181b; padding: 30px; border-radius: 12px; border: 1px solid #3f3f46;">
            <h2 style="font-size: 24px; margin-top: 0;">Welcome aboard, ${user.name}! 🚀</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #d4d4d8;">
              You successfully joined using Google. You now have access to the ultimate AI-powered captioning engine.
            </p>
            <div style="text-align: center; margin-top: 35px;">
              <a href="${(process.env.FRONTEND_URL || '').split(',')[0].trim()}" style="display: inline-block; background-color: #facc15; color: #000000; font-weight: 700; font-size: 16px; padding: 14px 32px; border-radius: 8px; text-decoration: none; text-transform: uppercase;">Launch Studio</a>
            </div>
          </div>
        </div>
      `;
      await sendEmail({
        to: normalizedEmail,
        subject: '🚀 Welcome to Rocky Captions! Your AI Studio is ready.',
        html: welcomeHtml,
      });
    } catch (err) {
      console.error('[MAILER] Welcome email failed silently:', err.message);
    }
  }

  const token = generateToken(user);

  return { user, token };
}

/**
 * Request password reset token
 */
export async function forgotPassword(email) {
  if (!email) {
    throw new AppError('Email is required.', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const res = await query(`SELECT id, name FROM users WHERE LOWER(email) = $1`, [normalizedEmail]);

  if (res.rows.length === 0) {
    return { message: 'If an account with that email exists, password reset instructions have been sent.' };
  }

  const user = res.rows[0];
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 3600000); // 1 hour

  await query(
    `UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3`,
    [resetToken, expiry.toISOString(), user.id]
  );

  const appFrontendUrl = (process.env.FRONTEND_URL || '').split(',')[0].trim();
  const resetUrl = `${appFrontendUrl}/reset-password?token=${resetToken}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; background: #09090b; color: #fff; border-radius: 12px;">
      <h2 style="color: #facc15;">Auto Captions — Password Reset Request</h2>
      <p>Hello ${user.name || 'User'},</p>
      <p>We received a request to reset your password for Auto Captions.</p>
      <p>Click the button below to set a new password:</p>
      <a href="${resetUrl}" style="display: inline-block; background: #facc15; color: #000; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">Reset Password</a>
      <p style="color: #a1a1aa; font-size: 12px;">This link is valid for 1 hour. If you did not request this, please ignore this email.</p>
    </div>
  `;

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: '🔑 Reset Your Auto Captions Password',
      html,
    });
  } catch (mailErr) {
    console.error('[AUTH MAILER WARNING] Email dispatch failed:', mailErr.message);
  }

  return {
    message: 'If an account with that email exists, password reset instructions have been sent.',
    resetToken,
  };
}

/**
 * Reset user password with token
 */
export async function resetPassword({ token, newPassword }) {
  if (!token || !newPassword) {
    throw new AppError('Reset token and new password are required.', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('Password must be at least 6 characters long.', 400);
  }

  const res = await query(
    `SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()`,
    [token]
  );

  if (res.rows.length === 0) {
    throw new AppError('Invalid or expired password reset token.', 400);
  }

  const user = res.rows[0];
  const passwordHash = await bcrypt.hash(newPassword, 10);

  await query(
    `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2`,
    [passwordHash, user.id]
  );

  return { message: 'Password has been successfully updated. You can now log in.' };
}

/**
 * Get user profile by ID
 */
export async function getUserById(userId) {
  const res = await query(
    `SELECT id, name, email, avatar_url, plan, credits, created_at FROM users WHERE id = $1`,
    [userId]
  );

  if (res.rows.length === 0) {
    throw new Error('User not found.');
  }

  return res.rows[0];
}

export async function updateUserProfile(userId, name) {
  if (!name || !name.trim()) {
    throw new AppError('Name is required.', 400);
  }
  const res = await query(
    `UPDATE users SET name = $2 WHERE id = $1 RETURNING id, name, email, avatar_url, created_at`,
    [userId, name.trim()]
  );
  if (res.rows.length === 0) {
    throw new AppError('User not found.', 404);
  }
  return res.rows[0];
}
