import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";

import adminRoutes from "./src/routes/adminRoutes.js";
import employeeRoutes from "./src/routes/employeeRoutes.js";
import User from "./src/models/User.js";
import agentRoutes from  './src/routes/agentRoutes.js'
dotenv.config();

const app = express();

// ---------------- MIDDLEWARE ----------------
app.use(
  cors({
     origin: [
      "https://visa-management-frontend.vercel.app",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(express.json());

// ---------------- ROUTES ----------------
app.use("/api/admin", adminRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/agent", agentRoutes);


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

    // ✅ Only listen locally (Vercel auto-handles this)
    if (process.env.NODE_ENV !== "production") {
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    }
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  });

// ✅ Export app for Vercel
export default app;
