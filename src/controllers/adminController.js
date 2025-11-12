import mongoose from "mongoose";
import Client from "../models/Client.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import Application from "../models/Application.js";

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// Admin login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const admin = await User.findOne({ email, role: "admin" });
    const isMatch = admin ? await admin.matchPassword(password) : false;

    if (admin && isMatch) {
      return res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token: generateToken(admin._id),
      });
    }

    return res.status(401).json({ message: "Invalid admin credentials" });
  } catch (error) {
    console.error("loginAdmin error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getAdminProfile = async (req, res) => {
  res.json(req.user);
};

// Update application status (keeps existing behavior)
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
    console.error("updateApplicationStatus error:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/overview
// Returns aggregated dashboard metrics
export const getOverview = async (req, res) => {
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // total clients
    const totalClients = await Client.countDocuments();

    // active applications: treat 'processing', 'under_review', 'submitted' as active
    const activeStatuses = ["processing", "under_review", "submitted"];
    const activeApplications = await Application.countDocuments({ applicationStatus: { $in: activeStatuses } });

    // expiring visas within next 30 days (inclusive)
    const expiringVisas = await Application.countDocuments({
      expiryDate: { $gte: now, $lte: in30Days },
    });

    // revenue: sum of invoice.amount for paid invoices
    const revenueAgg = await Application.aggregate([
      { $match: { "invoice.paid": true, "invoice.amount": { $exists: true } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$invoice.amount", 0] } } } },
    ]);
    const revenue = (revenueAgg[0] && revenueAgg[0].total) || 0;

    return res.status(200).json({ totalClients, activeApplications, expiringVisas, revenue });
  } catch (error) {
    console.error("getOverview error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/clients?agentId=
// Return clients with basic info + totalApplications count. If agentId provided, filter by assignedAgent/assignedTo
export const getClients = async (req, res) => {
  try {
    const { agentId } = req.query || {};
    const match = {};
    if (agentId) {
      // match assignedAgent OR assignedTo
      match.$or = [{ assignedAgent: mongoose.Types.ObjectId(agentId) }, { assignedTo: mongoose.Types.ObjectId(agentId) }];
    }

    // Aggregation to include totalApplications and basic assignedTo/assignedAgent info
    const clientsAgg = await Client.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedTo",
        },
      },
      { $unwind: { path: "$assignedTo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "assignedAgent",
          foreignField: "_id",
          as: "assignedAgent",
        },
      },
      { $unwind: { path: "$assignedAgent", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "applications",
          localField: "_id",
          foreignField: "client",
          as: "applications",
        },
      },
      {
        $addFields: {
          totalApplications: { $size: { $ifNull: ["$applications", []] } },
        },
      },
      // Keep only clients that have at least one application so admin sees only active clients
      { $match: { totalApplications: { $gt: 0 } } },
      {
        $project: {
          password: 0,
          applications: 0,
          __v: 0,
          "assignedTo.password": 0,
          "assignedAgent.password": 0,
        },
      },
    ]);

    // Fetch applications for the returned clients so the frontend receives both lists
    const clientIds = clientsAgg.map((c) => c._id);
    const applications = await Application.find({ client: { $in: clientIds } })
      .populate("client")
      .populate("processedBy", "name email")
      .lean();

    return res.status(200).json({ clients: clientsAgg || [], applications: applications || [] });
  } catch (error) {
    console.error("getClients error:", error);
    return res.status(500).json({ message: error.message });
  }
};