// import Client from "../models/Client.js";
// import Application from "../models/Application.js";
// import cloudinary from "../config/cloudinary.js";
// import multer from "multer";

// // ------------------ REGISTER NEW CLIENT ------------------
// // @route   POST /api/employee/clients
// // @access  Private (Employee)

// const storage = multer.memoryStorage();
// export const upload = multer({ storage });

// export const registerClient = async (req, res) => {
//   try {
//     const { name, email, phone, unqualified, password } = req.body;
//     const assignedTo = req.user._id; 

//     if (!assignedTo) {
//       return res.status(400).json({ message: "Employee ID is required" });
//     }

//     const client = await Client.create({
//       name,
//       email,
//       phone,
//       unqualified,
//       password,
//       assignedTo, // ✅ make sure this is saved
//     });

//     res.status(201).json(client);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };




// // ------------------ CREATE VISA APPLICATION ------------------
// // @route   POST /api/employee/applications
// // @access  Private (Employee)
// export const createApplication = async (req, res) => {
//   try {
//     const { clientId, visaType } = req.body;

//     const application = await Application.create({
//       client: clientId,
//       visaType,
//       processedBy: req.user._id,
//       status: "processing",
//       paymentStatus: "unpaid",
//     });

//     res.status(201).json(application);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ UPLOAD DOCUMENTS ------------------
// // @route   POST /api/employee/applications/:id/upload
// // @access  Private (Employee)
// export const uploadDocuments = async (req, res) => {
//   try {
//     const applicationId = req.params.id;

//     if (!req.files || Object.keys(req.files).length === 0) {
//       return res.status(400).json({ message: "No files uploaded" });
//     }

//     const uploadPromises = Object.keys(req.files).map(async (fieldname) => {
//       const file = req.files[fieldname][0];
//       const b64 = Buffer.from(file.buffer).toString("base64");
//       const dataURI = `data:${file.mimetype};base64,${b64}`;
      
//       const result = await cloudinary.uploader.upload(dataURI, {
//         folder: "visa_docs",
//         resource_type: "auto"
//       });
      
//       return { field: fieldname, url: result.secure_url };
//     });

//     const uploadedDocs = await Promise.all(uploadPromises);

//     const updateData = {};
//     uploadedDocs.forEach(doc => {
//       updateData[`documents.${doc.field}`] = doc.url;
//     });

//     const application = await Application.findByIdAndUpdate(
//       applicationId,
//       { $set: updateData },
//       { new: true }
//     );

//     if (!application) {
//       return res.status(404).json({ message: "Application not found" });
//     }

//     res.status(200).json({ 
//       message: "Documents uploaded successfully", 
//       documents: application.documents 
//     });

//   } catch (error) {
//     console.error("Upload error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ UPDATE PAYMENT ------------------
// // @route   PUT /api/employee/applications/:id/payment
// // @access  Private (Employee)
// export const updatePayment = async (req, res) => {
//   try {
//     const { status } = req.body; // "paid" | "unpaid"

//     const application = await Application.findById(req.params.id);
//     if (!application) return res.status(404).json({ message: "Application not found" });

//     application.paymentStatus = status;
//     await application.save();

//     res.json({ message: "Payment updated", paymentStatus: application.paymentStatus });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ UPDATE STATUS ------------------
// // @route   PUT /api/employee/applications/:id/status
// // @access  Private (Employee)
// export const updateStatus = async (req, res) => {
//   try {
//     const { status } = req.body; // "processing" | "approved" | "rejected"

//     const application = await Application.findById(req.params.id);
//     if (!application) return res.status(404).json({ message: "Application not found" });

//     application.status = status;
//     await application.save();

//     res.json({ message: "Status updated", status: application.status });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ GENERATE SECURE VISA LINK ------------------
// // @route   GET /api/employee/clients/:id/status-link
// // @access  Private (Employee)
// export const generateVisaLink = async (req, res) => {
//   try {
//     const client = await Client.findById(req.params.id);
//     if (!client) return res.status(404).json({ message: "Client not found" });

//     const secureLink = `${process.env.FRONTEND_URL}/visa-status/${client._id}?token=${generateToken(client._id)}`;

//     res.json({ link: secureLink });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ VIEW ASSIGNED CLIENTS & APPLICATIONS ------------------
// // @route   GET /api/employee/my-clients
// export const getMyClients = async (req, res) => {
//   try {
//     const clients = await Client.find({ assignedTo: req.user._id });
//     res.json(clients);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getMyApplications = async (req, res) => {
//   try {
//     const applications = await Application.find({ processedBy: req.user._id }).populate("client");
//     res.json(applications);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ FETCH ALL CLIENTS & APPLICATIONS ------------------
// // @route   GET /api/admin/public/data
// // @access  Public (no token)
// export const getAllClientsAndApplications = async (req, res) => {
//   try {
//     // ✅ populate assignedTo so we get employee details
//     const clients = await Client.find()
//       .populate("assignedTo", "name email") // only show employee name & email
//       .lean();

//     const applications = await Application.find()
//       .populate("client")        // show client info
//       .populate("processedBy", "name email") // show employee who processed
//       .lean();

//     res.status(200).json({
//       clients,
//       applications,
//     });
//   } catch (error) {
//     console.error("Error fetching clients & applications:", error);
//     res.status(500).json({ message: error.message });
//   }
// };


// // ------------------ TRACK VISA EXPIRY ------------------
// // @route   GET /api/employee/visa-expiry
// export const getVisaExpiry = async (req, res) => {
//   try {
//     const applications = await Application.find({
//       processedBy: req.user._id,
//       expiryDate: { $exists: true },
//     });

//     const expiringVisas = applications.filter(app => {
//       const daysLeft = (new Date(app.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
//       return daysLeft <= 30; 
//     });

//     res.json(expiringVisas);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


// import Client from "../models/Client.js";
// import Application from "../models/Application.js";
// import cloudinary from "../config/cloudinary.js";
// import multer from "multer";

// // ------------------ REGISTER NEW CLIENT ------------------
// // @route   POST /api/employee/clients
// // @access  Private (Employee)

// const storage = multer.memoryStorage();
// export const upload = multer({ storage });

// export const registerClient = async (req, res) => {
//   try {
//     const { name, email, phone, unqualified, password } = req.body;
//     const assignedTo = req.user._id;

//     if (!assignedTo) {
//       return res.status(400).json({ message: "Employee ID is required" });
//     }

//     const client = await Client.create({
//       name,
//       email,
//       phone,
//       unqualified,
//       password,
//       assignedTo, // ensure saved
//     });

//     res.status(201).json(client);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ CREATE VISA APPLICATION ------------------
// // @route   POST /api/employee/applications
// // @access  Private (Employee)
// export const createApplication = async (req, res) => {
//   try {
//     const { clientId, visaType } = req.body;

//     const application = await Application.create({
//       client: clientId,
//       visaType,
//       processedBy: req.user._id,
//       status: "processing",
//       paymentStatus: "unpaid",
//     });

//     res.status(201).json(application);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ UPLOAD DOCUMENTS ------------------
// // @route   POST /api/employee/applications/:id/upload
// // @access  Private (Employee)
// export const uploadDocuments = async (req, res) => {
//   try {
//     const applicationId = req.params.id;

//     if (!req.files || Object.keys(req.files).length === 0) {
//       return res.status(400).json({ message: "No files uploaded" });
//     }

//     const uploadPromises = Object.keys(req.files).map(async (fieldname) => {
//       const file = req.files[fieldname][0];
//       const b64 = Buffer.from(file.buffer).toString("base64");
//       const dataURI = `data:${file.mimetype};base64,${b64}`;

//       const result = await cloudinary.uploader.upload(dataURI, {
//         folder: "visa_docs",
//         resource_type: "auto",
//       });

//       return { field: fieldname, url: result.secure_url };
//     });

//     const uploadedDocs = await Promise.all(uploadPromises);

//     const updateData = {};
//     uploadedDocs.forEach((doc) => {
//       updateData[`documents.${doc.field}`] = doc.url;
//     });

//     const application = await Application.findByIdAndUpdate(
//       applicationId,
//       { $set: updateData },
//       { new: true }
//     );

//     if (!application) {
//       return res.status(404).json({ message: "Application not found" });
//     }

//     res.status(200).json({
//       message: "Documents uploaded successfully",
//       documents: application.documents,
//     });
//   } catch (error) {
//     console.error("Upload error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ UPDATE PAYMENT ------------------
// // @route   PUT /api/employee/applications/:id/payment
// // @access  Private (Employee)
// export const updatePayment = async (req, res) => {
//   try {
//     const { status } = req.body; // "paid" | "unpaid"

//     const application = await Application.findById(req.params.id);
//     if (!application) return res.status(404).json({ message: "Application not found" });

//     application.paymentStatus = status;
//     await application.save();

//     res.json({ message: "Payment updated", paymentStatus: application.paymentStatus });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ UPDATE STATUS ------------------
// // @route   PUT /api/employee/applications/:id/status
// // @access  Private (Employee)
// export const updateStatus = async (req, res) => {
//   try {
//     const { status } = req.body; // "processing" | "approved" | "rejected"

//     const application = await Application.findById(req.params.id);
//     if (!application) return res.status(404).json({ message: "Application not found" });

//     application.status = status;
//     await application.save();

//     res.json({ message: "Status updated", status: application.status });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ GENERATE SECURE VISA LINK ------------------
// // @route   GET /api/employee/clients/:id/status-link
// // @access  Private (Employee)
// export const generateVisaLink = async (req, res) => {
//   try {
//     const client = await Client.findById(req.params.id);
//     if (!client) return res.status(404).json({ message: "Client not found" });

//     // If you use generateToken, import it from your utils first.
//     const secureLink = `${process.env.FRONTEND_URL}/visa-status/${client._id}?token=${generateToken(client._id)}`;

//     res.json({ link: secureLink });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ VIEW ASSIGNED CLIENTS & APPLICATIONS ------------------
// // @route   GET /api/employee/my-clients
// export const getMyClients = async (req, res) => {
//   try {
//     const clients = await Client.find({ assignedTo: req.user._id });
//     res.json(clients);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getMyApplications = async (req, res) => {
//   try {
//     const applications = await Application.find({ processedBy: req.user._id }).populate("client");
//     res.json(applications);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ FETCH ALL CLIENTS & APPLICATIONS (ADMIN) ------------------
// // @route   GET /api/admin/clients   (you can also alias /api/admin/public/data if your UI calls it)
// // @access  Private (Admin)
// export const getAllClientsAndApplications = async (req, res) => {
//   try {
//     const clients = await Client.find()
//       .populate("assignedTo", "name email")
//       .lean();

//     const applications = await Application.find()
//       .populate("client")
//       .populate("processedBy", "name email")
//       .lean();

//     res.status(200).json({ clients, applications });
//   } catch (error) {
//     console.error("Error fetching clients & applications:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ GET SINGLE CLIENT DETAILS (ADMIN) ------------------
// // @route   GET /api/admin/clients/:clientId
// // @access  Private (Admin)
// export const getClientDetails = async (req, res) => {
//   try {
//     const client = await Client.findById(req.params.clientId)
//       .populate("assignedTo", "name email")
//       .lean();

//     if (!client) {
//       return res.status(404).json({ message: "Client not found" });
//     }

//     res.status(200).json(client);
//   } catch (error) {
//     console.error("Error fetching client details:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ GET APPLICATIONS FOR A CLIENT (ADMIN) ------------------
// // @route   GET /api/admin/clients/:clientId/applications
// // @access  Private (Admin)
// export const getClientApplications = async (req, res) => {
//   try {
//     const apps = await Application.find({ client: req.params.clientId })
//       .populate("processedBy", "name email")
//       .lean();
//     res.status(200).json(apps);
//   } catch (error) {
//     console.error("Error fetching client applications:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ TRACK VISA EXPIRY ------------------
// // @route   GET /api/employee/visa-expiry
// export const getVisaExpiry = async (req, res) => {
//   try {
//     const applications = await Application.find({
//       processedBy: req.user._id,
//       expiryDate: { $exists: true },
//     });

//     const expiringVisas = applications.filter((app) => {
//       const daysLeft = (new Date(app.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
//       return daysLeft <= 30;
//     });

//     res.json(expiringVisas);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ GET APPLICATIONS FOR A CLIENT (ADMIN) ------------------
// // @route   GET /api/admin/clients/:clientId/applications
// // @access  Private (Admin)
// export const getClientApplications = async (req, res) => {
//   try {
//     const apps = await Application.find({ client: req.params.clientId })
//       .populate("processedBy", "name email")
//       .lean();
//     res.status(200).json(apps);
//   } catch (error) {
//     console.error("Error fetching client applications:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// import Client from "../models/Client.js";
// import Application from "../models/Application.js";
// import cloudinary from "../config/cloudinary.js";
// import multer from "multer";
// // import Application from "../models/Application.js";

// // ------------------ REGISTER NEW CLIENT ------------------
// // @route   POST /api/employee/clients
// // @access  Private (Employee)

// const storage = multer.memoryStorage();
// export const upload = multer({ storage });

// export const registerClient = async (req, res) => {
//   try {
//     const { name, email, phone, unqualified, password } = req.body;
//     const assignedTo = req.user._id;

//     if (!assignedTo) {
//       return res.status(400).json({ message: "Employee ID is required" });
//     }

//     const client = await Client.create({
//       name,
//       email,
//       phone,
//       unqualified,
//       password,
//       assignedTo, // ensure saved
//     });

//     res.status(201).json(client);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ CREATE VISA APPLICATION ------------------
// // @route   POST /api/employee/applications
// // @access  Private (Employee)
// export const createApplication = async (req, res) => {
//   try {
//     const { clientId, visaType } = req.body;

//     const application = await Application.create({
//       client: clientId,
//       visaType,
//       processedBy: req.user._id,
//       status: "processing",
//       paymentStatus: "unpaid",
//     });

//     res.status(201).json(application);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ UPLOAD DOCUMENTS ------------------
// // @route   POST /api/employee/applications/:id/upload
// // @access  Private (Employee)
// export const uploadDocuments = async (req, res) => {
//   try {
//     const applicationId = req.params.id;

//     if (!req.files || Object.keys(req.files).length === 0) {
//       return res.status(400).json({ message: "No files uploaded" });
//     }

//     const uploadPromises = Object.keys(req.files).map(async (fieldname) => {
//       const file = req.files[fieldname][0];
//       const b64 = Buffer.from(file.buffer).toString("base64");
//       const dataURI = `data:${file.mimetype};base64,${b64}`;

//       const result = await cloudinary.uploader.upload(dataURI, {
//         folder: "visa_docs",
//         resource_type: "auto",
//       });

//       return { field: fieldname, url: result.secure_url };
//     });

//     const uploadedDocs = await Promise.all(uploadPromises);

//     const updateData = {};
//     uploadedDocs.forEach((doc) => {
//       updateData[`documents.${doc.field}`] = doc.url;
//     });

//     const application = await Application.findByIdAndUpdate(
//       applicationId,
//       { $set: updateData },
//       { new: true }
//     );

//     if (!application) {
//       return res.status(404).json({ message: "Application not found" });
//     }

//     res.status(200).json({
//       message: "Documents uploaded successfully",
//       documents: application.documents,
//     });
//   } catch (error) {
//     console.error("Upload error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ UPDATE PAYMENT ------------------
// // @route   PUT /api/employee/applications/:id/payment
// // @access  Private (Employee)
// export const updatePayment = async (req, res) => {
//   try {
//     const { status } = req.body; // "paid" | "unpaid"

//     const application = await Application.findById(req.params.id);
//     if (!application) return res.status(404).json({ message: "Application not found" });

//     application.paymentStatus = status;
//     await application.save();

//     res.json({ message: "Payment updated", paymentStatus: application.paymentStatus });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ UPDATE STATUS ------------------
// // @route   PUT /api/employee/applications/:id/status
// // @access  Private (Employee)
// export const updateStatus = async (req, res) => {
//   try {
//     const { status } = req.body; // "processing" | "approved" | "rejected"

//     const application = await Application.findById(req.params.id);
//     if (!application) return res.status(404).json({ message: "Application not found" });

//     application.status = status;
//     await application.save();

//     res.json({ message: "Status updated", status: application.status });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ GENERATE SECURE VISA LINK ------------------
// // @route   GET /api/employee/clients/:id/status-link
// // @access  Private (Employee)
// export const generateVisaLink = async (req, res) => {
//   try {
//     const client = await Client.findById(req.params.id);
//     if (!client) return res.status(404).json({ message: "Client not found" });

//     // If you use generateToken, import it from your utils first.
//     const secureLink = `${process.env.FRONTEND_URL}/visa-status/${client._id}?token=${generateToken(client._id)}`;

//     res.json({ link: secureLink });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ VIEW ASSIGNED CLIENTS & APPLICATIONS ------------------
// // @route   GET /api/employee/my-clients
// export const getMyClients = async (req, res) => {
//   try {
//     const clients = await Client.find({ assignedTo: req.user._id });
//     res.json(clients);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getMyApplications = async (req, res) => {
//   try {
//     const applications = await Application.find({ processedBy: req.user._id }).populate("client");
//     res.json(applications);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ FETCH ALL CLIENTS & APPLICATIONS (ADMIN) ------------------
// // @route   GET /api/admin/clients
// // @access  Private (Admin)
// export const getAllClientsAndApplications = async (req, res) => {
//   try {
//     const clients = await Client.find()
//       .populate("assignedTo", "name email")
//       .lean();

//     const applications = await Application.find()
//       .populate("client")
//       .populate("processedBy", "name email")
//       .lean();

//     res.status(200).json({ clients, applications });
//   } catch (error) {
//     console.error("Error fetching clients & applications:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ GET SINGLE CLIENT DETAILS (ADMIN) ------------------
// // @route   GET /api/admin/clients/:clientId
// // @access  Private (Admin)
// export const getClientDetails = async (req, res) => {
//   try {
//     const client = await Client.findById(req.params.clientId)
//       .populate("assignedTo", "name email")
//       .lean();

//     if (!client) {
//       return res.status(404).json({ message: "Client not found" });
//     }

//     res.status(200).json(client);
//   } catch (error) {
//     console.error("Error fetching client details:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ GET APPLICATIONS FOR A CLIENT (ADMIN) ------------------
// // @route   GET /api/admin/clients/:clientId/applications
// // @access  Private (Admin)
// export const getClientApplications = async (req, res) => {
//   try {
//     const apps = await Application.find({ client: req.params.clientId })
//       .populate("processedBy", "name email")
//       .lean();
//     res.status(200).json(apps);
//   } catch (error) {
//     console.error("Error fetching client applications:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ TRACK VISA EXPIRY ------------------
// // @route   GET /api/employee/visa-expiry
// export const getVisaExpiry = async (req, res) => {
//   try {
//     const applications = await Application.find({
//       processedBy: req.user._id,
//       expiryDate: { $exists: true },
//     });

//     const expiringVisas = applications.filter((app) => {
//       const daysLeft = (new Date(app.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
//       return daysLeft <= 30;
//     });

//     res.json(expiringVisas);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ GET ACTIVITY HISTORY FOR A CLIENT (ADMIN) ------------------
// // @route   GET /api/admin/clients/:clientId/activity
// // @access  Private (Admin)
// export const getClientActivity = async (req, res) => {
//   try {
//     // If you have an Activity model, use it. Otherwise, fetch from Client or Application as needed.
//     // Example: If activity is stored in Client model as an array:
//     const client = await Client.findById(req.params.clientId).lean();
//     if (!client) {
//       return res.status(404).json({ message: "Client not found" });
//     }
//     // If you store activity in client.activity array:
//     const activity = client.activity || [];
//     res.status(200).json(activity);
//   } catch (error) {
//     console.error("Error fetching client activity:", error);
//     res.status(500).json({ message: error.message });
//   }
// };
// export const updateApplicationStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;
//     if (!status) {
//       return res.status(400).json({ message: "Status is required" });
//     }
//     const app = await Application.findById(id);
//     if (!app) {
//       return res.status(404).json({ message: "Application not found" });
//     }
//     app.applicationStatus = status;
//     await app.save();
//     res.json({ message: "Status updated", application: app });
//   } catch (error) {
//     console.error("[v0] updateApplicationStatus error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };
// // ------------------ GET ALL APPLICATIONS (ADMIN) ------------------
// // @route   GET /api/admin/applications
// // @access  Private (Admin)
// export const getAllApplications = async (req, res) => {
//   try {
//     const applications = await Application.find()
//       .populate("client")
//       .populate("processedBy", "name email")
//       .lean();
//     res.status(200).json(applications);
//   } catch (error) {
//     console.error("Error fetching all applications:", error);
//     res.status(500).json({ message: error.message });
//   }
// };


// import Client from "../models/Client.js";
// import Application from "../models/Application.js";
// import cloudinary from "../config/cloudinary.js";
// import multer from "multer";

// // ------------------ REGISTER NEW CLIENT ------------------
// // @route   POST /api/employee/clients
// // @access  Private (Employee)

// const storage = multer.memoryStorage();
// export const upload = multer({ storage });

// export const registerClient = async (req, res) => {
//   try {
//     const { name, email, phone, unqualified, password } = req.body;
//     const assignedTo = req.user._id;

//     if (!assignedTo) {
//       return res.status(400).json({ message: "Employee ID is required" });
//     }

//     const client = await Client.create({
//       name,
//       email,
//       phone,
//       unqualified,
//       password,
//       assignedTo,
//     });

//     res.status(201).json(client);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ CREATE VISA APPLICATION ------------------
// // @route   POST /api/employee/applications
// // @access  Private (Employee)
// export const createApplication = async (req, res) => {
//   try {
//     const { clientId, visaType } = req.body;

//     const application = await Application.create({
//       client: clientId,
//       visaType,
//       processedBy: req.user._id,
//       status: "processing",
//       paymentStatus: "unpaid",
//     });

//     res.status(201).json(application);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ UPLOAD DOCUMENTS ------------------
// // @route   POST /api/employee/applications/:id/upload
// // @access  Private (Employee)
// export const uploadDocuments = async (req, res) => {
//   try {
//     const applicationId = req.params.id;

//     if (!req.files || Object.keys(req.files).length === 0) {
//       return res.status(400).json({ message: "No files uploaded" });
//     }

//     const uploadPromises = Object.keys(req.files).map(async (fieldname) => {
//       const file = req.files[fieldname][0];
//       const b64 = Buffer.from(file.buffer).toString("base64");
//       const dataURI = `data:${file.mimetype};base64,${b64}`;

//       const result = await cloudinary.uploader.upload(dataURI, {
//         folder: "visa_docs",
//         resource_type: "auto",
//       });

//       return { field: fieldname, url: result.secure_url };
//     });

//     const uploadedDocs = await Promise.all(uploadPromises);

//     const updateData = {};
//     uploadedDocs.forEach((doc) => {
//       updateData[`documents.${doc.field}`] = doc.url;
//     });

//     const application = await Application.findByIdAndUpdate(
//       applicationId,
//       { $set: updateData },
//       { new: true }
//     );

//     if (!application) {
//       return res.status(404).json({ message: "Application not found" });
//     }

//     res.status(200).json({
//       message: "Documents uploaded successfully",
//       documents: application.documents,
//     });
//   } catch (error) {
//     console.error("Upload error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ UPDATE PAYMENT ------------------
// // @route   PUT /api/employee/applications/:id/payment
// // @access  Private (Employee)
// export const updatePayment = async (req, res) => {
//   try {
//     const { status } = req.body;

//     const application = await Application.findById(req.params.id);
//     if (!application) return res.status(404).json({ message: "Application not found" });

//     application.paymentStatus = status;
//     await application.save();

//     res.json({ message: "Payment updated", paymentStatus: application.paymentStatus });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ UPDATE STATUS ------------------
// // @route   PUT /api/employee/applications/:id/status
// // @access  Private (Employee)
// export const updateStatus = async (req, res) => {
//   try {
//     const { status } = req.body;

//     const application = await Application.findById(req.params.id);
//     if (!application) return res.status(404).json({ message: "Application not found" });

//     application.status = status;
//     await application.save();

//     res.json({ message: "Status updated", status: application.status });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ GENERATE SECURE VISA LINK ------------------
// // @route   GET /api/employee/clients/:id/status-link
// // @access  Private (Employee)
// export const generateVisaLink = async (req, res) => {
//   try {
//     const client = await Client.findById(req.params.id);
//     if (!client) return res.status(404).json({ message: "Client not found" });

//     const secureLink = `${process.env.FRONTEND_URL}/visa-status/${client._id}`;

//     res.json({ link: secureLink });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ VIEW ASSIGNED CLIENTS & APPLICATIONS ------------------
// // @route   GET /api/employee/my-clients
// export const getMyClients = async (req, res) => {
//   try {
//     const clients = await Client.find({ assignedTo: req.user._id });
//     res.json(clients);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getMyApplications = async (req, res) => {
//   try {
//     const applications = await Application.find({ processedBy: req.user._id }).populate("client");
//     res.json(applications);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ FETCH ALL CLIENTS & APPLICATIONS (ADMIN) ------------------
// // @route   GET /api/admin/clients
// // @access  Private (Admin)
// export const getAllClientsAndApplications = async (req, res) => {
//   try {
//     const clients = await Client.find()
//       .populate("assignedTo", "name email")
//       .lean();

//     const applications = await Application.find()
//       .populate("client")
//       .populate("processedBy", "name email")
//       .lean();

//     res.status(200).json({ clients, applications });
//   } catch (error) {
//     console.error("Error fetching clients & applications:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ GET SINGLE CLIENT DETAILS (ADMIN) ------------------
// // @route   GET /api/admin/clients/:clientId
// // @access  Private (Admin)
// export const getClientDetails = async (req, res) => {
//   try {
//     const client = await Client.findById(req.params.clientId)
//       .populate("assignedTo", "name email")
//       .lean();

//     if (!client) {
//       return res.status(404).json({ message: "Client not found" });
//     }

//     res.status(200).json(client);
//   } catch (error) {
//     console.error("Error fetching client details:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ GET APPLICATIONS FOR A CLIENT (ADMIN) ------------------
// // @route   GET /api/admin/clients/:clientId/applications
// // @access  Private (Admin)
// export const getClientApplications = async (req, res) => {
//   try {
//     const apps = await Application.find({ client: req.params.clientId })
//       .populate("processedBy", "name email")
//       .lean();
//     res.status(200).json(apps);
//   } catch (error) {
//     console.error("Error fetching client applications:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ GET ALL APPLICATIONS (ADMIN) ------------------
// // @route   GET /api/admin/applications
// // @access  Private (Admin)
// export const getAllApplications = async (req, res) => {
//   try {
//     const applications = await Application.find()
//       .populate("client")
//       .populate("processedBy", "name email")
//       .lean();
//     res.status(200).json(applications);
//   } catch (error) {
//     console.error("Error fetching all applications:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ UPDATE APPLICATION STATUS (ADMIN) ------------------
// // @route   PATCH /api/admin/applications/:id/status
// // @access  Private (Admin)
// export const updateApplicationStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;
    
//     if (!status) {
//       return res.status(400).json({ message: "Status is required" });
//     }
    
//     const app = await Application.findById(id);
//     if (!app) {
//       return res.status(404).json({ message: "Application not found" });
//     }
    
//     app.applicationStatus = status;
//     await app.save();
    
//     res.json({ message: "Status updated", application: app });
//   } catch (error) {
//     console.error("[v0] updateApplicationStatus error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ TRACK VISA EXPIRY ------------------
// // @route   GET /api/employee/visa-expiry
// export const getVisaExpiry = async (req, res) => {
//   try {
//     const applications = await Application.find({
//       processedBy: req.user._id,
//       expiryDate: { $exists: true },
//     });

//     const expiringVisas = applications.filter((app) => {
//       const daysLeft = (new Date(app.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
//       return daysLeft <= 30;
//     });

//     res.json(expiringVisas);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ------------------ GET ACTIVITY HISTORY FOR A CLIENT (ADMIN) ------------------
// // @route   GET /api/admin/clients/:clientId/activity
// // @access  Private (Admin)
// export const getClientActivity = async (req, res) => {
//   try {
//     const client = await Client.findById(req.params.clientId).lean();
//     if (!client) {
//       return res.status(404).json({ message: "Client not found" });
//     }
//     const activity = client.activity || [];
//     res.status(200).json(activity);
//   } catch (error) {
//     console.error("Error fetching client activity:", error);
//     res.status(500).json({ message: error.message });
//   }
// };




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
    
    // Get assignedTo from authenticated user OR from request body as fallback
    const assignedTo = req.user?._id || req.body.assignedTo;

    if (!assignedTo) {
      console.error("[registerClient] No assignedTo found. req.user:", req.user, "req.body.assignedTo:", req.body.assignedTo);
      return res.status(400).json({ message: "Employee ID is required. Please log in again." });
    }

    console.log("[registerClient] Creating client with assignedTo:", assignedTo);

    const client = await Client.create({
      name,
      email,
      phone,
      unqualified,
      password,
      assignedTo,
    });

    console.log("[registerClient] Client created successfully:", client._id);
    res.status(201).json(client);
  } catch (error) {
    console.error("[registerClient] Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ------------------ CREATE VISA APPLICATION ------------------
// @route   POST /api/employee/applications
// @access  Private (Employee)
export const createApplication = async (req, res) => {
  try {
    const { clientId, visaType, visaDuration } = req.body;

    const application = await Application.create({
      client: clientId,
      visaType,
      visaDuration,
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
        resource_type: "auto",
      });

      return { field: fieldname, url: result.secure_url };
    });

    const uploadedDocs = await Promise.all(uploadPromises);

    const updateData = {};
    uploadedDocs.forEach((doc) => {
      updateData[`documents.${doc.field}`] = doc.url;
    });
    
    // If payment receipt was uploaded, mark invoice as paid and update status
    if (updateData['documents.paymentReceipt']) {
      console.log('[uploadDocuments] Payment receipt detected, marking invoice as paid');
      updateData['invoice.paid'] = true;
      updateData['applicationStatus'] = 'processing'; // or 'paid' if you want a separate status
    }

    console.log('[uploadDocuments] Update data:', updateData);

    const application = await Application.findByIdAndUpdate(
      applicationId,
      { $set: updateData },
      { new: true }
    ).populate('client');

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    console.log('[uploadDocuments] Application updated successfully:', {
      id: application._id,
      hasPaymentReceipt: !!application.documents?.paymentReceipt,
      invoicePaid: application.invoice?.paid
    });

    res.status(200).json({
      message: "Documents uploaded successfully",
      documents: application.documents,
      invoice: application.invoice,
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
    const { status } = req.body;

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
    const { status } = req.body;

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

    const secureLink = `${process.env.FRONTEND_URL}/visa-status/${client._id}`;

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

// ------------------ FETCH ALL CLIENTS & APPLICATIONS (ADMIN) ------------------
// @route   GET /api/admin/clients
// @access  Private (Admin)
export const getAllClientsAndApplications = async (req, res) => {
  try {
    const clients = await Client.find()
      .populate("assignedTo", "name email")
      .lean();

    const applications = await Application.find()
      .populate("client")
      .populate("processedBy", "name email")
      .lean();

    res.status(200).json({ clients, applications });
  } catch (error) {
    console.error("Error fetching clients & applications:", error);
    res.status(500).json({ message: error.message });
  }
};

// ------------------ GET SINGLE CLIENT DETAILS (ADMIN) ------------------
// @route   GET /api/admin/clients/:clientId
// @access  Private (Admin)
export const getClientDetails = async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId)
      .populate("assignedTo", "name email")
      .lean();

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json(client);
  } catch (error) {
    console.error("Error fetching client details:", error);
    res.status(500).json({ message: error.message });
  }
};

// ------------------ GET APPLICATIONS FOR A CLIENT (ADMIN) ------------------
// @route   GET /api/admin/clients/:clientId/applications
// @access  Private (Admin)
export const getClientApplications = async (req, res) => {
  try {
    const apps = await Application.find({ client: req.params.clientId })
      .populate("processedBy", "name email")
      .lean();
    res.status(200).json(apps);
  } catch (error) {
    console.error("Error fetching client applications:", error);
    res.status(500).json({ message: error.message });
  }
};

// ------------------ GET ALL APPLICATIONS (ADMIN) ------------------
// @route   GET /api/admin/applications
// @access  Private (Admin)
export const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("client")
      .populate("processedBy", "name email")
      .lean();
    res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching all applications:", error);
    res.status(500).json({ message: error.message });
  }
};

// ------------------ UPDATE APPLICATION STATUS (ADMIN) ------------------
// @route   PATCH /api/admin/applications/:id/status
// @access  Private (Admin)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }
    
    const app = await Application.findById(id);
    if (!app) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    app.applicationStatus = status;
    await app.save();
    
    res.json({ message: "Status updated", application: app });
  } catch (error) {
    console.error("[v0] updateApplicationStatus error:", error);
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

    const expiringVisas = applications.filter((app) => {
      const daysLeft = (new Date(app.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
      return daysLeft <= 30;
    });

    res.json(expiringVisas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------ GET ACTIVITY HISTORY FOR A CLIENT (ADMIN) ------------------
// @route   GET /api/admin/clients/:clientId/activity
// @access  Private (Admin)
export const getClientActivity = async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId).lean();
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    const activity = client.activity || [];
    res.status(200).json(activity);
  } catch (error) {
    console.error("Error fetching client activity:", error);
    res.status(500).json({ message: error.message });
  }
};