import Client from "../models/Client.js";
import Application from "../models/Application.js";
import cloudinary from "../config/cloudinary.js";

// Create application by authenticated client
export const createClientApplication = async (req, res) => {
  try {
    const client = req.client;
    if (!client) return res.status(401).json({ message: "Not authenticated" });

    const { visaType, visaDuration, country, formData } = req.body || {};

    if (!visaType) return res.status(400).json({ message: "visaType is required" });

    const application = await Application.create({
      client: client._id,
      visaType,
      visaDuration,
      // default to dubai when country not provided
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
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0) || (typeof req.files === 'object' && !Array.isArray(req.files) && Object.keys(req.files).length === 0)) {
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

export default { createClientApplication, uploadClientDocuments };
