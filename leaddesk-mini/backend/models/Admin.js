const bcrypt = require("bcryptjs");
const { getDB } = require("../config/db");

async function findByEmail(email) {
  const db = getDB();
  return db.get(
    "SELECT id, email, password_hash AS passwordHash FROM admins WHERE email = ?",
    [email.toLowerCase()]
  );
}

async function comparePassword(admin, plain) {
  return bcrypt.compare(plain, admin.passwordHash);
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

// Used only by utils/seedAdmin.js - creates the account or rotates its
// password if it already exists (upsert semantics).
async function upsert(email, passwordHash) {
  const db = getDB();
  const normalizedEmail = email.toLowerCase();

  const existing = await findByEmail(normalizedEmail);
  if (existing) {
    await db.run("UPDATE admins SET password_hash = ? WHERE email = ?", [
      passwordHash,
      normalizedEmail,
    ]);
    return { id: existing.id, email: normalizedEmail };
  }

  const result = await db.run(
    "INSERT INTO admins (email, password_hash) VALUES (?, ?)",
    [normalizedEmail, passwordHash]
  );

  return { id: result.lastID, email: normalizedEmail };
}

module.exports = { findByEmail, comparePassword, hashPassword, upsert };
