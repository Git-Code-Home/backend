
import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { uploadReceipt, getReceipts, verifyReceipt } from "../controllers/paymentController.js";

// Cloudinary config (credentials are in .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer: memory storage for serverless
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed."));
    }
  },
});

// Helper: upload buffer to Cloudinary
function uploadToCloudinary(fileBuffer, mimetype) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "payment_receipts",
        resource_type: mimetype === "application/pdf" ? "raw" : "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
}

// Controller: upload receipt to Cloudinary, then call your main logic
async function uploadReceiptCloudinary(req, res) {
  try {
    const { amount, description, uploadedBy, role, applicationId } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to Cloudinary
    const fileUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);

    // Pass Cloudinary URL to your main controller
    req.body.fileUrl = fileUrl;
    await uploadReceipt(req, res);
  } catch (error) {
    console.error("[uploadReceiptCloudinary] Error:", error);
    res.status(500).json({ message: "Error uploading receipt", error: error.message });
  }
}

const router = express.Router();

// Upload receipt (to Cloudinary)
router.post("/upload-receipt", upload.single("receipt"), uploadReceiptCloudinary);

// Get all receipts (admin view)
router.get("/", getReceipts);

// Verify (admin action)
router.patch("/verify/:id", verifyReceipt);

export default router;






