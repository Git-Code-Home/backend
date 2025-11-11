import Client from "../models/Client.js";
import Application from "../models/Application.js";
import cloudinary from "../config/cloudinary.js";
import jwt from "jsonwebtoken";

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// Create application by authenticated client
export const createClientApplication = async (req, res) => {
  try {
    const client = req.client;
    if (!client) return res.status(401).json({ message: "Not authenticated" });

    const { visaType, visaDuration, country, formData } = req.body || {};

    if (!visaType) return res.status(400).json({ message: "visaType is required" });

    // Server-side validation: resolve appropriate template for this country (supports Schengen-member mapping)
    const resolveTemplateForCountry = async (countrySlug) => {
      const FormTemplate = (await import("../models/FormTemplate.js")).default;
      const Country = (await import("../models/Country.js")).default;

      if (!countrySlug) return null;

      // Try to find country record to check for a linked template or a region mapping
      const countryRecord = await Country.findOne({ slug: countrySlug }).lean();
      if (countryRecord && countryRecord.formTemplate) {
        // Direct reference to a template
        return await FormTemplate.findById(countryRecord.formTemplate).lean();
      }

      // If this country belongs to a special region (e.g. schengen), use the main region template
      if (countryRecord && countryRecord.region === "schengen") {
        return await FormTemplate.findOne({ countrySlug: "schengen" }).lean();
      }

      // Fallback: try to find a template matching the slug
      return await FormTemplate.findOne({ countrySlug: countrySlug }).lean();
    };

    try {
      const tpl = await resolveTemplateForCountry(country || "dubai");
      if (tpl && Array.isArray(tpl.fields)) {
        const requiredKeys = tpl.fields.filter((f) => f.required).map((f) => f.key).filter(Boolean);
        const missing = [];
        for (const k of requiredKeys) {
          const val = formData ? formData[k] : undefined;
          if (val === undefined || val === null || (typeof val === "string" && String(val).trim() === "")) {
            missing.push(k);
          }
        }
        if (missing.length > 0) {
          return res.status(400).json({ message: "Missing required form fields", missing });
        }
      }
    } catch (err) {
      console.warn("Template validation skipped (could not load template):", err && err.message ? err.message : err);
    }

    const application = await Application.create({
      client: client._id,
      visaType,
      visaDuration,
      // default to dubai when country not provided
      // When Schengen member is provided, we store the selected member slug so uploads reference the member country,
      // but template validation will map to the shared Schengen template via the Country.formTemplate or region.
      country: country || "dubai",
      formData: formData || {},
      processedBy: null,
      status: "submitted",
      paymentStatus: "unpaid",
    });

    res.status(201).json(application);
  } catch (err) {
    console.error("createClientApplication error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Client login - public
export const loginClient = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const client = await Client.findOne({ email: email.toLowerCase() });
    if (!client) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await client.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    res.json({
      _id: client._id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      token: generateToken(client._id),
    });
  } catch (err) {
    console.error("loginClient error:", err);
    res.status(500).json({ message: err.message });
  }
};

// List applications for authenticated client
export const listClientApplications = async (req, res) => {
  try {
    const client = req.client;
    if (!client) return res.status(401).json({ message: "Not authenticated" });

    const apps = await Application.find({ client: client._id })
      .sort({ createdAt: -1 })
      .lean();

    // Map to a simpler shape for frontend convenience
    const mapped = apps.map((a) => ({
      _id: a._id,
      visaType: a.visaType,
      applicationStatus: a.applicationStatus || a.status || a.applicationStatus,
      submitDate: a.createdAt,
      issueDate: a.issueDate,
      expiryDate: a.expiryDate,
      documents: a.documents || {},
      country: a.country,
      formData: a.formData || {},
    }));

    res.json(mapped);
  } catch (err) {
    console.error("listClientApplications error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Upload documents for client application
export const uploadClientDocuments = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const client = req.client;
    if (!client) return res.status(401).json({ message: "Not authenticated" });

    const application = await Application.findById(applicationId);
    if (!application) return res.status(404).json({ message: "Application not found" });

    // Ensure the application belongs to this client
    if (String(application.client) !== String(client._id)) {
      return res.status(403).json({ message: "You do not own this application" });
    }

    // multer.any() produces req.files as an array; upload.fields(...) produces an object
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0) || (typeof req.files === "object" && !Array.isArray(req.files) && Object.keys(req.files).length === 0)) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Normalize files into a map: fieldName -> [file,...]
    let filesByField = {};
    if (Array.isArray(req.files)) {
      req.files.forEach((f) => {
        filesByField[f.fieldname] = filesByField[f.fieldname] || [];
        filesByField[f.fieldname].push(f);
      });
    } else {
      filesByField = req.files; // already a map of arrays
    }

    // Validate requiredDocs from the template associated with this application's country
    try {
      const FormTemplate = (await import("../models/FormTemplate.js")).default;
      const Country = (await import("../models/Country.js")).default;

      // Determine the template to use for the application's country
      let tpl = null;
      const countryRecord = await Country.findOne({ slug: application.country }).lean();
      if (countryRecord && countryRecord.formTemplate) {
        tpl = await FormTemplate.findById(countryRecord.formTemplate).lean();
      } else if (countryRecord && countryRecord.region === "schengen") {
        tpl = await FormTemplate.findOne({ countrySlug: "schengen" }).lean();
      } else {
        tpl = await FormTemplate.findOne({ countrySlug: application.country || "dubai" }).lean();
      }

      if (tpl && Array.isArray(tpl.requiredDocs) && tpl.requiredDocs.length > 0) {
        const missingDocs = tpl.requiredDocs.filter((doc) => !(doc in filesByField));
        if (missingDocs.length > 0) {
          return res.status(400).json({ message: "Missing required documents", missing: missingDocs });
        }
      }
    } catch (err) {
      console.warn("Required docs validation skipped (could not load template):", err && err.message ? err.message : err);
    }

    const uploadPromises = Object.keys(filesByField).map(async (fieldname) => {
      const file = filesByField[fieldname][0];
      // Support both memory-buffer uploads and multer-storage-cloudinary (which may not have buffer)
      if (!file) return null;

      if (file.buffer) {
        const b64 = Buffer.from(file.buffer).toString("base64");
        const dataURI = `data:${file.mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataURI, {
          folder: "visa_docs",
          resource_type: "auto",
        });

        return { field: fieldname, url: result.secure_url };
      }

      // If file already has a path/url (e.g., Cloudinary storage engine), prefer that
      if (file.path || file.location) {
        const url = file.path || file.location;
        return { field: fieldname, url };
      }

      return null;
    });

    const uploadedDocs = await Promise.all(uploadPromises);

    const updateData = {};
    uploadedDocs.forEach((doc) => {
      updateData[`documents.${doc.field}`] = doc.url;
    });

    if (updateData['documents.paymentReceipt']) {
      updateData['invoice.paid'] = true;
      updateData['applicationStatus'] = 'processing';
    }

    const updated = await Application.findByIdAndUpdate(applicationId, { $set: updateData }, { new: true });
    return res.json({ message: "Documents uploaded successfully", documents: updated.documents });
  } catch (err) {
    console.error("uploadClientDocuments error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ------------------ UPLOAD A SINGLE DOCUMENT FOR CLIENT (no full-template validation)
// @route   POST /api/client/applications/:id/upload-document
// @access  Private (Client)
export default { createClientApplication, uploadClientDocuments, listClientApplications };
