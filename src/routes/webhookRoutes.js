import express from "express";
import { stripeWebhook, paypalWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// ==================== STRIPE WEBHOOK ====================
// Raw body required for Stripe signature verification
router.post("/stripe", express.raw({ type: "application/json" }), stripeWebhook);

// ==================== PAYPAL WEBHOOK ====================
router.post("/paypal", express.json(), paypalWebhook);

export default router;
