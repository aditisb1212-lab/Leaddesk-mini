require("dotenv").config();
const express = require("express");
require("express-async-errors"); // lets async route handlers' rejections reach the error middleware below (Express 4 doesn't do this natively)
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/db");
const leadRoutes = require("./routes/leads");
const authRoutes = require("./routes/auth");

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // required so the httpOnly auth cookie is sent/received
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/leads", leadRoutes);
app.use("/api/auth", authRoutes);

// Centralized error handler - keeps stack traces out of responses and
// guarantees the "never crash" requirement from bad input/DB errors.
app.use((err, req, res, next) => {
  console.error(err);
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  if (err.code === "SQLITE_CONSTRAINT" || err.message?.includes("CHECK constraint")) {
    return res.status(400).json({ error: "Invalid data submitted" });
  }
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 5000;

// connectDB is async now (the plain sqlite3 driver, wrapped by `sqlite`,
// opens the file and runs the schema asynchronously) - so the server only
// starts listening once the database is actually ready.
async function start() {
  await connectDB();
  app.listen(PORT, () => console.log(`LeadDesk Mini API running on port ${PORT}`));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
