const express = require("express");
const rateLimit = require("express-rate-limit");
const { login, logout, me } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Slow down brute-force login attempts.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

router.post("/login", loginLimiter, login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

module.exports = router;
