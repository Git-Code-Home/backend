import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    gateway: {
      type: String,
      enum: ["stripe", "paypal"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    paymentIntentId: {
      type: String,
      sparse: true,
    },
    orderId: {
      type: String,
      sparse: true,
    },
    description: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    failureReason: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for faster queries
paymentSchema.index({ application: 1, user: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ paymentIntentId: 1 });
paymentSchema.index({ orderId: 1 });

export default mongoose.model("Payment", paymentSchema);
