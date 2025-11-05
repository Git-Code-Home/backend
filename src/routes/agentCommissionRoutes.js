import express from "express";
import { protect, agentOnly } from "../middlewares/authMiddleware.js";
import { listAgentCommissions, getAgentSummary } from "../controllers/agentCommissionController.js";

const router = express.Router();

// List commissions for logged-in agent
router.get("/", protect, agentOnly, listAgentCommissions);

// Summary: totals for agent
router.get("/summary", protect, agentOnly, getAgentSummary);

export default router;