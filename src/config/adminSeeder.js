import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin already exists:", existingAdmin.email);
      process.exit();
    }

    const admin = new User({
      name: "System Admin",
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: "admin",
    });

    await admin.save();
    console.log("✅ Admin created:", admin.email);

    process.exit();
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();

// {
//     "_id": "68dba56bdf86b4d7f0b74d27",
//     "name": "System Admin",
//     "email": "admin@visa.com",
//     "role": "admin",
//     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGJhNTZiZGY4NmI0ZDdmMGI3NGQyNyIsImlhdCI6MTc1OTIyNTc0MiwiZXhwIjoxNzYxODE3NzQyfQ.7EvnPZzDxBT8oF8B5jJbPB5SV1hboDrxz3Fd2ANBg58"
// }