// import express from "express";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
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

// // ---------------- DOTENV CONFIG FIX ----------------
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // ✅ Explicitly load .env file from same directory as server.js
// dotenv.config({ path: path.join(__dirname, ".env") });

// // 🧠 Debug log to verify env file is loaded
// console.log("🧠 MONGO_URI loaded:", process.env.MONGO_URI ? "✅ Yes" : "❌ No");

// const app = express();
// app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// // ---------------- MIDDLEWARE ----------------
// // app.use(
// //   cors({
// //     origin: [
// //       "https://visa-managment-nine.vercel.app",
// //       "http://localhost:8080",
// //     ],
// //     credentials: true,
// //   })
// // );
// app.use(
//   cors({
//     origin: [
//       "http://localhost:8080",   // for your frontend dev server
//       "http://localhost:5173",   // in case you're using Vite
//       "https://visa-managment-nine.vercel.app", // deployed frontend
//     ],
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );

// app.use(express.json());

// // ---------------- ROUTES ----------------
// app.use("/api/admin", adminRoutes);
// app.use("/api/employee", employeeRoutes);
// app.use("/api/agent", agentRoutes);
// app.use("/api/public/agents", controllRoutes);
// app.use("/api/payments", paymentRoutes);

// app.get("/", (req, res) => {
//   res.send("🚀 Dubai Visa Application API is running");
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
//       console.log("[v0] Admin user created");
//       return;
//     }

//     const matches = await bcrypt.compare(plain, admin.password);
//     console.log("[v0] Admin env password matches stored hash:", matches);
//     if (!matches) {
//       admin.password = plain;
//       await admin.save();
//       console.log("[v0] Admin password reset from env");
//     }
//   } catch (err) {
//     console.error("[v0] createAdminIfNotExists error:", err.message);
//   }
// };

// // ---------------- CONNECT TO MONGO ----------------
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(async () => {
//     console.log("✅ MongoDB Connected");
//     await createAdminIfNotExists();

//     if (process.env.NODE_ENV !== "production") {
//       const PORT = process.env.PORT || 5000;
//       app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
//     }
//   })
//   .catch((err) => {
//     console.error("❌ Database connection failed:", err.message);
//   });

// // ✅ Export app for Vercel
// export default app;



// import express from "express";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
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
// // const agentRoutes = require('./routes/agent');
// // New debug route (ES module)
// import adminDebugData from "./src/routes/adminDebugData.js";
// import adminCommissionRoutes from "./routes/adminCommissionRoutes";
// // ---------------- DOTENV CONFIG FIX ----------------
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // ✅ Explicitly load .env file from same directory as server.js
// dotenv.config({ path: path.join(__dirname, ".env") });

// // 🧠 Debug log to verify env file is loaded
// console.log("🧠 MONGO_URI loaded:", process.env.MONGO_URI ? "✅ Yes" : "❌ No");

// const app = express();
// app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// // ---------------- TEMP DEBUG LOGGER (incoming requests) ----------------
// // Temporary middleware to log incoming requests so you can see what path the browser hits.
// // Leave it enabled while you debug; remove or reduce verbosity in production.
// app.use((req, res, next) => {
//   console.log(`[server] incoming ${req.method} ${req.originalUrl} - origin: ${req.headers.origin || "-"}`);
//   next();
// });

// // ---------------- MIDDLEWARE ----------------
// app.use(
//   cors({
//     origin: [
//       "http://localhost:8080",   // for your frontend dev server
//       "http://localhost:5173",   // in case you're using Vite
//       "https://visa-managment-nine.vercel.app", // deployed frontend
//     ],
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );

// app.use(express.json());

// // ---------------- DEBUG ROUTE MOUNT ----------------
// // Mount debug route before other routes so you can quickly confirm the exact path.
// app.use(adminDebugData);

// // ---------------- ROUTES ----------------
// app.use("/api/admin", adminRoutes);
// app.use("/api/employee", employeeRoutes);
// app.use("/api/agent", agentRoutes);
// app.use("/api/public/agents", controllRoutes);
// app.use("/api/payments", paymentRoutes);
// // app.use('/api/agent', agentRoutes);
// app.use('/api/admin/commissions', adminCommissionRoutes);
// app.get("/", (req, res) => {
//   res.send("🚀 Dubai Visa Application API is running");
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
//       console.log("[v0] Admin user created");
//       return;
//     }

//     const matches = await bcrypt.compare(plain, admin.password);
//     console.log("[v0] Admin env password matches stored hash:", matches);
//     if (!matches) {
//       admin.password = plain;
//       await admin.save();
//       console.log("[v0] Admin password reset from env");
//     }
//   } catch (err) {
//     console.error("[v0] createAdminIfNotExists error:", err.message);
//   }
// };

// // ---------------- CONNECT TO MONGO ----------------
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(async () => {
//     console.log("✅ MongoDB Connected");
//     await createAdminIfNotExists();

//     if (process.env.NODE_ENV !== "production") {
//       const PORT = process.env.PORT || 5000;
//       app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
//     }
//   })
//   .catch((err) => {
//     console.error("❌ Database connection failed:", err.message);
//   });

// // ✅ Export app for Vercel
// export default app;




// import express from "express";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import cors from "cors";
// import path from "path";
// import { fileURLToPath } from "url";
// import adminCommissionRoutes from "./src/routes/adminCommissionRoutes.js";
// import agentCommissionRoutes from "./src/routes/agentCommissionRoutes.js";
// // For __dirname in ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// dotenv.config({ path: path.join(__dirname, ".env") });

// const app = express();
// app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// app.use(cors({
//   origin: [
//     "http://localhost:8080",
//     "http://localhost:5173",
//     "https://visa-managment-nine.vercel.app",
//   ],
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true,
// }));

// app.use(express.json());

// // Mount your commission routes
// app.use("/api/admin/commissions", adminCommissionRoutes);
// app.use("/api/agent/commissions", agentCommissionRoutes);
// app.get("/", (req, res) => {
//   res.send("🚀 Dubai Visa Application API is running");
// });

// // Connect to MongoDB and start server
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("✅ MongoDB Connected");
//     const PORT = process.env.PORT || 5000;
//     app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
//   })
//   .catch((err) => {
//     console.error("❌ Database connection failed:", err.message);
//   });

// export default app;


import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
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

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

// 🧠 Debug log to verify env file is loaded
console.log("🧠 MONGO_URI loaded:", process.env.MONGO_URI ? "✅ Yes" : "❌ No");

const app = express();
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// ---------------- TEMP DEBUG LOGGER (incoming requests) ----------------
app.use((req, res, next) => {
  console.log(`[server] incoming ${req.method} ${req.originalUrl} - origin: ${req.headers.origin || "-"}`);
  next();
});

app.use(cors({
  origin: [
    "http://localhost:8080",
    "http://localhost:5173",
    "https://sherrytravels-webapp.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());

// ---------------- DEBUG ROUTE MOUNT ----------------
app.use(adminDebugData);

// ---------------- ROUTES ----------------
app.use("/api/admin", adminRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/public/agents", controllRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin/commissions", adminCommissionRoutes);
app.use("/api/agent/commissions", agentCommissionRoutes);

app.get("/", (req, res) => {
  res.send("🚀 Dubai Visa Application API is running");
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
      console.log("[v0] Admin user created");
      return;
    }

    const matches = await bcrypt.compare(plain, admin.password);
    console.log("[v0] Admin env password matches stored hash:", matches);
    if (!matches) {
      admin.password = plain;
      await admin.save();
      console.log("[v0] Admin password reset from env");
    }
  } catch (err) {
    console.error("[v0] createAdminIfNotExists error:", err.message);
  }
};

// ---------------- CONNECT TO MONGO ----------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");
    await createAdminIfNotExists();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  });

export default app;