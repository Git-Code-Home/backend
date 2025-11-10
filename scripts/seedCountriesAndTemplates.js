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
    { name: "Australia", slug: "australia", region: "australia", active: true },
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
      { key: "purpose", label: "Purpose of travel", type: "select", required: true, options: ["tourism", "business", "study", "family"] },
      { key: "familyDetails", label: "Family Details", type: "text", required: false },
      { key: "frc_mrc", label: "FRC/MRC", type: "text", required: false },
      { key: "travelDate", label: "Travel Date", type: "date", required: false },
      { key: "travelHistory", label: "Travel History", type: "text", required: false },
      { key: "tradeLicenseNumber", label: "Trade License", type: "text", required: false },
      { key: "additionalDocuments", label: "Additional Documents", type: "text", required: false },
    ],
    requiredDocs: ["passport", "picture", "bankStatement", "noc", "salaryCertificate", "tradeLicense"],
    formPdfUrl: "",
  };

  const schengenTemplate = {
    countrySlug: "schengen",
    title: "Schengen - Short Stay (Type C)",
    fields: [
      { key: "fullName", label: "Full Name", type: "text", required: true },
      { key: "dob", label: "Date of Birth", type: "date", required: true },
      { key: "passportNumber", label: "Passport Number", type: "text", required: true },
      { key: "passportExpiry", label: "Passport Expiry", type: "date", required: true },
      { key: "nationality", label: "Nationality", type: "text", required: true },
      { key: "travelPurpose", label: "Purpose of Travel", type: "select", required: true, options: ["tourism", "business", "visiting family/friends"] },
      { key: "intendedEntryDate", label: "Intended Entry Date", type: "date", required: false },
      { key: "durationDays", label: "Duration (days)", type: "number", required: false },
      { key: "accommodationAddress", label: "Accommodation Address", type: "text", required: false },
      { key: "maritalStatus", label: "Marital Status", type: "select", required: false, options: ["Married", "Single"] },
      { key: "travelHistory", label: "Travel History", type: "text", required: false },
      { key: "additionalDocuments", label: "Additional Documents", type: "text", required: false },
    ],
    requiredDocs: ["passport", "idCard", "picture", "bankStatement", "noc", "salaryCertificate"],
    formPdfUrl: "",
  };

  const ukTemplate = {
    countrySlug: "uk",
    title: "United Kingdom - Standard Visitor",
    fields: [
      { key: "fullName", label: "Full Name", type: "text", required: true },
      { key: "dob", label: "Date of Birth", type: "date", required: true },
      { key: "passportNumber", label: "Passport Number", type: "text", required: true },
      { key: "nationality", label: "Nationality", type: "text", required: true },
      { key: "purpose", label: "Purpose of Visit", type: "select", required: true, options: ["tourism", "business", "study", "family"] },
      { key: "stayAddress", label: "Address in UK", type: "text", required: false },
    ],
    requiredDocs: ["passport", "photo", "bankStatement", "accommodationProof"],
    formPdfUrl: "",
  };

  const usaTemplate = {
    countrySlug: "usa",
    title: "United States - Visitor (B1/B2)",
    fields: [
      { key: "fullName", label: "Full Name", type: "text", required: true },
      { key: "dob", label: "Date of Birth", type: "date", required: true },
      { key: "passportNumber", label: "Passport Number", type: "text", required: true },
      { key: "nationality", label: "Nationality", type: "text", required: true },
      { key: "visaCategory", label: "Visa Category", type: "select", required: true, options: ["B1 (Business)", "B2 (Tourism)"] },
      { key: "purposeDetails", label: "Purpose Details", type: "text", required: false },
    ],
    requiredDocs: ["passport", "photo", "bankStatement", "appointmentReceipt"],
    formPdfUrl: "",
  };

  const australiaTemplate = {
    countrySlug: "australia",
    title: "Australia - Visitor Visa",
    fields: [
      { key: "fullName", label: "Full Name", type: "text", required: true },
      { key: "dob", label: "Date of Birth", type: "date", required: true },
      { key: "passportNumber", label: "Passport Number", type: "text", required: true },
      { key: "visaType", label: "Visa Type", type: "select", required: true, options: ["Visitor", "eVisitor", "ETA"] },
      { key: "intendedStay", label: "Intended Stay (days)", type: "number", required: false },
    ],
    requiredDocs: ["passport", "photo", "bankStatement", "healthInsurance"],
    formPdfUrl: "",
  };

  const templates = [dubaiTemplate, canadaTemplate, schengenTemplate, ukTemplate, usaTemplate, australiaTemplate];
  for (const t of templates) {
    await FormTemplate.updateOne({ countrySlug: t.countrySlug }, { $set: t }, { upsert: true });
  }
  console.log("Form templates seeded/updated")

  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
