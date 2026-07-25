const { getDB } = require("../config/db");

const BUDGET_RANGES = ["under_1k", "1k_5k", "5k_15k", "15k_50k", "50k_plus"];
const STATUS_VALUES = ["New", "Contacted", "Closed"];

function nowISO() {
  return new Date().toISOString();
}

async function create({ name, email, budgetRange, message, ip }) {
  const db = getDB();
  const createdAt = nowISO();

  const result = await db.run(
    `INSERT INTO leads (name, email, budget_range, message, status, ip, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'New', ?, ?, ?)`,
    [name, email, budgetRange, message, ip || null, createdAt, createdAt]
  );

  return { id: result.lastID, name, email, createdAt };
}

// Builds WHERE name/email substring match + optional status filter,
// paginated and sorted newest-first.
async function findAndCount({ search = "", status, page = 1, limit = 20 }) {
  const db = getDB();

  const conditions = [];
  const params = [];

  if (status && STATUS_VALUES.includes(status)) {
    conditions.push("status = ?");
    params.push(status);
  }

  if (search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push("(name LIKE ? OR email LIKE ?)");
    params.push(term, term);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const offset = (pageNum - 1) * limitNum;

  const totalRow = await db.get(`SELECT COUNT(*) AS count FROM leads ${where}`, params);
  const total = totalRow.count;

  const rows = await db.all(
    `SELECT id, name, email, budget_range AS budgetRange, message, status, created_at AS createdAt, updated_at AS updatedAt
     FROM leads ${where}
     ORDER BY datetime(created_at) DESC
     LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );

  return {
    leads: rows,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
  };
}

async function updateStatus(id, status) {
  const db = getDB();

  if (!STATUS_VALUES.includes(status)) {
    throw Object.assign(new Error(`Status must be one of: ${STATUS_VALUES.join(", ")}`), {
      statusCode: 400,
    });
  }

  const updatedAt = nowISO();
  const result = await db.run(
    "UPDATE leads SET status = ?, updated_at = ? WHERE id = ?",
    [status, updatedAt, id]
  );

  if (result.changes === 0) return null;

  return db.get(
    `SELECT id, name, email, budget_range AS budgetRange, message, status, created_at AS createdAt, updated_at AS updatedAt
     FROM leads WHERE id = ?`,
    [id]
  );
}

module.exports = {
  BUDGET_RANGES,
  STATUS_VALUES,
  create,
  findAndCount,
  updateStatus,
};
