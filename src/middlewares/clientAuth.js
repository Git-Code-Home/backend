import jwt from "jsonwebtoken";
import Client from "../models/Client.js";

export const protectClient = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ message: "No token provided" });
    const token = auth.split(" ")[1];

    // Development-only demo token bypass
    if (process.env.NODE_ENV === "development" && token === "demo-client-token") {
      console.log("[Auth] Using demo client token (development only)");
      // Attach a minimal demo client object and skip JWT verification
      req.client = { _id: "demo-client-id", name: "Demo Client" };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) return res.status(401).json({ message: "Invalid token" });
    const client = await Client.findById(decoded.id).select("-password");
    if (!client) return res.status(401).json({ message: "Client not found" });
    req.client = client;
    next();
  } catch (err) {
    console.error("protectClient error:", err && err.message ? err.message : err);
    return res.status(401).json({ message: "Not authorized" });
  }
};

export default { protectClient };
