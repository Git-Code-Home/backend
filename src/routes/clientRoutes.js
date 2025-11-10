import express from "express";
import clientController from "../controllers/clientController.js";
import { protectClient } from "../middlewares/clientAuth.js";
import { upload } from "../controllers/EmployeeDashboard.js";

const router = express.Router();

// Client creates application (protected)
router.post("/applications", protectClient, clientController.createClientApplication);

// Client uploads documents for their application
router.post(
  "/applications/:id/upload",
  protectClient,
  // Accept any file field names so dynamic templates' requiredDocs are supported.
  // We still limit to memory storage which the EmployeeDashboard upload helper uses.
  upload.any(),
  clientController.uploadClientDocuments
);

export default router;
