import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { query } from '../db/pool.js';
import { config } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendEmail } from '../utils/mailer.js';

it should send welcome mail when on lo
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

  const resetUrl = `https://rocky-captions.vercel.app/reset-password?token=${resetToken}`;
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
    throw new Error('Reset token and new password are required.');
  }

  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const res = await query(
    `SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()`,
    [token]
  );

  if (res.rows.length === 0) {
    throw new Error('Invalid or expired password reset token.');
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
    `SELECT id, name, email, avatar_url, created_at FROM users WHERE id = $1`,
    [userId]
  );

  if (res.rows.length === 0) {
    throw new Error('User not found.');
  }

  return res.rows[0];
}
