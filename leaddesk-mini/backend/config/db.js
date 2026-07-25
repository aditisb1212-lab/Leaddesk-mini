const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const DB_FILE = process.env.DB_FILE || path.join(__dirname, "..", "leaddesk.sqlite3");
const SCHEMA_FILE = path.join(__dirname, "..", "db", "schema.sql");

let db;

// Plain `sqlite3` + the `sqlite` wrapper gives a Promise-based API
// (db.get/db.all/db.run) over the standard node-sqlite3 driver, instead of
// better-sqlite3's synchronous one. Every model function below is async
// as a result.
async function connectDB() {
  db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA journal_mode = WAL"); // safer under concurrent reads/writes
  await db.exec("PRAGMA foreign_keys = ON");

  const schema = fs.readFileSync(SCHEMA_FILE, "utf8");
  await db.exec(schema);

  console.log(`SQLite connected: ${DB_FILE}`);
  return db;
}

function getDB() {
  if (!db) {
    throw new Error("Database not initialized - call connectDB() first");
  }
  return db;
}

module.exports = { connectDB, getDB };
