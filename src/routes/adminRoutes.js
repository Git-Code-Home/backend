// import express from "express";
// import { loginAdmin, getAdminProfile } from "../controllers/adminController.js";
// import { protect, adminOnly } from "../middlewares/authMiddleware.js";
// import { addEmployee, deleteEmployee, editEmployee, getEmployees } from "../controllers/employeeController.js";
// import { getAllClientsAndApplications } from "../controllers/EmployeeDashboard.js";

// const router = express.Router();

// router.post("/login", loginAdmin);
// router.get("/profile", protect, adminOnly, getAdminProfile);
// router.post("/add-employee", protect, adminOnly, addEmployee);
// router.get("/employees", protect, adminOnly, getEmployees);
// router.put("/edit-employee/:id" , protect , adminOnly , editEmployee)
// router.delete('/delete-employee/:id' , protect , adminOnly ,  deleteEmployee)
// router.get("/public/data", getAllClientsAndApplications);



// export default router;


// In src/routes/adminRoutes.js

// import express from "express";
// import { loginAdmin, getAdminProfile } from "../controllers/adminController.js";
// import { protect, adminOnly } from "../middlewares/authMiddleware.js";
// import { addEmployee, deleteEmployee, editEmployee, getEmployees } from "../controllers/employeeController.js";
// import { getAllClientsAndApplications } from "../controllers/EmployeeDashboard.js";

// const router = express.Router();

// router.post("/login", loginAdmin);
// router.get("/profile", protect, adminOnly, getAdminProfile);
// router.post("/add-employee", protect, adminOnly, addEmployee);
// router.get("/employees", protect, adminOnly, getEmployees);
// router.put("/edit-employee/:id" , protect , adminOnly , editEmployee)
// router.delete('/delete-employee/:id' , protect , adminOnly , deleteEmployee)

// // FIX: Added the 'protect' and 'adminOnly' middleware to this route.
// // This ensures that only authenticated and authorized admins can access this data.
// router.get("/public/data", protect, adminOnly, getAllClientsAndApplications);

// export default router;





// import express from "express";
// import multer from "multer";
// import { uploadReceipt, getReceipts, verifyReceipt } from "../controllers/paymentController.js";

// const router = express.Router();

// // multer setup for uploads (store locally or to Cloudinary)
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/receipts");
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });
// const upload = multer({ storage });

// // upload receipt
// router.post("/upload-receipt", upload.single("receipt"), uploadReceipt);

// // get all receipts (admin view)
// router.get("/", getReceipts);

// // verify (admin action)
// router.patch("/verify/:id", verifyReceipt);

// export default router;


// import express from "express";
// import { loginAdmin, getAdminProfile } from "../controllers/adminController.js";
// import { protect, adminOnly } from "../middlewares/authMiddleware.js";
// import { addEmployee, deleteEmployee, editEmployee, getEmployees } from "../controllers/employeeController.js";
// import { getAllClientsAndApplications } from "../controllers/EmployeeDashboard.js";

// const router = express.Router();

// router.post("/login", loginAdmin);
// router.get("/profile", protect, adminOnly, getAdminProfile);
// router.post("/add-employee", protect, adminOnly, addEmployee);
// router.get("/employees", protect, adminOnly, getEmployees);
// router.put("/edit-employee/:id", protect, adminOnly, editEmployee);
// router.delete('/delete-employee/:id', protect, adminOnly, deleteEmployee);

// // Route for fetching all clients and applications
// router.get("/clients", protect, adminOnly, getAllClientsAndApplications);

// export default router;



// import express from "express";
// import { loginAdmin, getAdminProfile } from "../controllers/adminController.js";
// import { protect, adminOnly } from "../middlewares/authMiddleware.js";
// import { addEmployee, deleteEmployee, editEmployee, getEmployees } from "../controllers/employeeController.js";
// import { getAllClientsAndApplications, getClientDetails } from "../controllers/EmployeeDashboard.js";

// const router = express.Router();

// router.post("/login", loginAdmin);
// router.get("/profile", protect, adminOnly, getAdminProfile);
// router.post("/add-employee", protect, adminOnly, addEmployee);
// router.get("/employees", protect, adminOnly, getEmployees);
// router.put("/edit-employee/:id", protect, adminOnly, editEmployee);
// router.delete('/delete-employee/:id', protect, adminOnly, deleteEmployee);

// // Route for fetching all clients and applications
// router.get("/clients", protect, adminOnly, getAllClientsAndApplications);

// // Route for fetching a single client's details
// router.get("/clients/:clientId", protect, adminOnly, getClientDetails);

// export default router;


// import express from "express";
// import { loginAdmin, getAdminProfile } from "../controllers/adminController.js";
// import { protect, adminOnly } from "../middlewares/authMiddleware.js";
// import { addEmployee, deleteEmployee, editEmployee, getEmployees } from "../controllers/employeeController.js";
// import { getAllClientsAndApplications, getClientDetails } from "../controllers/EmployeeDashboard.js";

// const router = express.Router();

// router.post("/login", loginAdmin);
// router.get("/profile", protect, adminOnly, getAdminProfile);
// router.post("/add-employee", protect, adminOnly, addEmployee);
// router.get("/employees", protect, adminOnly, getEmployees);
// router.put("/edit-employee/:id", protect, adminOnly, editEmployee);
// router.delete('/delete-employee/:id', protect, adminOnly, deleteEmployee);

// // Route for fetching all clients and applications
// router.get("/clients", protect, adminOnly, getAllClientsAndApplications);

// // Route for fetching a single client's details
// router.get("/clients/:clientId", protect, adminOnly, getClientDetails);

// export default router;



// import express from "express";
// import { loginAdmin, getAdminProfile } from "../controllers/adminController.js";
// import { protect, adminOnly } from "../middlewares/authMiddleware.js";
// import { addEmployee, deleteEmployee, editEmployee, getEmployees } from "../controllers/employeeController.js";
// import { 
//   getAllClientsAndApplications, 
//   getClientDetails, 
//   getClientApplications, 
//   updateApplicationStatus,
//   getAllApplications
// } from "../controllers/EmployeeDashboard.js";
// // import { getAllClientsAndApplications, getClientDetails, getClientApplications, getClientActivity } from "../controllers/EmployeeDashboard.js";

// const router = express.Router();

// router.post("/login", loginAdmin);
// router.get("/profile", protect, adminOnly, getAdminProfile);
// router.post("/add-employee", protect, adminOnly, addEmployee);
// router.get("/employees", protect, adminOnly, getEmployees);
// router.put("/edit-employee/:id", protect, adminOnly, editEmployee);
// router.delete('/delete-employee/:id', protect, adminOnly, deleteEmployee);

// // Route for fetching all clients and applications
// router.get("/clients", protect, adminOnly, getAllClientsAndApplications);

// // Route for fetching a single client's details
// router.get("/clients/:clientId", protect, adminOnly, getClientDetails);

// // Route for fetching applications for a specific client
// router.get("/clients/:clientId/applications", protect, adminOnly, getClientApplications);

// // Route for updating application status (for Request Documents, etc.)
// router.patch("/applications/:id/status", protect, adminOnly, updateApplicationStatus);
// // Route for fetching all applications (for admin applications page)
// router.get("/applications", protect, adminOnly, getAllApplications);
// export default router;

import express from "express";
import { loginAdmin, getAdminProfile } from "../controllers/adminController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import { addEmployee, deleteEmployee, editEmployee, getEmployees } from "../controllers/employeeController.js";
import { 
  getAllClientsAndApplications, 
  getClientDetails, 
  getClientApplications, 
  updateApplicationStatus,
  getAllApplications,
  reassignClient,
  getReportsSummary
} from "../controllers/EmployeeDashboard.js";
import { getClients, getOverview } from "../controllers/adminController.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.get("/profile", protect, adminOnly, getAdminProfile);
router.post("/add-employee", protect, adminOnly, addEmployee);
router.get("/employees", protect, adminOnly, getEmployees);
router.put("/edit-employee/:id", protect, adminOnly, editEmployee);
router.delete('/delete-employee/:id', protect, adminOnly, deleteEmployee);

// Route for fetching all clients and applications (or filtered by ?agentId=)
// If agentId is provided, getClients will return only that agent's clients.
router.get("/clients", protect, adminOnly, getClients);

// Admin dashboard overview metrics used to populate cards
router.get("/overview", protect, adminOnly, getOverview);

// Route for fetching a single client's details
router.get("/clients/:clientId", protect, adminOnly, getClientDetails);

// Route for fetching applications for a specific client
router.get("/clients/:clientId/applications", protect, adminOnly, getClientApplications);

// Route to reassign a client to an employee and/or agent
router.put("/clients/:clientId/reassign", protect, adminOnly, reassignClient);

// Route for fetching all applications (for admin applications page) - MUST come before specific routes
router.get("/applications", protect, adminOnly, getAllApplications);

// Route for updating application status (for Request Documents, etc.) - Accept both PUT and PATCH
router.put("/applications/:id/status", protect, adminOnly, updateApplicationStatus);
router.patch("/applications/:id/status", protect, adminOnly, updateApplicationStatus);

// Backward-compatible data endpoint used by frontend to refresh lists
router.get("/public/data", protect, adminOnly, getAllClientsAndApplications);

// Reports summary endpoint
router.get("/reports/summary", protect, adminOnly, getReportsSummary);

export default router;