import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema(
  {
    key: { type: String },
    label: { type: String },
    type: { type: String },
    required: { type: Boolean, default: false },
    options: { type: [String], default: [] },
  },
  { _id: false }
);

const formTemplateSchema = new mongoose.Schema(
  {
    countrySlug: { type: String, required: true, index: true },
    title: { type: String },
    fields: { type: [fieldSchema], default: [] },
    requiredDocs: { type: [String], default: [] },
    formPdfUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

const FormTemplate = mongoose.model("FormTemplate", formTemplateSchema);
export default FormTemplate;
