// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "employee", "agent", "client"],
      default: "client",
    },
    phone: String,
    status: { type: String, default: "Active" },

    // 🔹 Agent-specific fields
    bankInfo: {
      accountTitle: String,
      accountNumber: String,
      bankName: String,
      jazzcash: String,
      easypaisa: String,
    },
    commissionRate: { type: Number, default: 10 }, // % or fixed rule
    totalCommission: { type: Number, default: 0 },
    pendingCommission: { type: Number, default: 0 },
    paidCommission: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.model("User", userSchema);
