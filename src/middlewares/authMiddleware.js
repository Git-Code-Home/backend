import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ------------------ PROTECT ROUTES ------------------
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user; // ✅ set user for all downstream middlewares
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// ------------------ ADMIN ONLY ------------------
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Admin access required" });
  }
};

// ------------------ EMPLOYEE ONLY ------------------
export const employeeOnly = (req, res, next) => {
  if (req.user && req.user.role === "employee") {
    next();
  } else {
    res.status(403).json({ message: "Employee access required" });
  }
};

// ------------------ AGENT ONLY ------------------
export const agentOnly = (req, res, next) => {
  if (req.user && req.user.role === "agent") {
    next();
  } else {
    res.status(403).json({ message: "Agent access required" });
  }
};
