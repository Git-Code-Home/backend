import mongoose from "mongoose";

const agentCommissionSchema = new mongoose.Schema(
  {
    agent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    commission_amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
    receipt_url: { type: String, default: "" },
    paid_date: { type: Date, default: null },
  },
  { timestamps: true }
);

const AgentCommission = mongoose.model("AgentCommission", agentCommissionSchema);
export default AgentCommission;
