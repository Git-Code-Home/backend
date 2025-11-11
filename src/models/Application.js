import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    // processedBy is optional. For client-submitted applications there may be
    // no processing user yet, so make this field optional to avoid server-side
    // validation failures when creating applications from the client portal.
    required: false,
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  visaType: {
    type: String,
    required: true,
  },
  applicationStatus: {
    type: String,
    enum: ["pending", "under_review", "processing", "submitted", "documents-required", "approved", "rejected"],
    default: "pending",
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
  },
  visaDuration: {
    type: String,
  },
  // Multi-country support
  country: { type: String, default: "dubai" },
  formData: { type: mongoose.Schema.Types.Mixed, default: {} },
  // NOTE: `documents` previously existed as an object with specific keys.
  // We keep that existing shape for backward compatibility. If you prefer
  // an array-style documents field, add a new field name to avoid breaking
  // existing code. We will not overwrite the existing `documents` field.
  invoice: {
    paid: { type: Boolean, default: false },
    amount: { type: Number },
    dueDate: { type: Date },
  },
  issueDate: { type: Date },
  expiryDate: { type: Date },
  commissionAmount: { type: Number, default: 0 },
  commissionStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  notes: { type: String },
}, { timestamps: true });

applicationSchema.pre("validate", function (next) {
  if (this.agent) this.processedBy = this.processedBy || undefined;
  next();
});

const Application = mongoose.model("Application", applicationSchema);
export default Application;
