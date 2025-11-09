import mongoose from "mongoose";
import dotenv from "dotenv";
import Country from "../src/models/Country.js";
import FormTemplate from "../src/models/FormTemplate.js";
import Application from "../src/models/Application.js";
import { connectDB } from "../src/config/db.js";

dotenv.config();

const seed = async () => {
  await connectDB();

  // Ensure existing applications have country set
  const res = await Application.updateMany({ country: { $exists: false } }, { $set: { country: "dubai" } });
  console.log("Applications updated:", res.nModified || res.modifiedCount || 0);

  // Seed countries (idempotent)
  const countries = [
    { name: "Dubai", slug: "dubai", region: "gulf", active: true },
    { name: "Schengen", slug: "schengen", region: "schengen", active: true },
    { name: "Canada", slug: "canada", region: "america", active: true },
    { name: "United Kingdom", slug: "uk", region: "uk", active: true },
    { name: "United States", slug: "usa", region: "america", active: true },
  ];

  for (const c of countries) {
    await Country.updateOne({ slug: c.slug }, { $set: c }, { upsert: true });
  }
  console.log("Countries seeded/updated");

  // Seed a sample FormTemplate for dubai and canada (idempotent)
  const dubaiTemplate = {
    countrySlug: "dubai",
    title: "Dubai - Tourist",
    fields: [
      { key: "fullName", label: "Full Name", type: "text", required: true },
      { key: "dob", label: "Date of Birth", type: "date", required: true },
      { key: "nationality", label: "Nationality", type: "text", required: true },
    ],
    requiredDocs: ["passport", "photo"],
    formPdfUrl: "",
  };

  const canadaTemplate = {
    countrySlug: "canada",
    title: "Canada - Visitor Visa",
    fields: [
      { key: "fullName", label: "Full Name", type: "text", required: true },
      { key: "passportNumber", label: "Passport Number", type: "text", required: true },
      { key: "purpose", label: "Purpose of travel", type: "select", required: true, options: ["tourism", "business", "study"] },
    ],
    requiredDocs: ["passport", "idCard", "bankStatement"],
    formPdfUrl: "",
  };

  await FormTemplate.updateOne({ countrySlug: dubaiTemplate.countrySlug }, { $set: dubaiTemplate }, { upsert: true });
  await FormTemplate.updateOne({ countrySlug: canadaTemplate.countrySlug }, { $set: canadaTemplate }, { upsert: true });
  console.log("Form templates seeded/updated");

  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
