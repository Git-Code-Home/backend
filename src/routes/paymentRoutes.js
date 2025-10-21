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
// router.post("/upload", upload.single("receipt"), uploadReceipt);

// // get all receipts (admin view)
// router.get("/", getReceipts);

// // verify (admin action)
// router.patch("/verify/:id", verifyReceipt);

// export default router;




import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadReceipt, getReceipts, verifyReceipt } from "../controllers/paymentController.js";

const router = express.Router();

// Ensure uploads/receipts directory exists
const uploadsDir = "uploads/receipts";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads/receipts directory");
}

// multer setup for uploads (store locally or to Cloudinary)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  },
});
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and PDF files are allowed.'));
    }
  }
});

// upload receipt
router.post("/upload-receipt", upload.single("receipt"), uploadReceipt);

// get all receipts (admin view)
router.get("/", getReceipts);

// verify (admin action)
router.patch("/verify/:id", verifyReceipt);

export default router;






