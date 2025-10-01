import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Client from "../models/Client.js"; 
import Application from "../models/Application.js"; 

// ------------------ TOKEN GENERATOR ------------------
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// ------------------ ADD EMPLOYEE ------------------
// @desc    Add a new employee (admin only)


// @route   POST /api/admin/add-employee
// @access  Private (Admin)
export const addEmployee = async (req, res) => {
  try {
    const { name, email, password, designation, phone } = req.body;

    // Check if employee already exists
    const userExists = await User.findOne({ email, role: "employee" });
    if (userExists) {
      return res.status(400).json({ message: "Employee already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create employee
    const employee = await User.create({
      name,
      email,
      password,
      role: "employee",
      designation,
      phone,
    });

    if (employee) {
      res.status(201).json({
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        designation: employee.designation,
        phone: employee.phone,
        status: employee.status,
        token: generateToken(employee._id),
      });
    } else {
      res.status(400).json({ message: "Invalid employee data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------ GET EMPLOYEES ------------------
// @desc    Get all employees with client & processed counts
// @route   GET /api/admin/employees
// @access  Private (Admin)
export const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).select("-password");

    const detailedEmployees = await Promise.all(
      employees.map(async (emp) => {
        const clientCount = await Client.countDocuments({ assignedTo: emp._id });
        const processedCount = await Application.countDocuments({ processedBy: emp._id });

        return {
          _id: emp._id,
          name: emp.name,
          email: emp.email,
          role: emp.role,              // ✅ Added
          designation: emp.designation, // ✅ Added
          phone: emp.phone,             // ✅ Added
          status: emp.status,           // ✅ Added
          clients: clientCount,
          processed: processedCount,
        };
      })
    );

    res.json(detailedEmployees);
  } catch (error) {
    console.error("❌ Error fetching employees:", error);
    res.status(500).json({ message: error.message });
  }
};

// ------------------ EDIT EMPLOYEE ------------------
// @desc    Edit an employee (admin only)
// @route   PUT /api/admin/edit-employee/:id
// @access  Private (Admin)
export const editEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, designation, phone, status } = req.body;

    const employee = await User.findById(id);

    if (!employee || employee.role !== "employee") {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Update fields if provided
    if (name) employee.name = name;
    if (email) employee.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      employee.password = await bcrypt.hash(password, salt);
    }
    if (designation) employee.designation = designation;
    if (phone) employee.phone = phone;
    if (status) employee.status = status;

    const updatedEmployee = await employee.save();

    res.json({
      _id: updatedEmployee._id,
      name: updatedEmployee.name,
      email: updatedEmployee.email,
      role: updatedEmployee.role,
      designation: updatedEmployee.designation,
      phone: updatedEmployee.phone,
      status: updatedEmployee.status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ------------------ DELETE EMPLOYEE ------------------
// @desc    Delete an employee (admin only)
// @route   DELETE /api/admin/delete-employee/:id
// @access  Private (Admin)
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await User.findById(id);

    if (!employee || employee.role !== "employee") {
      return res.status(404).json({ message: "Employee not found" });
    }

    // ✅ Use deleteOne instead of remove
    await employee.deleteOne();

    res.json({ message: "Employee removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;
    const employee = await User.findOne({ email, role: "employee" });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    res.json({
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      designation: employee.designation,
      phone: employee.phone,
      status: employee.status,
      token: generateToken(employee._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};