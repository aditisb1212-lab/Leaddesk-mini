const jwt = require("jsonwebtoken");

// Reads the JWT from the httpOnly cookie set at login. No token in
// localStorage/sessionStorage, so it isn't reachable by JS/XSS.
function requireAuth(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session expired or invalid" });
  }
}

module.exports = { requireAuth };
