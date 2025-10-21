
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

import adminRoutes from "./src/routes/adminRoutes.js";
import employeeRoutes from "./src/routes/employeeRoutes.js";
import agentRoutes from "./src/routes/agentRoutes.js";
import controllRoutes from "./src/routes/controllRoutes.js";
import User from "./src/models/User.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import adminDebugData from "./src/routes/adminDebugData.js";
import adminCommissionRoutes from "./src/routes/adminCommissionRoutes.js";
import agentCommissionRoutes from "./src/routes/agentCommissionRoutes.js";
import { connectDB } from "./src/config/db.js"; //  Import connection helper

// ---------------- SETUP ----------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// ---------------- MIDDLEWARE ----------------
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

app.use((req, res, next) => {
  console.log(`[server] ${req.method} ${req.originalUrl} - origin: ${req.headers.origin || "-"}`);
  next();
});

// Improved CORS: allow localhost and Vercel preview/prod domains
const allowlist = new Set([
  "http://localhost:8080",
  "http://localhost:5173",
  "https://sherrytravels-webapp.vercel.app",
]);

const corsOptions = {
  origin: (origin, cb) => {
    // Allow non-browser clients (no origin) and known allowlist
    if (!origin) return cb(null, true);
    // Allow any vercel.app preview domain for this project
    const isVercel = /\.vercel\.app$/i.test(origin);
    if (allowlist.has(origin) || isVercel) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

// Ensure DB is connected before handling requests (helps on serverless cold starts)
async function ensureConnected() {
  const state = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
  if (state === 1) return;
  if (state === 2) {
    // Wait for the current connection attempt to finish
    await mongoose.connection.asPromise().catch(() => {});
    return;
  }
  // 0 or 3 => connect/reconnect
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connection.asPromise().catch(() => {});
  }
}

app.use(async (req, res, next) => {
  try {
    await ensureConnected();
    return next();
  } catch (err) {
    console.error("❌ DB connect on-request failed:", err.message);
    return res.status(500).json({ message: "Database connection failed" });
  }
});

// ---------------- ROUTES ----------------
app.use(adminDebugData);
app.use("/api/admin", adminRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/public/agents", controllRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin/commissions", adminCommissionRoutes);
app.use("/api/agent/commissions", agentCommissionRoutes);

app.get("/*", (req, res) => {
  res.send("\ud83d\ude80 Dubai Visa Application API is running");
});

// Simple DB health endpoint (useful for platform checks)
app.get("/api/health/db", async (req, res) => {
  try {
    const state = mongoose.connection.readyState; // 0..3
    res.json({ ok: state === 1, state });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// ---------------- CREATE DEFAULT ADMIN ----------------
const createAdminIfNotExists = async () => {
  try {
    const email = process.env.ADMIN_EMAIL;
    const plain = process.env.ADMIN_PASSWORD || "";
    console.log("[v0] createAdminIfNotExists email:", email, "pwLen:", plain.length);

    const admin = await User.findOne({ email, role: "admin" });

    if (!admin) {
      await User.create({
        name: "Admin",
        email,
        password: plain, // pre-save hook will hash
        role: "admin",
        designation: "Super Admin",
        phone: "1234567890",
        status: "Active",
      });
      console.log("[v0] ✅ Admin user created");
      return;
    }

    const matches = await bcrypt.compare(plain, admin.password);
    console.log("[v0] Admin env password matches stored hash:", matches);
    if (!matches) {
      admin.password = plain;
      await admin.save();
      console.log("[v0] 🔄 Admin password reset from env");
    }
  } catch (err) {
    console.error("[v0] createAdminIfNotExists error:", err.message);
  }
};

// ---------------- CONNECT TO DATABASE ----------------
(async () => {
  try {
    await connectDB();
    await createAdminIfNotExists();
    console.log("✅ Server ready");

    if (process.env.NODE_ENV !== "production") {
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`🚀 Server running locally at http://localhost:${PORT}`);
      });
    }
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
  }
})();

export default app;
