

import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { uploadReceipt, getReceipts, verifyReceipt } from "../controllers/paymentController.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
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

function uploadToCloudinary(fileBuffer, mimetype) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
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

async function uploadReceiptCloudinary(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const fileUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    req.body.fileUrl = fileUrl;
    await uploadReceipt(req, res);
  } catch (error) {
    res.status(500).json({ message: "Error uploading receipt", error: error.message });
  }
}

const router = express.Router();
router.post("/upload-receipt", upload.single("receipt"), uploadReceiptCloudinary);
router.get("/", getReceipts);
router.patch("/verify/:id", verifyReceipt);
export default router;






