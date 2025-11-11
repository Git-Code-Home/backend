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
import User from "../models/User.js";
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
    const { clientId, visaType, visaDuration, country, formData } = req.body;

    if (!clientId) return res.status(400).json({ message: "clientId is required" });
    if (!visaType) return res.status(400).json({ message: "visaType is required" });

    // Server-side validation against FormTemplate when formData provided
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
      client: clientId,
      visaType,
      visaDuration,
      country: country || "dubai",
      formData: formData || {},
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

    // Validate requiredDocs based on the application's country template
    try {
      const FormTemplate = (await import("../models/FormTemplate.js")).default;
      const Country = (await import("../models/Country.js")).default;
      const application = await Application.findById(applicationId).lean();
      if (application) {
        // Resolve template using country record mapping (supports Schengen members)
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
      }
    } catch (err) {
      console.warn("Required docs validation skipped (could not load template):", err && err.message ? err.message : err);
    }

    const uploadPromises = Object.keys(filesByField).map(async (fieldname) => {
      const file = filesByField[fieldname][0];
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
      updateData['invoice.paid'] = true;
      updateData['applicationStatus'] = 'processing'; // or 'paid' if you want a separate status
    }

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
      documents: application.documents,
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
    // Support optional server-side filtering by agentId
    const { agentId } = req.query || {};

    const clientFilter = {};
    if (agentId) {
      // clients may reference agent via assignedAgent or assignedTo
      clientFilter.$or = [{ assignedAgent: agentId }, { assignedTo: agentId }];
    }

    const clients = await Client.find(clientFilter)
      .populate("assignedTo", "name email")
      .lean();

    // If agentId was provided, narrow applications to those belonging to the matched clients
    const applicationsFilter = {};
    if (agentId && Array.isArray(clients) && clients.length > 0) {
      const clientIds = clients.map((c) => c._id);
      applicationsFilter.client = { $in: clientIds };
    }

    const applications = await Application.find(applicationsFilter)
      .populate("client")
      .populate("processedBy", "name email")
      .lean();

    // If agentId was provided, return only the clients array for easier client-side consumption
    if (agentId) {
      return res.status(200).json(clients);
    }

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
    // Allow filtering by clientId and status via query params
    const { clientId, status } = req.query || {};
    const filter = {};
    if (clientId) filter.client = clientId;
    if (status) filter.applicationStatus = status;

    const applications = await Application.find(filter)
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

// ------------------ REASSIGN CLIENT (ADMIN) ------------------
// @route   PUT /api/admin/clients/:clientId/reassign
// @access  Private (Admin)
// Body: { employeeId?: string, agentId?: string }
export const reassignClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    let { employeeId, agentId } = req.body || {};

    // Normalize empty strings/nulls
    if (employeeId === "" || employeeId === null) employeeId = undefined;
    if (agentId === "" || agentId === null) agentId = undefined;

    if (!employeeId && !agentId) {
      return res.status(400).json({ message: "Provide employeeId or agentId to reassign" });
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // If assigning to an employee, validate and update client.assignedTo
    if (employeeId) {
      const employee = await User.findOne({ _id: employeeId, role: "employee" });
      if (!employee) {
        return res.status(400).json({ message: "Invalid employeeId" });
      }
      client.assignedTo = employee._id;
    }

    // If assigning to an agent, validate and update related applications
    if (agentId) {
      const agent = await User.findOne({ _id: agentId, role: "agent" });
      if (!agent) {
        return res.status(400).json({ message: "Invalid agentId" });
      }

      // Assign all applications for this client to the agent
      await Application.updateMany(
        { client: client._id },
        { $set: { agent: agent._id, processedBy: null } }
      );
    }

    await client.save();

    // Return the updated client with minimal info
    const updated = await Client.findById(client._id)
      .populate("assignedTo", "name email role")
      .lean();

    return res.json({ message: "Client reassigned successfully", client: updated });
  } catch (error) {
    console.error("[reassignClient] error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ------------------ REPORTS SUMMARY (ADMIN) ------------------
// @route   GET /api/admin/reports/summary?range=daily|weekly|last-30-days|last-3-months|last-6-months|last-year
// @access  Private (Admin)
export const getReportsSummary = async (req, res) => {
  try {
    const { range = "last-6-months" } = req.query;

    const now = new Date();
    const start = new Date(now);
    switch (range) {
      case "daily":
        start.setDate(now.getDate() - 1); // last 24 hours
        break;
      case "weekly":
        start.setDate(now.getDate() - 7);
        break;
      case "last-30-days":
        start.setDate(now.getDate() - 30);
        break;
      case "last-3-months":
        start.setMonth(now.getMonth() - 3);
        break;
      case "last-6-months":
        start.setMonth(now.getMonth() - 6);
        break;
      case "last-year":
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setMonth(now.getMonth() - 6);
        break;
    }

    // Filter applications within range
    const match = { createdAt: { $gte: start } };

    const totalApplications = await Application.countDocuments(match);
    const approvedCount = await Application.countDocuments({ ...match, applicationStatus: "approved" });
    const rejectedCount = await Application.countDocuments({ ...match, applicationStatus: "rejected" });

    // Sum revenue from paid invoices
    const revenueAgg = await Application.aggregate([
      { $match: match },
      { $match: { "invoice.paid": true } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$invoice.amount", 0] } } } },
    ]);
    const revenue = revenueAgg[0]?.total || 0;

    // Average processing time (days) for approved apps using issueDate if present, fallback to updatedAt
    const procAgg = await Application.aggregate([
      { $match: { ...match, applicationStatus: "approved" } },
      {
        $project: {
          start: "$createdAt",
          end: { $ifNull: ["$issueDate", "$updatedAt"] },
        },
      },
      {
        $project: {
          diffDays: { $divide: [{ $subtract: ["$end", "$start"] }, 1000 * 60 * 60 * 24] },
        },
      },
      { $group: { _id: null, avg: { $avg: "$diffDays" } } },
    ]);
    const avgProcessingDays = Number((procAgg[0]?.avg || 0).toFixed(1));

    const approvalRate = totalApplications > 0 ? Number(((approvedCount / totalApplications) * 100).toFixed(1)) : 0;

    return res.json({
      range,
      startDate: start,
      endDate: now,
      totals: {
        totalApplications,
        approved: approvedCount,
        rejected: rejectedCount,
        approvalRate,
        avgProcessingDays,
        revenue,
      },
    });
  } catch (error) {
    console.error("[getReportsSummary] error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ------------------ ASSIGN CLIENT TO AGENT (EMPLOYEE) ------------------
// @route   POST /api/employee/assign-client
// @access  Private (Employee)
// Body: { clientId: string, agentId: string }
export const assignClientToAgent = async (req, res) => {
  try {
    const { clientId, agentId } = req.body || {};

    if (!clientId || !agentId) {
      return res.status(400).json({ message: "clientId and agentId are required" });
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Ensure the current employee is assigned to this client
    if (String(client.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ message: "You are not assigned to this client" });
    }

    // Validate agent exists and has correct role
    const agent = await User.findOne({ _id: agentId, role: "agent" });
    if (!agent) {
      return res.status(400).json({ message: "Invalid agentId" });
    }

    // Persist assignment on Client so agent can see the client list even without applications
    client.assignedAgent = agent._id;
    await client.save();

    // Assign all applications for this client to the agent and clear processedBy
    const upd = await Application.updateMany(
      { client: client._id },
      { $set: { agent: agent._id, processedBy: null } }
    );

    return res.json({
      message: "Client applications assigned to agent",
      updatedApplications: upd?.modifiedCount ?? 0,
    });
  } catch (error) {
    console.error("[assignClientToAgent] error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ------------------ UPLOAD A SINGLE DOCUMENT (no full-template validation)
// @route   POST /api/employee/applications/:id/upload-document
// @access  Private (Employee)
export const uploadSingleDocument = async (req, res) => {
  try {
    const applicationId = req.params.id;

    // Expect a single file field and a body.fieldName indicating which document to update
    const fieldName = req.body.fieldName || req.body.name || req.query.fieldName;
    if (!fieldName) {
      return res.status(400).json({ message: "fieldName is required in body (e.g. 'paymentReceipt')" });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded. Use form field name 'file' for the uploaded file." });
    }

    // Upload to Cloudinary (support both memory buffer and already-uploaded path)
    let fileUrl = null;
    if (file.buffer) {
      const b64 = Buffer.from(file.buffer).toString("base64");
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "visa_docs",
        resource_type: "auto",
      });
      fileUrl = result.secure_url;
    } else if (file.path || file.location) {
      // multer-storage-cloudinary or other storage engines may provide a path/location
      fileUrl = file.path || file.location;
    }

    if (!fileUrl) {
      return res.status(500).json({ message: "Could not obtain uploaded file URL" });
    }

    const updateData = {};
    updateData[`documents.${fieldName}`] = fileUrl;

    // Update application document field only. Do NOT run full requiredDocs validation here.
    const application = await Application.findByIdAndUpdate(
      applicationId,
      { $set: updateData },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    return res.status(200).json({ message: "Document uploaded", documents: application.documents });
  } catch (error) {
    console.error("uploadSingleDocument error:", error);
    return res.status(500).json({ message: error.message });
  }
};