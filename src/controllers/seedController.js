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
      { name: "Australia", slug: "australia", region: "australia", active: true },
    ];

    let countriesUpserted = 0;
    for (const c of countries) {
      const r = await Country.updateOne({ slug: c.slug }, { $set: c }, { upsert: true });
      if (r.upsertedCount || r.upsertedId || r.modifiedCount) countriesUpserted++;
    }

    // Seed FormTemplates for dubai, canada, schengen, uk, usa, australia
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
      requiredDocs: [
        "Passport",
        "Picture",
        "Bank statement",
        "NOC",
        "Salary certificate",
        "Family details",
        "FRC/MRC",
        "Travel date",
        "Travel history",
        "Trade license",
        "Additional documents",
      ],
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
      requiredDocs: [
        "Passport",
        "ID card",
        "Picture",
        "Bank statement (3–6 months)",
        "NOC",
        "Salary certificate",
        "Marital status (Married/Single)",
        "Travel history",
        "Additional documents",
      ],
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
      ],
      requiredDocs: ["Passport", "Picture", "Bank statement"],
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
      ],
      requiredDocs: ["Passport", "Picture", "Bank statement"],
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
      ],
      requiredDocs: ["Passport", "Picture", "Bank statement"],
      formPdfUrl: "",
    };

    const allTemplates = [dubaiTemplate, canadaTemplate, schengenTemplate, ukTemplate, usaTemplate, australiaTemplate];
    let templatesUpserted = 0;
    for (const t of allTemplates) {
      const r = await FormTemplate.updateOne({ countrySlug: t.countrySlug }, { $set: t }, { upsert: true });
      if (r.upsertedCount || r.modifiedCount || r.nModified) templatesUpserted++;
    }

    // Link Schengen member countries to the Schengen template
    try {
      const schengenTpl = await FormTemplate.findOne({ countrySlug: "schengen" }).lean();
      if (schengenTpl) {
        const schengenMembers = [
          { name: "Austria", slug: "austria" },
          { name: "Belgium", slug: "belgium" },
          { name: "Czech Republic", slug: "czech-republic" },
          { name: "Denmark", slug: "denmark" },
          { name: "Estonia", slug: "estonia" },
          { name: "Finland", slug: "finland" },
          { name: "France", slug: "france" },
          { name: "Germany", slug: "germany" },
          { name: "Greece", slug: "greece" },
          { name: "Hungary", slug: "hungary" },
          { name: "Iceland", slug: "iceland" },
          { name: "Italy", slug: "italy" },
          { name: "Latvia", slug: "latvia" },
          { name: "Liechtenstein", slug: "liechtenstein" },
          { name: "Lithuania", slug: "lithuania" },
          { name: "Luxembourg", slug: "luxembourg" },
          { name: "Malta", slug: "malta" },
          { name: "Netherlands", slug: "netherlands" },
          { name: "Norway", slug: "norway" },
          { name: "Poland", slug: "poland" },
          { name: "Portugal", slug: "portugal" },
          { name: "Slovakia", slug: "slovakia" },
          { name: "Slovenia", slug: "slovenia" },
          { name: "Spain", slug: "spain" },
          { name: "Sweden", slug: "sweden" },
          { name: "Switzerland", slug: "switzerland" },
        ];

        for (const m of schengenMembers) {
          await Country.updateOne(
            { slug: m.slug },
            {
              $set: {
                name: m.name,
                slug: m.slug,
                region: "schengen",
                active: true,
                formTemplate: schengenTpl._id,
              },
            },
            { upsert: true }
          );
        }
      }
    } catch (err) {
      console.warn("Failed to link Schengen members:", err);
    }

    return res.json({ ok: true, summary: { applicationsUpdated, countriesUpserted, templatesUpserted } });
  } catch (err) {
    console.error("seedController.runSeed error:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
};

export default { runSeed };
