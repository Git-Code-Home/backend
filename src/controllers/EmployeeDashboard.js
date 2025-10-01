import Client from "../models/Client.js";
import Application from "../models/Application.js";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";

// ------------------ REGISTER NEW CLIENT ------------------
// @route   POST /api/employee/clients
// @access  Private (Employee)

const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const registerClient = async (req, res) => {
  try {
    const { name, email, phone, unqualified, password } = req.body;
    const assignedTo = req.user._id; 

    if (!assignedTo) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const client = await Client.create({
      name,
      email,
      phone,
      unqualified,
      password,
      assignedTo, // ✅ make sure this is saved
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




// ------------------ CREATE VISA APPLICATION ------------------
// @route   POST /api/employee/applications
// @access  Private (Employee)
export const createApplication = async (req, res) => {
  try {
    const { clientId, visaType } = req.body;

    const application = await Application.create({
      client: clientId,
      visaType,
      processedBy: req.user._id,
      status: "processing",
      paymentStatus: "unpaid",
    });

    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------ UPLOAD DOCUMENTS ------------------
// @route   POST /api/employee/applications/:id/upload
// @access  Private (Employee)
export const uploadDocuments = async (req, res) => {
  try {
    const applicationId = req.params.id;

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadPromises = Object.keys(req.files).map(async (fieldname) => {
      const file = req.files[fieldname][0];
      const b64 = Buffer.from(file.buffer).toString("base64");
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "visa_docs",
        resource_type: "auto"
      });
      
      return { field: fieldname, url: result.secure_url };
    });

    const uploadedDocs = await Promise.all(uploadPromises);

    const updateData = {};
    uploadedDocs.forEach(doc => {
      updateData[`documents.${doc.field}`] = doc.url;
    });

    const application = await Application.findByIdAndUpdate(
      applicationId,
      { $set: updateData },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.status(200).json({ 
      message: "Documents uploaded successfully", 
      documents: application.documents 
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ------------------ UPDATE PAYMENT ------------------
// @route   PUT /api/employee/applications/:id/payment
// @access  Private (Employee)
export const updatePayment = async (req, res) => {
  try {
    const { status } = req.body; // "paid" | "unpaid"

    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found" });

    application.paymentStatus = status;
    await application.save();

    res.json({ message: "Payment updated", paymentStatus: application.paymentStatus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------ UPDATE STATUS ------------------
// @route   PUT /api/employee/applications/:id/status
// @access  Private (Employee)
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body; // "processing" | "approved" | "rejected"

    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found" });

    application.status = status;
    await application.save();

    res.json({ message: "Status updated", status: application.status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------ GENERATE SECURE VISA LINK ------------------
// @route   GET /api/employee/clients/:id/status-link
// @access  Private (Employee)
export const generateVisaLink = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });

    const secureLink = `${process.env.FRONTEND_URL}/visa-status/${client._id}?token=${generateToken(client._id)}`;

    res.json({ link: secureLink });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------ VIEW ASSIGNED CLIENTS & APPLICATIONS ------------------
// @route   GET /api/employee/my-clients
export const getMyClients = async (req, res) => {
  try {
    const clients = await Client.find({ assignedTo: req.user._id });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ processedBy: req.user._id }).populate("client");
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------ FETCH ALL CLIENTS & APPLICATIONS ------------------
// @route   GET /api/admin/public/data
// @access  Public (no token)
export const getAllClientsAndApplications = async (req, res) => {
  try {
    // ✅ populate assignedTo so we get employee details
    const clients = await Client.find()
      .populate("assignedTo", "name email") // only show employee name & email
      .lean();

    const applications = await Application.find()
      .populate("client")        // show client info
      .populate("processedBy", "name email") // show employee who processed
      .lean();

    res.status(200).json({
      clients,
      applications,
    });
  } catch (error) {
    console.error("Error fetching clients & applications:", error);
    res.status(500).json({ message: error.message });
  }
};


// ------------------ TRACK VISA EXPIRY ------------------
// @route   GET /api/employee/visa-expiry
export const getVisaExpiry = async (req, res) => {
  try {
    const applications = await Application.find({
      processedBy: req.user._id,
      expiryDate: { $exists: true },
    });

    const expiringVisas = applications.filter(app => {
      const daysLeft = (new Date(app.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
      return daysLeft <= 30; 
    });

    res.json(expiringVisas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
