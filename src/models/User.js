// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String },

    role: {
      type: String,
      enum: ["admin", "employee", "agent", "client"],
      default: "client",
    },

    // 🔹 Account control
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    isBlocked: { type: Boolean, default: false },

    // 🔹 Agent-specific fields
    bankInfo: {
      accountTitle: { type: String },
      accountNumber: { type: String },
      bankName: { type: String },
      jazzcash: { type: String },
      easypaisa: { type: String },
    },

    commissionRate: { type: Number, default: 10 }, // %
    totalCommission: { type: Number, default: 0 },
    pendingCommission: { type: Number, default: 0 },
    paidCommission: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ✅ Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
