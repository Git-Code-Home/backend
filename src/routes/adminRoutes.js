import express from "express";
import { loginAdmin, getAdminProfile } from "../controllers/adminController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import { addEmployee, deleteEmployee, editEmployee, getEmployees } from "../controllers/employeeController.js";
import { getAllClientsAndApplications } from "../controllers/EmployeeDashboard.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.get("/profile", protect, adminOnly, getAdminProfile);
router.post("/add-employee", protect, adminOnly, addEmployee);
router.get("/employees", protect, adminOnly, getEmployees);
router.put("/edit-employee/:id" , protect , adminOnly , editEmployee)
router.delete('/delete-employee/:id' , protect , adminOnly ,  deleteEmployee)
router.get("/public/data", getAllClientsAndApplications);



export default router;
