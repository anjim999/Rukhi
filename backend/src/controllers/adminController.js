import { query } from '../db/pool.js';

/**
 * Get Admin Registration Analytics & SaaS Metrics
 */
export async function getAdminAnalytics(_req, res, next) {
  try {
    // 1. Total Registered Users
    const userCountRes = await query(`SELECT COUNT(*) as total FROM users`);
    const totalUsers = parseInt(userCountRes.rows[0]?.total || '0', 10);

    // 2. Signups Today
    const todaySignupsRes = await query(
      `SELECT COUNT(*) as total FROM users WHERE created_at >= CURRENT_DATE`
    );
    const signupsToday = parseInt(todaySignupsRes.rows[0]?.total || '0', 10);

    // 3. Total Projects & Rendered Videos
    const projCountRes = await query(`SELECT COUNT(*) as total FROM projects`);
    const totalProjects = parseInt(projCountRes.rows[0]?.total || '0', 10);

    // 4. Subscriptions & Plan Breakdown
    const planBreakdownRes = await query(
      `SELECT COALESCE(plan, 'free') as plan, COUNT(*) as count FROM users GROUP BY COALESCE(plan, 'free')`
    );
    const planBreakdown = planBreakdownRes.rows.reduce((acc, row) => {
      acc[row.plan] = parseInt(row.count, 10);
      return acc;
    }, {});

    // 5. Open Support Tickets Count
    const ticketCountRes = await query(
      `SELECT COUNT(*) as open_tickets FROM support_tickets WHERE status = 'open'`
    );
    const openTickets = parseInt(ticketCountRes.rows[0]?.open_tickets || '0', 10);

    // 6. Recent Registered Users (Latest 10)
    const recentUsersRes = await query(
      `SELECT id, name, email, role, COALESCE(plan, 'free') as plan, COALESCE(credits, 3) as credits, created_at FROM users ORDER BY created_at DESC LIMIT 10`
    );

    return res.json({
      success: true,
      metrics: {
        totalUsers,
        signupsToday,
        totalProjects,
        openTickets,
        planBreakdown: {
          free: planBreakdown.free || 0,
          starter: planBreakdown.starter || 0,
          pro: planBreakdown.pro || 0,
        },
      },
      recentUsers: recentUsersRes.rows,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * List & Search Users with Pagination
 */
export async function listAdminUsers(req, res, next) {
  try {
    const { search = '', plan, limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let sql = `SELECT id, name, email, role, COALESCE(plan, 'free') as plan, COALESCE(credits, 3) as credits, created_at FROM users WHERE 1=1`;
    const params = [];

    if (search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length})`;
    }

    if (plan) {
      params.push(plan);
      sql += ` AND plan = $${params.length}`;
    }

    params.push(parseInt(limit, 10));
    sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    params.push(offset);
    sql += ` OFFSET $${params.length}`;

    const result = await query(sql, params);
    return res.json({ success: true, users: result.rows });
  } catch (err) {
    next(err);
  }
}

/**
 * Update User Plan or Credits manually by Admin
 */
export async function updateUserPlanOrCredits(req, res, next) {
  try {
    const { userId } = req.params;
    const { plan, credits, role } = req.body;

    let updateSql = `UPDATE users SET id = id`;
    const params = [];

    if (plan) {
      params.push(plan);
      updateSql += `, plan = $${params.length}`;
    }
    if (credits !== undefined) {
      params.push(parseInt(credits, 10));
      updateSql += `, credits = $${params.length}`;
    }
    if (role) {
      params.push(role);
      updateSql += `, role = $${params.length}`;
    }

    params.push(userId);
    updateSql += ` WHERE id = $${params.length} RETURNING id, name, email, role, plan, credits, created_at`;

    const updatedRes = await query(updateSql, params);
    if (updatedRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({ success: true, user: updatedRes.rows[0] });
  } catch (err) {
    next(err);
  }
}
