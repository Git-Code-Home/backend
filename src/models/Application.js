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
      required: function () {
        // ✅ Only required if the user creating this document is NOT an agent
        return this.agent == null;
      },
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
      birthCertificate: { type: String },
      bForm: { type: String },
      passportFirstPage: { type: String },
      passportCoverPage: { type: String },
      paymentReceipt: { type: String },
      // add more document types if needed
    },

    visaDuration: {
      type: String, // e.g., "30 days", "90 days", etc.
    },

    invoice: {
      paid: { type: Boolean, default: false },
      amount: { type: Number },
      dueDate: { type: Date },
    },

    // 🔹 Visa issue & expiry tracking
    issueDate: { type: Date },
    expiryDate: { type: Date },

    // 🔹 Commission system for agents
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

// ✅ Prevent "processedBy" required error when created by agent
applicationSchema.pre("validate", function (next) {
  // if agent is present, skip processedBy requirement
  if (this.agent) this.processedBy = this.processedBy || undefined;
  next();
});

const Application = mongoose.model("Application", applicationSchema);

export default Application;
