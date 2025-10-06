import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true, // ensures every application is linked to a client
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // employee/admin who created it
    },

    // 🔹 NEW: Agent assigned to this application
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // may be unassigned initially
    },

    visaType: {
      type: String,
      required: true,
    },

    applicationStatus: {
      type: String,
      enum: ["processing", "approved", "rejected", "pending"],
      default: "processing",
      index: true,
    },

    processingPriority: {
      type: String,
      enum: ["normal", "high", "urgent"],
      default: "normal",
    },

    documents: {
      passport: { type: String },
      photo: { type: String },
      idCard: { type: String },
      // you can add more document types if needed
    },

    invoice: {
      paid: { type: Boolean, default: false },
      amount: { type: Number },
      dueDate: { type: Date },
    },

    // 🔹 NEW: Visa issue & expiry tracking
    issueDate: { type: Date },
    expiryDate: { type: Date },

    // 🔹 NEW: Commission system for agents
    commissionAmount: { type: Number, default: 0 },
    commissionStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },

    // 🔹 Track last updater (admin/agent/employee)
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    notes: { type: String },
  },
  { timestamps: true }
);

const Application = mongoose.model("Application", applicationSchema);

export default Application;
