import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/pool.js';
import { sendEmail } from '../utils/mailer.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Submit a new Customer Support Ticket
 */
export async function createSupportTicket(req, res, next) {
  try {
    const { name, email, category = 'general', subject, message, userId } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, error: 'Name, email, subject, and message are required.' });
    }

    const ticketId = uuidv4();
    const ticketNumber = `TICK-${Math.floor(100000 + Math.random() * 900000)}`;

    await query(
      `INSERT INTO support_tickets (id, ticket_number, user_id, name, email, category, subject, message, status, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open', 'medium')`,
      [ticketId, ticketNumber, userId || null, name.trim(), email.trim().toLowerCase(), category, subject.trim(), message.trim()]
    );

    // Send confirmation email via Hostinger SMTP
    const confirmationText = `Hi ${name},\n\nThank you for reaching out to RoCaps Customer Support! We have received your request.\n\nTicket Number: ${ticketNumber}\nSubject: ${subject}\n\nOur team is reviewing your ticket and will respond shortly.\n\nBest regards,\nRoCaps Support Team`;
    
    sendEmail({
      to: email,
      subject: `[${ticketNumber}] Support Ticket Created — RoCaps`,
      text: confirmationText,
    }).catch((err) => console.error('[SUPPORT MAILER ERROR]:', err.message));

    return res.status(201).json({
      success: true,
      message: 'Support ticket created successfully.',
      ticketNumber,
      ticketId,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get User's or Admin's Support Tickets
 */
export async function listSupportTickets(req, res, next) {
  try {
    const { status, category, userId } = req.query;

    let sql = `SELECT * FROM support_tickets WHERE 1=1`;
    const params = [];

    if (userId) {
      params.push(userId);
      sql += ` AND user_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC LIMIT 100`;

    const result = await query(sql, params);
    return res.json({ success: true, tickets: result.rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin Reply or Status Update for Support Ticket
 */
export async function updateSupportTicket(req, res, next) {
  try {
    const { ticketId } = req.params;
    const { status, adminReply, priority } = req.body;

    const existingRes = await query(`SELECT * FROM support_tickets WHERE id = $1`, [ticketId]);
    if (existingRes.rows.length === 0) {
      throw new AppError('Support ticket not found.', 404);
    }
    const ticket = existingRes.rows[0];

    let updateSql = `UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP`;
    const params = [];

    if (status) {
      params.push(status);
      updateSql += `, status = $${params.length}`;
    }
    if (priority) {
      params.push(priority);
      updateSql += `, priority = $${params.length}`;
    }
    if (adminReply) {
      params.push(adminReply);
      updateSql += `, admin_reply = $${params.length}`;
    }

    params.push(ticketId);
    updateSql += ` WHERE id = $${params.length} RETURNING *`;

    const updatedRes = await query(updateSql, params);

    // If admin replied, send email notification to user
    if (adminReply && ticket.email) {
      const emailBody = `Hi ${ticket.name},\n\nYour support ticket ${ticket.ticket_number} has an update from RoCaps Support:\n\n${adminReply}\n\nTicket Status: ${status || ticket.status}\n\nBest regards,\nRoCaps Support Team`;
      sendEmail({
        to: ticket.email,
        subject: `[${ticket.ticket_number}] Support Update — RoCaps`,
        text: emailBody,
      }).catch((err) => console.error('[SUPPORT REPLY MAILER ERROR]:', err.message));
    }

    return res.json({ success: true, ticket: updatedRes.rows[0] });
  } catch (err) {
    next(err);
  }
}
