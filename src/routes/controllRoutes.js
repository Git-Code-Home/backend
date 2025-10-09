// routes/agentRoutes.js
import express from "express";
import {
  addAgent,
  getAgents,
  toggleBlockAgent,
  deleteAgent,
  updateAgent
} from "../controllers/controlloveragent.js";
import { protect, adminOrEmployeeOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .post(protect, adminOrEmployeeOnly, addAgent)
  .get(protect, adminOrEmployeeOnly, getAgents);

router
  .route("/:id/block")
  .put(protect, adminOrEmployeeOnly, toggleBlockAgent);

router
  .route("/:id")
  .put(protect, adminOrEmployeeOnly, updateAgent)
  .delete(protect, adminOrEmployeeOnly, deleteAgent);

export default router;
