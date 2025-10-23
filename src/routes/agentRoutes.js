import express from "express"
import {
  loginAgent,
  getAgentProfile,
  updateAgentProfile,
  getAssignedClients,
  getAgentApplications,
  createOrUpdateApplication,
  getCommissionSummary,
  withdrawCommission,
  getAgentNotifications,
} from "../controllers/agentController.js"
import { protect, agentOnly } from "../middlewares/authMiddleware.js"
import { upload } from "../middlewares/uploadMiddleware.js"

const router = express.Router()

router.post("/login", loginAgent)
router.get("/profile", protect, agentOnly, getAgentProfile)
router.put("/profile", protect, agentOnly, updateAgentProfile)
router.get("/clients", protect, agentOnly, getAssignedClients)
router.get("/applications", protect, agentOnly, getAgentApplications)

// ✅ Cloudinary upload for application documents
router.post(
  "/application",
  protect,
  agentOnly,
  upload.fields([
    { name: "passport", maxCount: 1 },
    { name: "photo", maxCount: 1 },
    { name: "idCard", maxCount: 1 },
  ]),
  createOrUpdateApplication
)

router.get("/commission", protect, agentOnly, getCommissionSummary)
router.post("/withdraw", protect, agentOnly, withdrawCommission)
router.get("/notifications", protect, agentOnly, getAgentNotifications)

export default router
