// routes/agentRoutes.js
import express from "express";
import {
  loginAgent,
  getAgentProfile,
  updateAgentProfile,
  getAssignedClients,
  createOrUpdateApplication,
  getCommissionSummary,
  withdrawCommission,
  getAgentNotifications,
} from "../controllers/agentController.js";
import { protect, agentOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/login", loginAgent);
router.get("/profile", protect, agentOnly, getAgentProfile);
router.put("/profile", protect, agentOnly, updateAgentProfile);
router.get("/clients", protect, agentOnly, getAssignedClients);
router.post("/application", protect, agentOnly, createOrUpdateApplication);
router.get("/commission", protect, agentOnly, getCommissionSummary);
router.post("/withdraw", protect, agentOnly, withdrawCommission);
router.get("/notifications", protect, agentOnly, getAgentNotifications);

export default router;
