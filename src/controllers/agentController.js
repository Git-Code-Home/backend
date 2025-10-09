// controllers/agentController.js
import User from "../models/User.js";
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
    const clients = await User.find({ assignedTo: req.user._id, role: "client" });
    res.json(clients);
  } catch (error) {
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
    }

    let application = await Application.findOne({ client: clientId, agent: req.user._id })

    if (application) {
      Object.assign(application, { visaType, documents, status, issueDate, expiryDate, commissionAmount })
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

// ✅ Withdraw Request
export const withdrawCommission = async (req, res) => {
  try {
    const agent = await User.findById(req.user._id);
    if (agent.pendingCommission <= 0) return res.status(400).json({ message: "No pending commission" });

    // In real app: add payout logic
    agent.paidCommission += agent.pendingCommission;
    agent.pendingCommission = 0;
    await agent.save();

    res.json({ message: "Withdraw successful" });
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
