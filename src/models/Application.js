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
      required: true, // ensures the employee who created it is tracked
    },
    visaType: {
      type: String,
      required: true,
    },
    applicationStatus: {
      type: String,
      enum: ["processing", "approved", "rejected", "pending"],
      default: "processing",
      index: true, // for faster queries on status
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
    },
    invoice: {
      paid: { type: Boolean, default: false },
      amount: { type: Number },
      dueDate: { type: Date },
    },
    expiryDate: { type: Date },
    notes: { type: String },
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

const Application = mongoose.model("Application", applicationSchema);

export default Application;
