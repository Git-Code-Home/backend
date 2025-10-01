// import express from "express";
// import { loginEmployee } from "../controllers/employeeController.js";
// import upload from "../config/multer.js"; // memory storage
// import {
//   registerClient,
//   createApplication,
//   uploadDocuments,
//   updateApplicationPersonal,
//   updateApplicationTravel,
//   submitApplication,
//   getApplicationById,
//   getMyClients, // existing
//   getMyApplications // existing
// } from "../controllers/EmployeeDashboard.js";
// import { protect, employeeOnly } from "../middlewares/authMiddleware.js";
// const router = express.Router();

// router.post("/login-employee", loginEmployee);

// router.post("/clients", protect, employeeOnly, registerClient);

// router.post("/applications", protect, employeeOnly, createApplication);
// router.get("/applications/:id", protect, employeeOnly, getApplicationById);

// // step updates
// router.put("/applications/:id/personal", protect, employeeOnly, updateApplicationPersonal);
// router.put("/applications/:id/travel", protect, employeeOnly, updateApplicationTravel);

// // upload docs
// router.post("/applications/:id/upload",
//   protect,
//   employeeOnly,
//   upload.fields([
//     { name: "passport", maxCount: 1 },
//     { name: "photo", maxCount: 1 },
//     { name: "idCard", maxCount: 1 },
//   ]),
//   uploadDocuments
// );

// // submit
// router.put("/applications/:id/submit", protect, employeeOnly, submitApplication);

// // list
// router.get("/my-clients", protect, employeeOnly, getMyClients);
// router.get("/my-applications", protect, employeeOnly, getMyApplications);




// export default router;


import express from "express";
import { loginEmployee } from "../controllers/employeeController.js";
import upload from '../middlewares/upload.js';
import {
  registerClient,
  createApplication,
  uploadDocuments,
  getMyClients,
  getMyApplications
} from "../controllers/EmployeeDashboard.js";
import { protect, employeeOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// employee login
router.post("/login-employee", loginEmployee);

// client registration
router.post("/clients", protect, employeeOnly, registerClient);

// create new application
router.post("/applications", protect, employeeOnly, createApplication);

// upload docs
router.post('/applications/:id/upload', 
  upload.fields([
    { name: 'passport', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'idCard', maxCount: 1 }
  ]), 
  uploadDocuments
);

// list my clients
router.get("/my-clients", protect, employeeOnly, getMyClients);

// list my applications
router.get("/my-applications", protect, employeeOnly, getMyApplications);

export default router;
