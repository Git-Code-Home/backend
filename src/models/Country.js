import mongoose from "mongoose";

const countrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    region: { type: String },
    active: { type: Boolean, default: true },
    // Optionally associate a Country with a FormTemplate (e.g., Schengen members point to the Schengen template)
    formTemplate: { type: mongoose.Schema.Types.ObjectId, ref: "FormTemplate", default: null },
  },
  { timestamps: true }
);

const Country = mongoose.model("Country", countrySchema);
export default Country;
