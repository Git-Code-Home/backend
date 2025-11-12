import Client from "../models/Client.js";
import Application from "../models/Application.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import jwt from "jsonwebtoken";

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// Create application by authenticated client
export const createClientApplication = async (req, res) => {
  try {
    const client = req.client;
    if (!client) return res.status(401).json({ message: "Not authenticated" });

    // If client was provided via the demo token (middleware attaches a stub _id),
    // ensure there is a real Client document for admin to see and link the application to.
    let clientId = client._id;
    try {
      if (String(clientId) === "000000000000000000000000") {
        // Look for an existing demo client by email first
        let demoClient = await Client.findOne({ email: "demo@client.com" });
        if (!demoClient) {
          // Find an employee or admin to assign this demo client to. If none exist, create an admin user.
          let assignUser = await User.findOne({ role: "employee" });
          if (!assignUser) assignUser = await User.findOne({ role: "admin" });
          if (!assignUser) {
            const fallbackAdmin = new User({
              name: process.env.ADMIN_NAME || "System Admin",
              email: process.env.ADMIN_EMAIL || "admin@local",
              password: process.env.ADMIN_PASSWORD || "password",
              role: "admin",
            });
            await fallbackAdmin.save();
            assignUser = fallbackAdmin;
          }

          // Create the demo client with required fields (password + assignedTo)
          demoClient = new Client({
            name: "Demo Client",
            email: "demo@client.com",
            phone: "0000000000",
            password: process.env.DEMO_CLIENT_PASSWORD || "demo-password",
            assignedTo: assignUser._id,
          });
          await demoClient.save();
        }
        clientId = demoClient._id;
      }
    } catch (err) {
      console.warn("Failed to ensure demo client exists:", err && err.message ? err.message : err);
      // proceed using the stub id if anything goes wrong; admin views may still not show it
    }

    // Support both JSON body + multipart/form-data (files)
    const { visaType, visaDuration, country, formData } = req.body || {};

    if (!visaType) return res.status(400).json({ message: "visaType is required" });

    // Helper to resolve template for country (supports Schengen mapping)
    const resolveTemplateForCountry = async (countrySlug) => {
      const FormTemplate = (await import("../models/FormTemplate.js")).default;
      const Country = (await import("../models/Country.js")).default;

      if (!countrySlug) return null;
      const countryRecord = await Country.findOne({ slug: countrySlug }).lean();
      if (countryRecord && countryRecord.formTemplate) {
        return await FormTemplate.findById(countryRecord.formTemplate).lean();
      }
      if (countryRecord && countryRecord.region === "schengen") {
        return await FormTemplate.findOne({ countrySlug: "schengen" }).lean();
      }
      return await FormTemplate.findOne({ countrySlug: countrySlug }).lean();
    };

    // Validate template fields (if present)
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

    // Handle file uploads if present (req.files may be provided by multer.any())
    let documents = {};
    try {
      if (req.files && (Array.isArray(req.files) ? req.files.length > 0 : Object.keys(req.files).length > 0)) {
        // Normalize files into a map: fieldName -> [file,...]
        let filesByField = {};
        if (Array.isArray(req.files)) {
          req.files.forEach((f) => {
            filesByField[f.fieldname] = filesByField[f.fieldname] || [];
            filesByField[f.fieldname].push(f);
          });
        } else {
          filesByField = req.files;
        }

        // Validate requiredDocs from the template, if available
        try {
          const FormTemplate = (await import("../models/FormTemplate.js")).default;
          const Country = (await import("../models/Country.js")).default;

          const tpl = await (async () => {
            const countryRecord = await Country.findOne({ slug: country || "dubai" }).lean();
            if (countryRecord && countryRecord.formTemplate) return await FormTemplate.findById(countryRecord.formTemplate).lean();
            if (countryRecord && countryRecord.region === "schengen") return await FormTemplate.findOne({ countrySlug: "schengen" }).lean();
            return await FormTemplate.findOne({ countrySlug: country || "dubai" }).lean();
          })();

          if (tpl && Array.isArray(tpl.requiredDocs) && tpl.requiredDocs.length > 0) {
            // If the client is only uploading a payment receipt, allow it through
            // without enforcing the full template's required documents. This
            // makes it possible to submit a receipt separately from other docs.
            const uploadedFields = Object.keys(filesByField || {});
            const isOnlyPaymentReceipt = uploadedFields.length === 1 && uploadedFields[0] === "paymentReceipt";

            if (!isOnlyPaymentReceipt) {
              const missingDocs = tpl.requiredDocs.filter((doc) => !(doc in filesByField));
              if (missingDocs.length > 0) {
                return res.status(400).json({ message: "Missing required documents", missing: missingDocs });
              }
            }
          }
        } catch (err) {
          console.warn("Required docs validation skipped (could not load template):", err && err.message ? err.message : err);
        }

        // Upload files to Cloudinary
        const uploadPromises = Object.keys(filesByField).map(async (fieldname) => {
          const file = filesByField[fieldname][0];
          if (!file) return null;
          if (file.buffer) {
            const b64 = Buffer.from(file.buffer).toString("base64");
            const dataURI = `data:${file.mimetype};base64,${b64}`;
            const result = await cloudinary.uploader.upload(dataURI, { folder: "visa_docs", resource_type: "auto" });
            return { field: fieldname, url: result.secure_url };
          }
          if (file.path || file.location) {
            const url = file.path || file.location;
            return { field: fieldname, url };
          }
          return null;
        });

        const uploadedDocs = await Promise.all(uploadPromises);
        uploadedDocs.forEach((d) => {
          if (d && d.field) documents[d.field] = d.url;
        });
      }
    } catch (err) {
      console.error("File processing error in createClientApplication:", err && err.message ? err.message : err);
      return res.status(500).json({ message: "Failed to process uploaded files" });
    }

    const application = await Application.create({
      client: clientId,
      visaType,
      visaDuration,
      country: country || "dubai",
      formData: formData || {},
      documents: documents,
      processedBy: null,
      // Ensure client-submitted apps appear as pending for admin
      applicationStatus: "pending",
      paymentStatus: "unpaid",
    });
    // Return the application object directly so frontend can read created._id
    return res.status(201).json(application);
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
        // Allow uploading a single payment receipt without requiring the
        // rest of the template's documents. This enables employees/clients
        // to upload receipts separately from other application documents.
        const uploadedFields = Object.keys(filesByField || {});
        const isOnlyPaymentReceipt = uploadedFields.length === 1 && uploadedFields[0] === "paymentReceipt";

        if (!isOnlyPaymentReceipt) {
          const missingDocs = tpl.requiredDocs.filter((doc) => !(doc in filesByField));
          if (missingDocs.length > 0) {
            return res.status(400).json({ message: "Missing required documents", missing: missingDocs });
          }
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
