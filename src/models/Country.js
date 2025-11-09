import mongoose from "mongoose";

const countrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    region: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Country = mongoose.model("Country", countrySchema);
export default Country;
