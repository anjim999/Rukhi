import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { query } from '../db/pool.js';
import { config } from '../config/env.js';

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
    throw new Error('Name, email, and password are required.');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if user exists
  const existingRes = await query(`SELECT id FROM users WHERE LOWER(email) = $1`, [normalizedEmail]);
  if (existingRes.rows.length > 0) {
    throw new Error('An account with this email already exists.');
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
    throw new Error('Email and password are required.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const res = await query(
    `SELECT id, name, email, password_hash, avatar_url FROM users WHERE LOWER(email) = $1`,
    [normalizedEmail]
  );

  if (res.rows.length === 0) {
    throw new Error('Invalid email or password.');
  }

  const user = res.rows[0];
  if (!user.password_hash) {
    throw new Error('This account was created with Google Sign In. Please use Google to log in.');
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password.');
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
    throw new Error('Email is required.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const res = await query(`SELECT id FROM users WHERE LOWER(email) = $1`, [normalizedEmail]);

  if (res.rows.length === 0) {
    // Return generic success to avoid email enumeration
    return { message: 'If an account with that email exists, password reset instructions have been sent.' };
  }

  const user = res.rows[0];
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 3600000); // 1 hour

  await query(
    `UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3`,
    [resetToken, expiry.toISOString(), user.id]
  );

  return {
    message: 'If an account with that email exists, password reset instructions have been sent.',
    resetToken, // Provided for dev testing
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
