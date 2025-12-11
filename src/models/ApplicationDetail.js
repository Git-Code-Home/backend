import mongoose from "mongoose";

const applicationDetailSchema = new mongoose.Schema({
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
  fieldName: { type: String, required: true },
  fieldValue: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

const ApplicationDetail = mongoose.model("ApplicationDetail", applicationDetailSchema);
export default ApplicationDetail;
