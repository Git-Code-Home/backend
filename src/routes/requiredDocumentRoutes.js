const express = require("express")
const {
  submitApplication,
  getAllApplications,
  getApplicationById,
  getMyApplications,
  updateApplicationStatus,
  deleteApplication,
} = require("../controllers/requiredDocumentController")
const clientAuth = require("../middlewares/clientAuth")

const router = express.Router()

// Client routes
router.post("/", clientAuth, submitApplication)
router.get("/my-applications", clientAuth, getMyApplications)

// Admin routes
router.get("/", getAllApplications)
router.get("/:id", getApplicationById)
router.put("/:id/status", updateApplicationStatus)
router.delete("/:id", deleteApplication)

module.exports = router
