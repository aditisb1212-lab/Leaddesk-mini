const express = require("express");
const { body, param } = require("express-validator");
const rateLimit = require("express-rate-limit");
const { createLead, listLeads, updateStatus } = require("../controllers/leadController");
const { requireAuth } = require("../middleware/auth");
const Lead = require("../models/Lead");

const router = express.Router();

// Public form is the one open endpoint on the API - throttle it against
// basic spam/scripted submission floods.
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions from this network. Try again later." },
});

const createLeadValidators = [
  body("name").trim().isLength({ min: 2, max: 120 }).withMessage("Name must be 2-120 characters"),
  body("email").trim().isEmail().withMessage("Enter a valid email address").normalizeEmail(),
  body("budgetRange")
    .isIn(Lead.BUDGET_RANGES)
    .withMessage(`Budget range must be one of: ${Lead.BUDGET_RANGES.join(", ")}`),
  body("message").trim().isLength({ min: 10, max: 2000 }).withMessage("Message must be 10-2000 characters"),
];

router.post("/", submitLimiter, createLeadValidators, createLead);

// Everything below requires an admin session.
router.get("/", requireAuth, listLeads);
router.patch(
  "/:id/status",
  requireAuth,
  param("id").isInt({ min: 1 }).withMessage("Invalid lead id"),
  updateStatus
);

module.exports = router;
