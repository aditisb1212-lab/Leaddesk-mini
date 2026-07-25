// One-off script: creates (or rotates the password of) the admin account
// from env vars. Run with: npm run seed:admin
// This exists so no password is ever hardcoded in source - it's the
// requirement from Task B ("real login... not a hardcoded string").
require("dotenv").config();
const { connectDB } = require("../config/db");
const Admin = require("../models/Admin");

async function seed() {
  const { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = process.env;

  if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
    console.error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  await connectDB();

  const passwordHash = await Admin.hashPassword(SEED_ADMIN_PASSWORD);
  const admin = await Admin.upsert(SEED_ADMIN_EMAIL, passwordHash);

  console.log(`Admin account ready: ${admin.email}`);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
