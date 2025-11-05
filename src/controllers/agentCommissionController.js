import AgentCommission from "../models/AgentCommission.js";
import Application from "../models/Application.js";
import Client from "../models/Client.js";
import User from "../models/User.js";

// Create commission (admin only)
export const createCommission = async (req, res) => {
  try {
    const { agent_id, client_id, application_id, commission_amount } = req.body;

    if (!agent_id || !client_id || !application_id || !commission_amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [agent, client, application] = await Promise.all([
      User.findById(agent_id),
      Client.findById(client_id),
      Application.findById(application_id),
    ]);

    if (!agent || agent.role !== "agent") return res.status(400).json({ message: "Agent not found" });
    if (!client) return res.status(400).json({ message: "Client not found" });
    if (!application) return res.status(400).json({ message: "Application not found" });

    // Only for approved applications
    if (application.applicationStatus !== "approved") {
      return res.status(400).json({ message: "Commission can only be created for approved applications" });
    }

    // Ensure the application belongs to the selected client
    if (String(application.client) !== String(client._id)) {
      return res.status(400).json({ message: "Application does not belong to the selected client" });
    }

    // Ensure the client is assigned to the agent (either assignedAgent or application's agent)
    const clientAssignedAgent = client.assignedAgent ? String(client.assignedAgent) : null;
    const applicationAgent = application.agent ? String(application.agent) : null;
    if (clientAssignedAgent && clientAssignedAgent !== String(agent._id) && applicationAgent !== String(agent._id)) {
      return res.status(400).json({ message: "Client is not assigned to the chosen agent" });
    }

    // Handle receipt upload (upload middleware will populate req.file and cloudinary will return a path)
    let receiptUrl = "";
    if (req.file && req.file.path) {
      // multer-storage-cloudinary stores URL in req.file.path
      receiptUrl = req.file.path;
    }

    const commission = await AgentCommission.create({
      agent: agent._id,
      client: client._id,
      application: application._id,
      commission_amount,
      receipt_url: receiptUrl,
      status: receiptUrl ? "paid" : "pending",
      paid_date: receiptUrl ? new Date() : null,
    });

    const populated = await commission.populate("agent client application");
    // map to friendly shape expected by frontend
    const out = {
      _id: populated._id,
      agent: populated.agent,
      client: populated.client,
      application: populated.application,
      amount: populated.commission_amount,
      status: populated.status,
      paymentProof: populated.receipt_url,
      paid_date: populated.paid_date,
      createdAt: populated.createdAt,
      updatedAt: populated.updatedAt,
    };
    res.status(201).json(out);
  } catch (error) {
    console.error("createCommission error:", error);
    res.status(500).json({ message: error.message });
  }
};

// List commissions (admin) with filters and search
export const listCommissions = async (req, res) => {
  try {
    const { agent, client, status, from, to, search } = req.query;
    const filter = {};
    if (agent) filter.agent = agent;
    if (client) filter.client = client;
    if (status) filter.status = status;
    if (from || to) filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);

    // Basic search by client name or application id
    let commissions = await AgentCommission.find(filter)
      .populate("agent", "name email")
      .populate("client", "name email")
      .populate("application", "visaType applicationStatus")
      .sort({ createdAt: -1 });

    if (search) {
      const q = String(search).toLowerCase();
      commissions = commissions.filter((c) => {
        const clientName = c.client?.name?.toLowerCase() || "";
        const appId = c.application?._id ? String(c.application._id) : "";
        return clientName.includes(q) || appId.includes(q);
      });
    }

    // map to frontend-friendly shape
    const out = commissions.map((c) => ({
      _id: c._id,
      agent: c.agent,
      client: c.client,
      application: c.application,
      amount: c.commission_amount,
      status: c.status,
      paymentProof: c.receipt_url,
      paid_date: c.paid_date,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
    res.json(out);
  } catch (error) {
    console.error("listCommissions error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get single commission
export const getCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const commission = await AgentCommission.findById(id)
      .populate("agent", "name email")
      .populate("client", "name email")
      .populate("application");
    if (!commission) return res.status(404).json({ message: "Commission not found" });
    const c = commission;
    res.json({
      _id: c._id,
      agent: c.agent,
      client: c.client,
      application: c.application,
      amount: c.commission_amount,
      status: c.status,
      paymentProof: c.receipt_url,
      paid_date: c.paid_date,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    });
  } catch (error) {
    console.error("getCommission error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update commission (admin only)
export const updateCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const { commission_amount, status } = req.body;
    const commission = await AgentCommission.findById(id);
    if (!commission) return res.status(404).json({ message: "Commission not found" });

    if (commission_amount !== undefined) commission.commission_amount = commission_amount;
    if (status && ["pending", "paid"].includes(status)) {
      commission.status = status;
      commission.paid_date = status === "paid" ? new Date() : null;
    }
    await commission.save();
    const populated = await commission.populate("agent client application");
    const c = populated;
    res.json({
      _id: c._id,
      agent: c.agent,
      client: c.client,
      application: c.application,
      amount: c.commission_amount,
      status: c.status,
      paymentProof: c.receipt_url,
      paid_date: c.paid_date,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    });
  } catch (error) {
    console.error("updateCommission error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete commission (admin only)
export const deleteCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const commission = await AgentCommission.findById(id);
    if (!commission) return res.status(404).json({ message: "Commission not found" });
    await commission.remove();
    res.json({ message: "Commission deleted" });
  } catch (error) {
    console.error("deleteCommission error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Upload receipt and mark paid
export const uploadReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const commission = await AgentCommission.findById(id);
    if (!commission) return res.status(404).json({ message: "Commission not found" });

    if (req.file && req.file.path) {
      commission.receipt_url = req.file.path;
      commission.status = "paid";
      commission.paid_date = new Date();
      await commission.save();
    }

    const populated = await commission.populate("agent client application");
    const c = populated;
    res.json({
      _id: c._id,
      agent: c.agent,
      client: c.client,
      application: c.application,
      amount: c.commission_amount,
      status: c.status,
      paymentProof: c.receipt_url,
      paid_date: c.paid_date,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    });
  } catch (error) {
    console.error("uploadReceipt error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Agent-specific: list own commissions and summary
export const listAgentCommissions = async (req, res) => {
  try {
    const agentId = req.user._id;
    const commissions = await AgentCommission.find({ agent: agentId })
      .populate("client", "name email")
      .populate("application")
      .sort({ createdAt: -1 });

    const out = commissions.map((c) => ({
      _id: c._id,
      client: c.client,
      application: c.application,
      amount: c.commission_amount,
      status: c.status,
      paymentProof: c.receipt_url,
      paid_date: c.paid_date,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
    res.json(out);
  } catch (error) {
    console.error("listAgentCommissions error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAgentSummary = async (req, res) => {
  try {
    const agentId = req.user._id;
    const commissions = await AgentCommission.find({ agent: agentId });

    const total = commissions.reduce((s, c) => s + (c.commission_amount || 0), 0);
    const paid = commissions.filter((c) => c.status === "paid").reduce((s, c) => s + (c.commission_amount || 0), 0);
    const pending = total - paid;

    res.json({ total, paid, pending, count: commissions.length });
  } catch (error) {
    console.error("getAgentSummary error:", error);
    res.status(500).json({ message: error.message });
  }
};
