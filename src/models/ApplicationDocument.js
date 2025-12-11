import mongoose from "mongoose";

const applicationDocumentSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fieldName: { type: String },
}, { timestamps: true });

const ApplicationDocument = mongoose.model("ApplicationDocument", applicationDocumentSchema);
export default ApplicationDocument;
