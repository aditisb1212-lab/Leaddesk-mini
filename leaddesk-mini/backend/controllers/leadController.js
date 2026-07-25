const { validationResult } = require("express-validator");
const Lead = require("../models/Lead");

// POST /api/leads - public
async function createLead(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, budgetRange, message } = req.body;

  const lead = await Lead.create({ name, email, budgetRange, message, ip: req.ip });

  // Never echo back internal fields like ip/status to the public caller.
  res.status(201).json(lead);
}

// GET /api/leads?search=&status=&page=&limit= - admin only
async function listLeads(req, res) {
  const { search = "", status, page = 1, limit = 20 } = req.query;
  const result = await Lead.findAndCount({ search, status, page, limit });
  res.json(result);
}

// PATCH /api/leads/:id/status - admin only
async function updateStatus(req, res) {
  const { status } = req.body;

  if (!Lead.STATUS_VALUES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${Lead.STATUS_VALUES.join(", ")}` });
  }

  const lead = await Lead.updateStatus(req.params.id, status);

  if (!lead) {
    return res.status(404).json({ error: "Lead not found" });
  }

  res.json(lead);
}

module.exports = { createLead, listLeads, updateStatus };
