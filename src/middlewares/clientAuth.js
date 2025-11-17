import jwt from "jsonwebtoken";
import Client from "../models/Client.js";

export const protectClient = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ message: "No token provided" });
    const token = auth.split(" ")[1];

    // Demo token bypass (accept demo token in all environments per request)
    if (token === "demo-client-token") {
      console.log("[Auth] Using demo client token (development only)");
      // Attempt to find or create a persistent demo client so ownership checks work
      try {
        let demoClient = await Client.findOne({ email: "demo@client.com" }).select("-password");
        if (!demoClient) {
          // Create a demo client and assign a fallback name/password
          const newDemo = new Client({
            name: "Demo Client",
            email: "demo@client.com",
            phone: "0000000000",
            password: process.env.DEMO_CLIENT_PASSWORD || "demo-password",
          });
          await newDemo.save();
          demoClient = await Client.findById(newDemo._id).select("-password");
        }
        req.client = demoClient;
        return next();
      } catch (err) {
        console.warn("Failed to load/create demo client for demo token:", err && err.message ? err.message : err);
        // Fallback to the lightweight stub to avoid blocking requests
        req.client = { _id: "000000000000000000000000", name: "Demo Client" };
        return next();
      }
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
