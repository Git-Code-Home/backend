
// import dotenv from "dotenv";
// dotenv.config();

// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import bcrypt from "bcryptjs";
// import path from "path";
// import { fileURLToPath } from "url";

// import adminRoutes from "./src/routes/adminRoutes.js";
// import employeeRoutes from "./src/routes/employeeRoutes.js";
// import agentRoutes from "./src/routes/agentRoutes.js";
// import controllRoutes from "./src/routes/controllRoutes.js";
// import User from "./src/models/User.js";
// import paymentRoutes from "./src/routes/paymentRoutes.js";
// import adminDebugData from "./src/routes/adminDebugData.js";
// import adminCommissionRoutes from "./src/routes/adminCommissionRoutes.js";
// import agentCommissionRoutes from "./src/routes/agentCommissionRoutes.js";import webhookRoutes from "./src/routes/webhookRoutes.js";// import { connectDB } from "./src/config/db.js"; //  Import connection helper

// // ---------------- SETUP ----------------
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// dotenv.config({ path: path.join(__dirname, ".env") });

// const app = express();

// // ---------------- MIDDLEWARE ----------------
// app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// app.use((req, res, next) => {
//   console.log(`[server] ${req.method} ${req.originalUrl} - origin: ${req.headers.origin || "-"}`);
//   next();
// });

// // Improved CORS: allow localhost and Vercel preview/prod domains
// const allowlist = new Set([
//   "http://localhost:8080",
//   "http://localhost:5173",
//   "https://sherrytravels-webapp.vercel.app",
// ]);

// const corsOptions = {
//   origin: (origin, cb) => {
//     // Allow non-browser clients (no origin) and known allowlist
//     if (!origin) return cb(null, true);
//     // Allow any vercel.app preview domain for this project
//     const isVercel = /\.vercel\.app$/i.test(origin);
//     if (allowlist.has(origin) || isVercel) return cb(null, true);
//     return cb(new Error(`CORS blocked for origin: ${origin}`));
//   },
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
//   credentials: true,
//   optionsSuccessStatus: 204,
// };

// app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));

// app.use(express.json());

// // Ensure DB is connected before handling requests (helps on serverless cold starts)
// async function ensureConnected() {
//   const state = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
//   if (state === 1) return;
//   if (state === 2) {
//     // Wait for the current connection attempt to finish
//     await mongoose.connection.asPromise().catch(() => {});
//     return;
//   }
//   // 0 or 3 => connect/reconnect
//   await connectDB();
//   if (mongoose.connection.readyState !== 1) {
//     await mongoose.connection.asPromise().catch(() => {});
//   }
// }

// app.use(async (req, res, next) => {
//   try {
//     await ensureConnected();
//     return next();
//   } catch (err) {
//     console.error("❌ DB connect on-request failed:", err.message);
//     return res.status(500).json({ message: "Database connection failed" });
//   }
// });

// // ---------------- ROUTES ----------------
// app.use(adminDebugData);
// app.use("/api/admin", adminRoutes);
// app.use("/api/employee", employeeRoutes);
// app.use("/api/agent", agentRoutes);
// app.use("/api/public/agents", controllRoutes);
// app.use("/api/payments", paymentRoutes);
// app.use("/api/admin/commissions", adminCommissionRoutes);
// app.use("/api/agent/commissions", agentCommissionRoutes);

// app.get("*", (req, res) => {
//   res.send("\ud83d\ude80 Dubai Visa Application API is running");
// });

// // Simple DB health endpoint (useful for platform checks)
// app.get("/api/health/db", async (req, res) => {
//   try {
//     const state = mongoose.connection.readyState; // 0..3
//     res.json({ ok: state === 1, state });
//   } catch (e) {
//     res.status(500).json({ ok: false, message: e.message });
//   }
// });

// // ---------------- CREATE DEFAULT ADMIN ----------------
// const createAdminIfNotExists = async () => {
//   try {
//     const email = process.env.ADMIN_EMAIL;
//     const plain = process.env.ADMIN_PASSWORD || "";
//     console.log("[v0] createAdminIfNotExists email:", email, "pwLen:", plain.length);

//     const admin = await User.findOne({ email, role: "admin" });

//     if (!admin) {
//       await User.create({
//         name: "Admin",
//         email,
//         password: plain, // pre-save hook will hash
//         role: "admin",
//         designation: "Super Admin",
//         phone: "1234567890",
//         status: "Active",
//       });
//       console.log("[v0] ✅ Admin user created");
//       return;
//     }

//     const matches = await bcrypt.compare(plain, admin.password);
//     console.log("[v0] Admin env password matches stored hash:", matches);
//     if (!matches) {
//       admin.password = plain;
//       await admin.save();
//       console.log("[v0] 🔄 Admin password reset from env");
//     }
//   } catch (err) {
//     console.error("[v0] createAdminIfNotExists error:", err.message);
//   }
// };

// // ---------------- CONNECT TO DATABASE ----------------
// (async () => {
//   try {
//     await connectDB();
//     await createAdminIfNotExists();
//     console.log("✅ Server ready");

//     if (process.env.NODE_ENV !== "production") {
//       const PORT = process.env.PORT || 5000;
//       app.listen(PORT, () => {
//         console.log(`🚀 Server running locally at http://localhost:${PORT}`);
//       });
//     }
//   } catch (err) {
//     console.error("❌ Failed to start server:", err.message);
//   }
// })();

// export default app;



// import dotenv from "dotenv";
// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import bcrypt from "bcryptjs";
// import path from "path";
// import { fileURLToPath } from "url";

// import adminRoutes from "./src/routes/adminRoutes.js";
// import employeeRoutes from "./src/routes/employeeRoutes.js";
// import agentRoutes from "./src/routes/agentRoutes.js";
// import controllRoutes from "./src/routes/controllRoutes.js";
// import User from "./src/models/User.js";
// import paymentRoutes from "./src/routes/paymentRoutes.js";
// import adminDebugData from "./src/routes/adminDebugData.js";
// import adminCommissionRoutes from "./src/routes/adminCommissionRoutes.js";
// import agentCommissionRoutes from "./src/routes/agentCommissionRoutes.js";
// import { connectDB } from "./src/config/db.js";

// dotenv.config(); // single dotenv load — works fine in Vercel

// // ---------------- SETUP ----------------
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();

// // ---------------- MIDDLEWARE ----------------
// // ❌ Remove local uploads folder serving (Vercel doesn’t support writing files)
// // app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// // ✅ CORS setup - allow only local dev hosts and the production frontend
// const allowedOrigins = new Set([
//   "http://localhost:8080",
//   "http://localhost:5173",
//   "https://sherrytravels-webapp.vercel.app",
// ]);

// const corsOptions = {
//   origin: (origin, callback) => {
//     // Allow server-to-server or tools with no origin
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.has(origin)) return callback(null, true);
//     return callback(new Error(`CORS blocked for origin: ${origin}`));
//   },
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
//   credentials: true,
//   optionsSuccessStatus: 204,
// };

// app.use(cors(corsOptions));
// // Respond to preflight requests for all routes
// // Use '/*' as a catch-all path for middleware registration to be compatible
// // with the current path-to-regexp behavior used by the platform.
// app.options("/*", cors(corsOptions));

// app.use(express.json());

// // ---------------- DATABASE CONNECTION ----------------
// let isConnected = false;
// const ensureConnected = async () => {
//   if (isConnected && mongoose.connection.readyState === 1) return;
//   await connectDB();
//   isConnected = mongoose.connection.readyState === 1;
// };

// // connect once at cold start
// await ensureConnected().catch((err) => console.error("❌ Initial DB connect failed:", err.message));

// // ---------------- ROUTES ----------------
// app.use(adminDebugData);
// app.use("/api/admin", adminRoutes);
// app.use("/api/employee", employeeRoutes);
// app.use("/api/agent", agentRoutes);
// app.use("/api/public/agents", controllRoutes);
// app.use("/api/payments", paymentRoutes);
// app.use("/api/admin/commissions", adminCommissionRoutes);
// app.use("/api/agent/commissions", agentCommissionRoutes);

// app.get("/", (req, res) => {
//   res.send("🚀 Dubai Visa Application API is running fine on Vercel!");
// });

// // Simple DB health endpoint
// app.get("/api/health/db", async (req, res) => {
//   try {
//     const state = mongoose.connection.readyState;
//     res.json({ ok: state === 1, state });
//   } catch (e) {
//     res.status(500).json({ ok: false, message: e.message });
//   }
// });

// // ---------------- CREATE DEFAULT ADMIN ----------------
// const createAdminIfNotExists = async () => {
//   try {
//     const email = process.env.ADMIN_EMAIL;
//     const plain = process.env.ADMIN_PASSWORD || "";

//     const admin = await User.findOne({ email, role: "admin" });

//     if (!admin) {
//       await User.create({
//         name: "Admin",
//         email,
//         password: plain,
//         role: "admin",
//         designation: "Super Admin",
//         phone: "1234567890",
//         status: "Active",
//       });
//       console.log("✅ Default Admin Created");
//       return;
//     }

//     const matches = await bcrypt.compare(plain, admin.password);
//     if (!matches) {
//       admin.password = plain;
//       await admin.save();
//       console.log("🔄 Admin password reset from env");
//     }
//   } catch (err) {
//     console.error("❌ createAdminIfNotExists:", err.message);
//   }
// };

// // Run only once at cold start
// await createAdminIfNotExists();

// // ---------------- LOCAL DEV SERVER ----------------
// if (process.env.NODE_ENV !== "production") {
//   const PORT = process.env.PORT || 5000;
//   app.listen(PORT, () => console.log(`🚀 Local Server: http://localhost:${PORT}`));
// }

// // Final fallback for any unmatched routes. Use a path pattern that avoids
// // path-to-regexp parameter parsing issues on the platform.
// // We return a 404 JSON response which is safer for API-only deployments.
// app.use("/*", (req, res) => {
//   res.status(404).json({ ok: false, message: "Not Found" });
// });

// export default app;


// import dotenv from "dotenv";
// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import bcrypt from "bcryptjs";
// import path from "path";
// import { fileURLToPath } from "url";

// import adminRoutes from "./src/routes/adminRoutes.js";
// import employeeRoutes from "./src/routes/employeeRoutes.js";
// import agentRoutes from "./src/routes/agentRoutes.js";
// import controllRoutes from "./src/routes/controllRoutes.js";
// import User from "./src/models/User.js";
// import paymentRoutes from "./src/routes/paymentRoutes.js";
// import adminDebugData from "./src/routes/adminDebugData.js";
// import adminCommissionRoutes from "./src/routes/adminCommissionRoutes.js";
// import agentCommissionRoutes from "./src/routes/agentCommissionRoutes.js";
// import { connectDB } from "./src/config/db.js";

// dotenv.config(); // single dotenv load — works fine in Vercel

// // ---------------- SETUP ----------------
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();

// // ---------------- MIDDLEWARE ----------------

// // ✅ CORS setup - allow only local dev hosts and the production frontend
// const allowedOrigins = new Set([
//   "http://localhost:8080",
//   "http://localhost:5173",
//   "https://sherrytravels-webapp.vercel.app",
// ]);

// const corsOptions = {
//   origin: (origin, callback) => {
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.has(origin)) return callback(null, true);
//     return callback(new Error(`CORS blocked for origin: ${origin}`));
//   },
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
//   credentials: true,
//   optionsSuccessStatus: 204,
// };

// app.use(cors(corsOptions));
// // Respond to preflight requests for all routes
// app.options("*", cors(corsOptions));

// app.use(express.json());

// // ---------------- DATABASE CONNECTION ----------------
// let isConnected = false;
// const ensureConnected = async () => {
//   if (isConnected && mongoose.connection.readyState === 1) return;
//   await connectDB();
//   isConnected = mongoose.connection.readyState === 1;
// };

// // connect once at cold start
// await ensureConnected().catch((err) => console.error("❌ Initial DB connect failed:", err.message));

// // ---------------- ROUTES ----------------
// app.use(adminDebugData);
// app.use("/api/admin", adminRoutes);
// app.use("/api/employee", employeeRoutes);
// app.use("/api/agent", agentRoutes);
// app.use("/api/public/agents", controllRoutes);
// app.use("/api/payments", paymentRoutes);
// app.use("/api/admin/commissions", adminCommissionRoutes);
// app.use("/api/agent/commissions", agentCommissionRoutes);

// app.get("/", (req, res) => {
//   res.send("🚀 Dubai Visa Application API is running fine on Vercel!");
// });

// // Simple DB health endpoint
// app.get("/api/health/db", async (req, res) => {
//   try {
//     const state = mongoose.connection.readyState;
//     res.json({ ok: state === 1, state });
//   } catch (e) {
//     res.status(500).json({ ok: false, message: e.message });
//   }
// });

// // ---------------- CREATE DEFAULT ADMIN ----------------
// const createAdminIfNotExists = async () => {
//   try {
//     const email = process.env.ADMIN_EMAIL;
//     const plain = process.env.ADMIN_PASSWORD || "";

//     const admin = await User.findOne({ email, role: "admin" });

//     if (!admin) {
//       await User.create({
//         name: "Admin",
//         email,
//         password: plain,
//         role: "admin",
//         designation: "Super Admin",
//         phone: "1234567890",
//         status: "Active",
//       });
//       console.log("✅ Default Admin Created");
//       return;
//     }

//     const matches = await bcrypt.compare(plain, admin.password);
//     if (!matches) {
//       admin.password = plain;
//       await admin.save();
//       console.log("🔄 Admin password reset from env");
//     }
//   } catch (err) {
//     console.error("❌ createAdminIfNotExists:", err.message);
//   }
// };

// // Run only once at cold start
// await createAdminIfNotExists();

// // ---------------- LOCAL DEV SERVER ----------------
// if (process.env.NODE_ENV !== "production") {
//   const PORT = process.env.PORT || 5000;
//   app.listen(PORT, () => console.log(`🚀 Local Server: http://localhost:${PORT}`));
// }

// // ---------------- CATCH-ALL FALLBACK ----------------
// // ✅ FIXED: Removed "/*" — Express automatically matches all routes
// app.use((req, res) => {
//   res.status(404).json({ ok: false, message: "Not Found" });
// });

// export default app;


// import dotenv from "dotenv";
// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import bcrypt from "bcryptjs";
// import path from "path";
// import { fileURLToPath } from "url";

// import adminRoutes from "./src/routes/adminRoutes.js";
// import employeeRoutes from "./src/routes/employeeRoutes.js";
// import agentRoutes from "./src/routes/agentRoutes.js";
// import controllRoutes from "./src/routes/controllRoutes.js";
// import User from "./src/models/User.js";
// import paymentRoutes from "./src/routes/paymentRoutes.js";
// import adminDebugData from "./src/routes/adminDebugData.js";
// import adminCommissionRoutes from "./src/routes/adminCommissionRoutes.js";
// import agentCommissionRoutes from "./src/routes/agentCommissionRoutes.js";
// import { connectDB } from "./src/config/db.js";

// dotenv.config(); // ✅ Load environment variables

// // ---------------- SETUP ----------------
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();

// // ---------------- MIDDLEWARE ----------------

// // ✅ Proper CORS setup - allow only approved origins
// const allowedOrigins = new Set([
//   "http://localhost:8080",
//   "http://localhost:5173",
//   "https://sherrytravels-webapp.vercel.app",
// ]);

// const corsOptions = {
//   origin: (origin, callback) => {
//     if (!origin) return callback(null, true); // Allow server-to-server
//     if (allowedOrigins.has(origin)) return callback(null, true);
//     return callback(new Error(`CORS blocked for origin: ${origin}`));
//   },
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
//   credentials: true,
//   optionsSuccessStatus: 204,
// };

// app.use(cors(corsOptions));
// app.options("*", cors(corsOptions)); // Handle preflight requests globally

// app.use(express.json());

// // ---------------- DATABASE CONNECTION ----------------
// let isConnected = false;

// const ensureConnected = async () => {
//   if (isConnected && mongoose.connection.readyState === 1) return;
//   await connectDB();
//   isConnected = mongoose.connection.readyState === 1;
// };

// // connect once at cold start
// await ensureConnected().catch((err) =>
//   console.error("❌ Initial DB connect failed:", err.message)
// );

// // ---------------- ROUTES ----------------
// app.use(adminDebugData);
// app.use("/api/admin", adminRoutes);
// app.use("/api/employee", employeeRoutes);
// app.use("/api/agent", agentRoutes);
// app.use("/api/public/agents", controllRoutes);
// app.use("/api/payments", paymentRoutes);
// app.use("/api/admin/commissions", adminCommissionRoutes);
// app.use("/api/agent/commissions", agentCommissionRoutes);

// app.get("/", (req, res) => {
//   res.send("🚀 Dubai Visa Application API is running fine on Vercel!");
// });

// // Simple DB health endpoint
// app.get("/api/health/db", async (req, res) => {
//   try {
//     const state = mongoose.connection.readyState;
//     res.json({ ok: state === 1, state });
//   } catch (e) {
//     res.status(500).json({ ok: false, message: e.message });
//   }
// });

// // ---------------- CREATE DEFAULT ADMIN ----------------
// const createAdminIfNotExists = async () => {
//   try {
//     const email = process.env.ADMIN_EMAIL;
//     const plain = process.env.ADMIN_PASSWORD || "";

//     if (!email || !plain) {
//       console.warn("⚠️ ADMIN_EMAIL or ADMIN_PASSWORD not set in .env");
//       return;
//     }

//     const admin = await User.findOne({ email, role: "admin" });

//     if (!admin) {
//       await User.create({
//         name: "Admin",
//         email,
//         password: plain,
//         role: "admin",
//         designation: "Super Admin",
//         phone: "1234567890",
//         status: "Active",
//       });
//       console.log("✅ Default Admin Created");
//       return;
//     }

//     const matches = await bcrypt.compare(plain, admin.password);
//     if (!matches) {
//       admin.password = plain;
//       await admin.save();
//       console.log("🔄 Admin password reset from env");
//     }
//   } catch (err) {
//     console.error("❌ createAdminIfNotExists:", err.message);
//   }
// };

// // Run only once at cold start
// await createAdminIfNotExists();

// // ---------------- LOCAL DEV SERVER ----------------
// if (process.env.NODE_ENV !== "production") {
//   const PORT = process.env.PORT || 5000;
//   app.listen(PORT, () => console.log(`🚀 Local Server: http://localhost:${PORT}`));
// }

// // ---------------- CATCH-ALL FALLBACK ----------------
// // ✅ FIXED: Removed invalid "/*" — use default handler instead
// app.use((req, res) => {
//   res.status(404).json({ ok: false, message: "Not Found" });
// });

// export default app;


import dotenv from "dotenv";
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
import seedRoutes from "./src/routes/seedRoutes.js";
import clientRoutes from "./src/routes/clientRoutes.js";
import countryRoutes from "./src/routes/countryRoutes.js";
import templateRoutes from "./src/routes/templateRoutes.js";
import requiredDocumentRoutes from "./src/routes/requiredDocumentRoutes.js";
import backupRoutes from "./src/routes/backupRoutes.js";
import webhookRoutes from "./src/routes/webhookRoutes.js";
import { connectDB } from "./src/config/db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// ================================================================================
// CRITICAL: CORS MIDDLEWARE MUST BE FIRST (Before routes and other middleware)
// ================================================================================

// Define allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://localhost:5173",
  "http://localhost:8080",
  "https://sherrytravels-webapp.vercel.app",
  "https://sherry-backend.vercel.app", // Backend domain for same-origin requests
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, server-to-server)
    if (!origin) {
      console.log("✅ [CORS] Allowing request with no origin header");
      return callback(null, true);
    }

    // Check explicit allowlist
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ [CORS] Allowing whitelisted origin: ${origin}`);
      return callback(null, true);
    }

    // Allow all Vercel preview/deployment domains (*.vercel.app)
    if (origin.endsWith('.vercel.app')) {
      console.log(`✅ [CORS] Allowing Vercel deployment: ${origin}`);
      return callback(null, true);
    }

    // For production debugging: log but allow non-whitelisted origins
    // Change to: callback(new Error(`CORS: Origin ${origin} not allowed`)); to block
    console.warn(`⚠️  [CORS] Request from non-whitelisted origin: ${origin} (allowing for debugging)`);
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "X-Requested-With",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
  ],
  exposedHeaders: ["Content-Length", "X-JSON-Response"],
  credentials: true,
  optionsSuccessStatus: 204, // Some legacy browsers choke on 204
  maxAge: 86400, // 24 hours
};

// ✅ Apply CORS to all routes BEFORE defining routes
app.use(cors(corsOptions));

// ✅ Explicitly handle preflight OPTIONS requests for all paths
// This must come AFTER app.use(cors()) but BEFORE routes
app.options("*", cors(corsOptions));

// ✅ Manual CORS header fallback (in case the cors middleware doesn't catch preflight)
app.use((req, res, next) => {
  const origin = req.get("origin");
  
  // Set CORS headers manually for all responses
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app'))) {
    res.set("Access-Control-Allow-Origin", origin);
  }
  
  if (req.method === "OPTIONS") {
    // Respond immediately to preflight without error
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers");
    res.set("Access-Control-Allow-Credentials", "true");
    res.set("Access-Control-Max-Age", "86400");
    return res.status(204).end(); // Return 204 No Content for preflight
  }
  
  next();
});

// ✅ Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------- DATABASE ----------------
let isConnected = false;
const ensureConnected = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  await connectDB();
  isConnected = mongoose.connection.readyState === 1;
};

await ensureConnected().catch((err) =>
  console.error("❌ Initial DB connect failed:", err.message)
);

// ---------------- ROUTES ----------------
app.use(adminDebugData);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", seedRoutes); // POST /api/admin/seed
app.use("/api/client", clientRoutes);
app.use("/api/client/required-document-applications", requiredDocumentRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/public/agents", controllRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/admin/commissions", adminCommissionRoutes);
app.use("/api/agent/commissions", agentCommissionRoutes);
app.use("/api/admin/backup", backupRoutes);
// Public country and template endpoints (multi-country foundation)
app.use("/api/countries", countryRoutes);
app.use("/api/templates", templateRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Dubai Visa Application API is running fine on Vercel!");
});

app.get("/api/health/db", async (req, res) => {
  try {
    const state = mongoose.connection.readyState;
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

    if (!email || !plain) {
      console.warn("⚠️ ADMIN_EMAIL or ADMIN_PASSWORD not set in .env");
      return;
    }

    const admin = await User.findOne({ email, role: "admin" });

    if (!admin) {
      await User.create({
        name: "Admin",
        email,
        password: plain,
        role: "admin",
        designation: "Super Admin",
        phone: "1234567890",
        status: "Active",
      });
      console.log("✅ Default Admin Created");
      return;
    }

    const matches = await bcrypt.compare(plain, admin.password);
    if (!matches) {
      admin.password = plain;
      await admin.save();
      console.log("🔄 Admin password reset from env");
    }
  } catch (err) {
    console.error("❌ createAdminIfNotExists:", err.message);
  }
};

await createAdminIfNotExists();

// ---------------- LOCAL DEV SERVER ----------------
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Local Server: http://localhost:${PORT}`));
}

// ---------------- FALLBACK ----------------
app.use((req, res) => {
  res.status(404).json({ ok: false, message: "Not Found" });
});

export default app;
