// const mongoose = require('mongoose');

// const commissionSchema = new mongoose.Schema({
//   agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
//   amount: { type: Number, required: true },
//   status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
//   paymentProof: { type: String }, // URL or file path to screenshot
//   createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Commission', commissionSchema);

// import mongoose from "mongoose";

// const commissionSchema = new mongoose.Schema({
//   agent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
//   amount: { type: Number, required: true },
//   status: { type: String, enum: ["pending", "paid"], default: "pending" },
//   paymentProof: { type: String },
//   createdAt: { type: Date, default: Date.now },
// });

// const Commission = mongoose.model("Commission", commissionSchema);

// export default Commission; // ✅ this is the correct ESM export


// src/models/Commission.js
import mongoose from "mongoose";

const commissionSchema = new mongoose.Schema({
  agent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "paid"], default: "pending" },
  paymentProof: { type: String }, // URL or file path to screenshot
  createdAt: { type: Date, default: Date.now },
});

const Commission = mongoose.model("Commission", commissionSchema);

export default Commission; // ✅ this line is critical
