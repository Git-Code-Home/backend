import User from "../models/User.js"
import jwt from "jsonwebtoken"

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" })

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body || {}
    console.log("[v0] Incoming payload:", { email, pwLen: password ? password.length : 0 })

    const admin = await User.findOne({ email, role: "admin" })
    console.log("[v0] Found admin:", !!admin)

    const isMatch = admin ? await admin.matchPassword(password) : false
    console.log("[v0] Password compare result:", isMatch)

    if (admin && isMatch) {
      res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token: generateToken(admin._id),
      })
    } else {
      console.log("[v0] Invalid credentials attempt:", email)
      res.status(401).json({ message: "Invalid admin credentials" })
    }
  } catch (error) {
    console.error("[v0] Login admin error:", error)
    res.status(500).json({ message: error.message })
  }
}

export const getAdminProfile = async (req, res) => {
  res.json(req.user)
}
