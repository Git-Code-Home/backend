// const express = require('express');
// const router = express.Router();
// const Commission = require('../models/Commission');
// const multer = require('multer');
// const path = require('path');

// // Middleware for admin authentication (replace with your actual middleware)
// import { protect, adminOnly } from "../middleware/authMiddleware.js";
// // Multer setup for payment proof uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/paymentProofs/');
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage });

// // Add a new commission
// router.post('/', authenticateAdmin, async (req, res) => {
//   try {
//     const { agent, client, amount, status } = req.body;
//     const commission = new Commission({ agent, client, amount, status });
//     await commission.save();
//     res.status(201).json(commission);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// // List all commissions (optionally filter by agent/client/status)
// router.get('/', authenticateAdmin, async (req, res) => {
//   try {
//     const { agent, client, status } = req.query;
//     const filter = {};
//     if (agent) filter.agent = agent;
//     if (client) filter.client = client;
//     if (status) filter.status = status;
//     const commissions = await Commission.find(filter)
//       .populate('agent', 'name email')
//       .populate('client', 'name email');
//     res.json(commissions);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Upload payment proof and mark as paid
// router.put('/:id/proof', authenticateAdmin, upload.single('paymentProof'), async (req, res) => {
//   try {
//     const commission = await Commission.findById(req.params.id);
//     if (!commission) return res.status(404).json({ error: 'Commission not found' });
//     commission.paymentProof = req.file ? req.file.path : '';
//     commission.status = 'paid';
//     await commission.save();
//     res.json(commission);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });



// module.exports = router;


// import express from "express";
// import Commission from "../models/Commission.js";
// import multer from 'multer';
// import path from 'path';
// import { protect, adminOnly } from '../middleware/authMiddleware.js';

// const router = express.Router();

// // Multer setup for payment proof uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/paymentProofs/');
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage });

// // Add a new commission
// router.post('/', protect, adminOnly, async (req, res) => {
//   try {
//     const { agent, client, amount, status } = req.body;
//     const commission = new Commission({ agent, client, amount, status });
//     await commission.save();
//     res.status(201).json(commission);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// // List all commissions (optionally filter by agent/client/status)
// router.get('/', protect, adminOnly, async (req, res) => {
//   try {
//     const { agent, client, status } = req.query;
//     const filter = {};
//     if (agent) filter.agent = agent;
//     if (client) filter.client = client;
//     if (status) filter.status = status;
//     const commissions = await Commission.find(filter)
//       .populate('agent', 'name email')
//       .populate('client', 'name email');
//     res.json(commissions);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Upload payment proof and mark as paid
// router.put('/:id/proof', protect, adminOnly, upload.single('paymentProof'), async (req, res) => {
//   try {
//     const commission = await Commission.findById(req.params.id);
//     if (!commission) return res.status(404).json({ error: 'Commission not found' });
//     commission.paymentProof = req.file ? req.file.path : '';
//     commission.status = 'paid';
//     await commission.save();
//     res.json(commission);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });
// export default router;
// module.exports = router;
import express from "express";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import {
  createCommission,
  listCommissions,
  getCommission,
  updateCommission,
  deleteCommission,
  uploadReceipt,
} from "../controllers/agentCommissionController.js";

const router = express.Router();

// Create commission (admin)
router.post("/", protect, adminOnly, upload.single("receipt"), createCommission);

// List / filter / search
router.get("/", protect, adminOnly, listCommissions);

// Single
router.get("/:id", protect, adminOnly, getCommission);

// Update
router.put("/:id", protect, adminOnly, updateCommission);

// Delete
router.delete("/:id", protect, adminOnly, deleteCommission);

// Upload receipt and mark paid
router.put("/:id/receipt", protect, adminOnly, upload.single("receipt"), uploadReceipt);
// Backwards-compatible endpoint used by existing frontend
router.put("/:id/proof", protect, adminOnly, upload.single("receipt"), uploadReceipt);

export default router;