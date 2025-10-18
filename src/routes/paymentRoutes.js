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
import { uploadReceipt, getReceipts, verifyReceipt } from "../controllers/paymentController.js";

const router = express.Router();

// multer setup for uploads (store locally or to Cloudinary)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/receipts");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// upload receipt
router.post("/upload-receipt", upload.single("receipt"), uploadReceipt);

// get all receipts (admin view)
router.get("/", getReceipts);

// verify (admin action)
router.patch("/verify/:id", verifyReceipt);

export default router;






