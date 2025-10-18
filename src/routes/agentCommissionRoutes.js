import express from "express";
import Commission from "../models/Commission.js";
import { protect, agentOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get all commissions for the logged-in agent
router.get("/", protect, agentOnly, async (req, res) => {
  try {
    const commissions = await Commission.find({ agent: req.user._id })
      .populate("client", "name email")
      .sort({ createdAt: -1 });
    res.json(commissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Request withdrawal for a commission (optional, if you want this feature)
router.post("/:id/withdraw", protect, agentOnly, async (req, res) => {
  try {
    const commission = await Commission.findOne({ _id: req.params.id, agent: req.user._id });
    if (!commission) return res.status(404).json({ error: "Commission not found" });
    if (commission.status !== "paid") {
      commission.status = "withdrawal_requested";
      await commission.save();
      return res.json({ message: "Withdrawal requested", commission });
    } else {
      return res.status(400).json({ error: "Commission already paid" });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;