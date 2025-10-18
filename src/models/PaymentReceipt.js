import mongoose from "mongoose";

const paymentReceiptSchema = new mongoose.Schema({
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // could be Employee, Agent, or Applicant
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "agent", "employee", "user"],
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("PaymentReceipt", paymentReceiptSchema);
