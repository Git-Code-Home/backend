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
import Commission from "../models/Commission.js";
import multer from "multer";
import path from "path";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/paymentProofs/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { agent, client, amount, status } = req.body;
    const commission = new Commission({ agent, client, amount, status });
    await commission.save();
    res.status(201).json(commission);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { agent, client, status } = req.query;
    const filter = {};
    if (agent) filter.agent = agent;
    if (client) filter.client = client;
    if (status) filter.status = status;
    const commissions = await Commission.find(filter)
      .populate('agent', 'name email')
      .populate('client', 'name email');
    res.json(commissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/proof', protect, adminOnly, upload.single('paymentProof'), async (req, res) => {
  try {
    const commission = await Commission.findById(req.params.id);
    if (!commission) return res.status(404).json({ error: 'Commission not found' });
    commission.paymentProof = req.file ? req.file.path : '';
    commission.status = 'paid';
    await commission.save();
    res.json(commission);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;