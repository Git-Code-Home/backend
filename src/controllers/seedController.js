import Country from "../models/Country.js";
import FormTemplate from "../models/FormTemplate.js";
import Application from "../models/Application.js";

// Runs idempotent seeding for countries and templates. Designed to be called
// from a secure admin-only endpoint. Protect the route with a secret header.
export const runSeed = async (req, res) => {
  try {
    // simple header-based protection (also check ADMIN_SEED_KEY exists)
    const secret = process.env.ADMIN_SEED_KEY || "";
    const provided = req.headers["x-admin-seed-key"] || req.headers["admin-seed-key"];
    if (!secret || provided !== secret) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    // Ensure existing applications have country set
    const updateRes = await Application.updateMany({ country: { $exists: false } }, { $set: { country: "dubai" } });
    const applicationsUpdated = updateRes.modifiedCount ?? updateRes.nModified ?? 0;

    // Seed countries (idempotent)
    const countries = [
      { name: "Dubai", slug: "dubai", region: "gulf", active: true },
      { name: "Schengen", slug: "schengen", region: "schengen", active: true },
      { name: "Canada", slug: "canada", region: "america", active: true },
      { name: "United Kingdom", slug: "uk", region: "uk", active: true },
      { name: "United States", slug: "usa", region: "america", active: true },
    ];

    let countriesUpserted = 0;
    for (const c of countries) {
      const r = await Country.updateOne({ slug: c.slug }, { $set: c }, { upsert: true });
      if (r.upsertedCount || r.upsertedId || r.modifiedCount) countriesUpserted++;
    }

    // Seed FormTemplates for dubai and canada
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

    const r1 = await FormTemplate.updateOne({ countrySlug: dubaiTemplate.countrySlug }, { $set: dubaiTemplate }, { upsert: true });
    const r2 = await FormTemplate.updateOne({ countrySlug: canadaTemplate.countrySlug }, { $set: canadaTemplate }, { upsert: true });

    const templatesUpserted = (r1.upsertedCount || r1.modifiedCount ? 1 : 0) + (r2.upsertedCount || r2.modifiedCount ? 1 : 0);

    return res.json({ ok: true, summary: { applicationsUpdated, countriesUpserted, templatesUpserted } });
  } catch (err) {
    console.error("seedController.runSeed error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
};

export default { runSeed };
