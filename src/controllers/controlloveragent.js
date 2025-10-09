// controllers/agentController.js
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// ------------------ ADD NEW AGENT ------------------
// @route   POST /api/agents
// @access  Private (Admin or Employee)
export const addAgent = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if agent already exists
    const existingAgent = await User.findOne({ email, role: "agent" });
    if (existingAgent)
      return res.status(400).json({ message: "Agent already exists" });

    const agent = await User.create({
      name,
      email,
      password,
      role: "agent",
    });

    res.status(201).json({
      message: "Agent created successfully",
      agent: {
        _id: agent._id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------ GET ALL AGENTS ------------------
// @route   GET /api/agents
// @access  Private (Admin or Employee)
export const getAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: "agent" }).select("-password");
    res.status(200).json(agents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------ UPDATE AGENT ------------------
// @route   PUT /api/agent/:id
// @access  Private (Admin or Employee)
export const updateAgent = async (req, res) => {
  try {
    const { name, email, password, phone, commissionRate, bankInfo } = req.body;

    const agent = await User.findById(req.params.id);

    if (!agent || agent.role !== "agent") {
      return res.status(404).json({ message: "Agent not found" });
    }

    if (name) agent.name = name;
    if (email) agent.email = email;
    if (password) agent.password = password; 
    if (phone) agent.phone = phone;
    if (commissionRate !== undefined) agent.commissionRate = commissionRate;
    if (bankInfo) agent.bankInfo = { ...agent.bankInfo, ...bankInfo };

    await agent.save();

    res.json({
      message: "Agent updated successfully",
      agent: {
        _id: agent._id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        commissionRate: agent.commissionRate,
        bankInfo: agent.bankInfo,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------ BLOCK / UNBLOCK AGENT ------------------
// @route   PUT /api/agents/:id/block
// @access  Private (Admin or Employee)
export const toggleBlockAgent = async (req, res) => {
  try {
    const agent = await User.findById(req.params.id);

    if (!agent || agent.role !== "agent") {
      return res.status(404).json({ message: "Agent not found" });
    }

    agent.isBlocked = !agent.isBlocked;
    await agent.save();

    res.json({
      message: `Agent ${agent.isBlocked ? "blocked" : "unblocked"} successfully`,
      agent: { _id: agent._id, isBlocked: agent.isBlocked },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------ DELETE AGENT ------------------
// @route   DELETE /api/agents/:id
// @access  Private (Admin)
export const deleteAgent = async (req, res) => {
  try {
    const agent = await User.findById(req.params.id);

    if (!agent || agent.role !== "agent")
      return res.status(404).json({ message: "Agent not found" });

    await agent.deleteOne();
    res.json({ message: "Agent deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
