const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const COOKIE_NAME = "token";

function baseCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd, // requires HTTPS in production (Render/Vercel both provide it)
    sameSite: isProd ? "none" : "lax", // "none" so the cookie survives cross-site FE/BE domains
  };
}

function loginCookieOptions() {
  return { ...baseCookieOptions(), maxAge: 8 * 60 * 60 * 1000 }; // 8 hours, matches JWT_EXPIRES_IN default
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const admin = await Admin.findByEmail(email);

  // Same generic error whether the email doesn't exist or the password is
  // wrong - don't leak which one it was.
  if (!admin || !(await Admin.comparePassword(admin, password))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign(
    { sub: String(admin.id), email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );

  res.cookie(COOKIE_NAME, token, loginCookieOptions());
  res.json({ email: admin.email });
}

function logout(req, res) {
  res.clearCookie(COOKIE_NAME, baseCookieOptions());
  res.status(204).send();
}

function me(req, res) {
  // requireAuth middleware already ran; if we're here, the session is valid.
  res.json({ email: req.admin.email });
}

module.exports = { login, logout, me };
