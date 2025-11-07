import Client from "../models/Client.js";

// GET /api/admin/clients?agentId=
// Return clients assigned to the given agentId. If agentId is absent, return all clients.
export const getClientsByAgent = async (req, res) => {
  try {
    const { agentId } = req.query || {};

    if (!agentId) {
      const clients = await Client.find()
        .populate("assignedAgent", "name email")
        .populate("assignedTo", "name email")
        .lean();
      return res.status(200).json(clients);
    }

    // Find clients where assignedAgent or assignedTo equals agentId
    const clients = await Client.find({
      $or: [{ assignedAgent: agentId }, { assignedTo: agentId }],
    })
      .populate("assignedAgent", "name email")
      .populate("assignedTo", "name email")
      .lean();

    // Always return 200 with an array (possibly empty)
    return res.status(200).json(clients);
  } catch (error) {
    console.error("getClientsByAgent error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export default { getClientsByAgent };
import User from "../models/User.js"
import jwt from "jsonwebtoken"
import Application from "../models/Application.js";

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" })

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body || {}
    console.log("[v0] Incoming payload:", { email, pwLen: password ? password.length : 0 })

    const admin = await User.findOne({ email, role: "admin" })
    console.log("[v0] Found admin:", !!admin)

    const isMatch = admin ? await admin.matchPassword(password) : false
    console.log("[v0] Password compare result:", isMatch)

    if (admin && isMatch) {
      res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token: generateToken(admin._id),
      })
    } else {
      console.log("[v0] Invalid credentials attempt:", email)
      res.status(401).json({ message: "Invalid admin credentials" })
    }
  } catch (error) {
    console.error("[v0] Login admin error:", error)
    res.status(500).json({ message: error.message })
  }
}

export const getAdminProfile = async (req, res) => {
  res.json(req.user)
}
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