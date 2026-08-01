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
    { expiresIn: '60d' }
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
    const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0].trim() : 'https://rukhi.in';
    const welcomeHtml = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #09090b; color: #ffffff; border-radius: 16px; border: 1px solid #27272a;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #facc15; font-size: 32px; font-weight: 800; margin: 0;">rukhi.in</h1>
          <p style="color: #a1a1aa; font-size: 16px; margin-top: 8px;">#1 AI Voice & Subtitle Studio</p>
        </div>
        <div style="background-color: #18181b; padding: 30px; border-radius: 12px; border: 1px solid #3f3f46;">
          <h2 style="font-size: 24px; margin-top: 0;">Welcome aboard, ${user.name}! 🚀</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #d4d4d8;">
            We're thrilled to have you! You now have access to rukhi.in — the ultimate AI video studio.
            Turn your raw videos into viral reels in seconds.
          </p>
          <ul style="color: #d4d4d8; font-size: 15px; line-height: 1.8; margin-top: 20px; padding-left: 20px;">
            <li>✨ <strong>100% Accurate Sync:</strong> Zero drift, sample-accurate timelines.</li>
            <li>🎨 <strong>70+ Fonts & Viral Styles:</strong> Hormozi, Submagic, and Gold presets.</li>
            <li>🌍 <strong>Multi-Lingual:</strong> English, Telugu, Hindi, and Teluglish support.</li>
          </ul>
          <div style="text-align: center; margin-top: 35px;">
            <a href="${frontendUrl}" style="display: inline-block; background-color: #facc15; color: #000000; font-weight: 700; font-size: 16px; padding: 14px 32px; border-radius: 8px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">Create Your First Reel</a>
          </div>
        </div>
        <p style="text-align: center; color: #71717a; font-size: 13px; margin-top: 30px;">
          Follow us on Instagram: <a href="https://www.instagram.com/rukhi.in/" style="color: #ec4899; text-decoration: none; font-weight: 700;">@rukhi.in</a><br />
          © ${new Date().getFullYear()} rukhi.in. All rights reserved.
        </p>
      </div>
    `;
    await sendEmail({
      to: normalizedEmail,
      subject: '🚀 Welcome to rukhi.in! Your AI Studio is ready.',
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
    `SELECT id, name, email, password_hash, avatar_url, plan, credits, role FROM users WHERE LOWER(email) = $1`,
    [normalizedEmail]
  );

  if (res.rows.length === 0) {
    throw new AppError('Invalid email or password.', 401);
  }

  let user = res.rows[0];
  if (!user.password_hash) {
    throw new AppError('This account was created with Google Sign In. Please use Google to log in.', 400);
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isOwner = normalizedEmail.includes('anjaneyulumandagiri') || normalizedEmail.includes('veeranjaneyulumandagiri') || normalizedEmail.includes('anjim999') || normalizedEmail.includes('manikanta') || normalizedEmail.includes('chavala');
  if (isOwner) {
    user.plan = 'dubbing_studio';
    user.credits = 99999;
    user.role = 'admin';
    await query(
      `UPDATE users SET plan = 'dubbing_studio', credits = 99999, role = 'admin' WHERE id = $1`,
      [user.id]
    );
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
    `SELECT id, name, email, avatar_url, plan, credits, role FROM users WHERE google_id = $1 OR LOWER(email) = $2`,
    [googleId || '', normalizedEmail]
  );

  let user;
  const isOwner = normalizedEmail.includes('anjaneyulumandagiri') || normalizedEmail.includes('veeranjaneyulumandagiri') || normalizedEmail.includes('anjim999') || normalizedEmail.includes('manikanta') || normalizedEmail.includes('chavala');

  if (existingRes.rows.length > 0) {
    user = existingRes.rows[0];
    const targetPlan = isOwner ? 'dubbing_studio' : (user.plan || 'free');
    const targetCredits = isOwner ? 99999 : (user.credits !== undefined && user.credits !== null ? user.credits : 3);
    const targetRole = isOwner ? 'admin' : (user.role || 'user');
    const targetAvatar = avatarUrl || user.avatar_url;

    await query(
      `UPDATE users 
       SET google_id = COALESCE(google_id, $1), 
           avatar_url = COALESCE($2, avatar_url),
           plan = $3,
           credits = $4,
           role = $5
       WHERE id = $6`,
      [googleId || null, targetAvatar || null, targetPlan, targetCredits, targetRole, user.id]
    );

    user = {
      ...user,
      google_id: googleId || user.google_id,
      avatar_url: targetAvatar,
      plan: targetPlan,
      credits: targetCredits,
      role: targetRole,
    };
  } else {
    // Create new user
    const userId = uuidv4();
    const targetPlan = isOwner ? 'dubbing_studio' : 'free';
    const targetCredits = isOwner ? 99999 : 3;
    const targetRole = isOwner ? 'admin' : 'user';

    const insertRes = await query(
      `INSERT INTO users (id, name, email, google_id, avatar_url, plan, credits, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, email, avatar_url, plan, credits, role, created_at`,
      [userId, name || 'Google User', normalizedEmail, googleId || null, avatarUrl || null, targetPlan, targetCredits, targetRole]
    );
    user = insertRes.rows[0];

    // Send Welcome Email for new Google signups
    try {
      const welcomeHtml = `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #09090b; color: #ffffff; border-radius: 16px; border: 1px solid #27272a;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #facc15; font-size: 32px; font-weight: 800; margin: 0;">rukhi.in</h1>
            <p style="color: #a1a1aa; font-size: 16px; margin-top: 8px;">Your AI Reel Studio</p>
          </div>
          <div style="background-color: #18181b; padding: 30px; border-radius: 12px; border: 1px solid #3f3f46;">
            <h2 style="font-size: 24px; margin-top: 0;">Welcome aboard, ${user.name}! 🚀</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #d4d4d8;">
              You successfully joined using Google. You now have access to the ultimate AI-powered captioning engine.
            </p>
            <div style="text-align: center; margin-top: 35px;">
              <a href="${(process.env.FRONTEND_URL || 'https://rukhi.in').split(',')[0].trim()}" style="display: inline-block; background-color: #facc15; color: #000000; font-weight: 700; font-size: 16px; padding: 14px 32px; border-radius: 8px; text-decoration: none; text-transform: uppercase;">Launch Studio</a>
            </div>
          </div>
        </div>
      `;
      await sendEmail({
        to: normalizedEmail,
        subject: '🚀 Welcome to rukhi.in! Your AI Studio is ready.',
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

  const appFrontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0].trim() : 'https://rukhi.in';
  const resetUrl = `${appFrontendUrl}/reset-password?token=${resetToken}`;
  const html = `
    <div style="font-family: sans-serif; padding: 25px; background: #09090b; color: #fff; border-radius: 16px; border: 1px solid #27272a; max-width: 550px; margin: 0 auto;">
      <h2 style="color: #facc15; margin-top: 0;">rukhi.in — Password Reset Code</h2>
      <p style="color: #d4d4d8; font-size: 15px;">Hello ${user.name || 'Creator'},</p>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">We received a request to reset your password for your rukhi.in account.</p>
      <p style="color: #a1a1aa; font-size: 14px;">Click the button below or copy the secure link to set your new password:</p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #facc15; color: #000; font-weight: 800; font-size: 15px; padding: 14px 28px; border-radius: 10px; text-decoration: none;">Reset Password</a>
      </div>
      <p style="color: #71717a; font-size: 12px; line-height: 1.5; margin-bottom: 0;">This reset link is valid for 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
    </div>
  `;

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: '🔑 Reset Your rukhi.in Password',
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
    `SELECT id, name, email, avatar_url, plan, credits, role, created_at FROM users WHERE id = $1`,
    [userId]
  );

  if (res.rows.length === 0) {
    throw new AppError('User account not found.', 404);
  }

  const user = res.rows[0];
  const normalizedEmail = (user.email || '').trim().toLowerCase();
  const isOwner = normalizedEmail.includes('anjaneyulumandagiri') || normalizedEmail.includes('veeranjaneyulumandagiri') || normalizedEmail.includes('anjim999') || normalizedEmail.includes('manikanta') || normalizedEmail.includes('chavala');

  if (isOwner && (user.plan !== 'dubbing_studio' || user.credits < 9999)) {
    await query(
      `UPDATE users SET plan = 'dubbing_studio', credits = 99999, role = 'admin' WHERE id = $1`,
      [user.id]
    );
    user.plan = 'dubbing_studio';
    user.credits = 99999;
    user.role = 'admin';
  }

  return user;
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
