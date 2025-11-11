import express from "express";
import clientController, { /* loginClient */ } from "../controllers/clientController.js";
import { protectClient } from "../middlewares/clientAuth.js";
import { upload } from "../controllers/EmployeeDashboard.js";

// NOTE: clientController exports loginClient (named export). Import below for route registration.
import { loginClient } from "../controllers/clientController.js";

const router = express.Router();

// Client creates application (protected)
router.post("/applications", protectClient, clientController.createClientApplication);

// Client lists own applications
router.get("/applications", protectClient, clientController.listClientApplications);

// Public client login to obtain JWT
router.post("/login", loginClient);

// Client uploads documents for their application
router.post(
  "/applications/:id/upload",
  protectClient,
  // Accept any file field names so dynamic templates' requiredDocs are supported.
  // We still limit to memory storage which the EmployeeDashboard upload helper uses.
  upload.any(),
  clientController.uploadClientDocuments
);

// single document upload for clients (no full required-docs validation)
// single-document upload route removed; clients should continue to use /applications/:id/upload for full uploads

export default router;
