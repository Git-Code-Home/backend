// controllers/agentController.js
import User from "../models/User.js";
import Client from "../models/Client.js";
import Application from "../models/Application.js";
import Notification from "../models/Notification.js";
import jwt from "jsonwebtoken";

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// ✅ Agent login
export const loginAgent = async (req, res) => {
  try {
    const { email, password } = req.body;
    const agent = await User.findOne({ email, role: "agent" });

    if (agent && (await agent.matchPassword(password))) {
      res.json({
        _id: agent._id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
        token: generateToken(agent._id),
      });
    } else {
      res.status(401).json({ message: "Invalid agent credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Agent Profile
export const getAgentProfile = async (req, res) => {
  try {
    const agent = await User.findById(req.user._id);
    res.json(agent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update Agent Profile + Bank Info
export const updateAgentProfile = async (req, res) => {
  try {
    const agent = await User.findById(req.user._id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    agent.name = req.body.name || agent.name;
    agent.phone = req.body.phone || agent.phone;
    agent.bankInfo = req.body.bankInfo || agent.bankInfo;

    const updated = await agent.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get All Assigned Clients
export const getAssignedClients = async (req, res) => {
  try {
    // Option A: directly assigned on Client
    const clientsByFlag = await Client.find({ assignedAgent: req.user._id }).lean();

    // Option B: inferred via Applications
    const apps = await Application.find({ agent: req.user._id }).select("client").lean();
    const appClientIds = [...new Set(apps.map((a) => String(a.client)))];

    let clientsByApps = [];
    if (appClientIds.length > 0) {
      clientsByApps = await Client.find({ _id: { $in: appClientIds } }).lean();
    }

    // Merge unique clients
    const map = new Map();
    for (const c of [...clientsByFlag, ...clientsByApps]) {
      map.set(String(c._id), c);
    }
    res.json(Array.from(map.values()));
  } catch (error) {
    console.error("[getAssignedClients] error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get agent's own applications
export const getAgentApplications = async (req, res) => {
  try {
    const applications = await Application.find({ agent: req.user._id })
      .populate("client")
      .lean();
    res.json(applications);
  } catch (error) {
    console.error("[getAgentApplications] error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Create or Edit Visa Application
export const createOrUpdateApplication = async (req, res) => {
  try {
    const { clientId, visaType, status, issueDate, expiryDate, commissionAmount } = req.body

    // ✅ Uploaded files come from Cloudinary now
    const documents = {
      passport: req.files?.passport ? req.files.passport[0].path : undefined,
      photo: req.files?.photo ? req.files.photo[0].path : undefined,
      idCard: req.files?.idCard ? req.files.idCard[0].path : undefined,
      approvedVisa: req.files?.approvedVisa ? req.files.approvedVisa[0].path : undefined,
    }

    // Basic validation for approved visa file type/size (if uploaded)
    if (req.files?.approvedVisa && req.files.approvedVisa[0]) {
      const file = req.files.approvedVisa[0]
      const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg"]
      if (file.mimetype && !allowed.includes(file.mimetype)) {
        return res.status(400).json({ message: "Approved visa must be PDF or image" })
      }
      // If size available, enforce max 10MB
      if (file.size && file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "Approved visa exceeds 10MB size limit" })
      }
    }

    let application = await Application.findOne({ client: clientId, agent: req.user._id })

    if (application) {
      Object.assign(application, { visaType, documents, status, issueDate, expiryDate, commissionAmount })
      // If an approved visa was uploaded by the agent, update tracking fields
      if (documents.approvedVisa) {
        application.applicationStatus = "document_uploaded"
        application.approvedVisaUploadedAt = new Date()
      }
      await application.save()
    } else {
      application = await Application.create({
        client: clientId,
        agent: req.user._id,
        visaType,
        documents,
        status,
        issueDate,
        expiryDate,
        commissionAmount,
      })
      if (documents.approvedVisa) {
        application.applicationStatus = "document_uploaded"
        application.approvedVisaUploadedAt = new Date()
        await application.save()
      }
    }

    res.json({
      message: "Application uploaded successfully",
      application,
    })
  } catch (error) {
    console.error("Error in createOrUpdateApplication:", error)
    res.status(500).json({ message: error.message })
  }
}



// ✅ Commission Summary
export const getCommissionSummary = async (req, res) => {
  try {
    const applications = await Application.find({ agent: req.user._id });

    const total = applications.reduce((acc, app) => acc + (app.commissionAmount || 0), 0);
    res.json({ totalCommission: total, pending: total * 0.2, paid: total * 0.8 }); // demo calc
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ Get Notifications
export const getAgentNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single application by id (agent-only, must own application)
export const getAgentApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id).populate("client").lean();
    if (!application) return res.status(404).json({ message: "Application not found" });

    // ownership check: application.agent may be ObjectId or populated object
    const appAgentId = application.agent ? String(application.agent) : null;
    if (!appAgentId || String(req.user._id) !== String(appAgentId)) {
      return res.status(403).json({ message: "Not authorized to view this application" });
    }

    return res.json(application);
  } catch (error) {
    console.error("getAgentApplicationById error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Approve application (agent-only, ownership check)
export const approveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id).populate("client");
    if (!application) return res.status(404).json({ message: "Application not found" });

    if (String(application.agent) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to modify this application" });
    }

    application.applicationStatus = "approved";
    await application.save();
    const out = await Application.findById(id).populate("client").lean();
    res.json(out);
  } catch (error) {
    console.error("approveApplication error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Reject application (agent-only, ownership check)
export const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id).populate("client");
    if (!application) return res.status(404).json({ message: "Application not found" });

    if (String(application.agent) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to modify this application" });
    }

    application.applicationStatus = "rejected";
    await application.save();
    const out = await Application.findById(id).populate("client").lean();
    res.json(out);
  } catch (error) {
    console.error("rejectApplication error:", error);
    res.status(500).json({ message: error.message });
  }
};
