import express from "express"
import {
  submitApplication,
  getAllApplications,
  getApplicationById,
  getMyApplications,
  updateApplicationStatus,
  deleteApplication,
} from "../controllers/requiredDocumentController.js"
import { protectClient } from "../middlewares/clientAuth.js"

const router = express.Router()

// Client routes
router.post("/", protectClient, submitApplication)
router.get("/my-applications", protectClient, getMyApplications)

// Admin routes
router.get("/", getAllApplications)
router.get("/:id", getApplicationById)
router.put("/:id/status", updateApplicationStatus)
router.delete("/:id", deleteApplication)

export default router
