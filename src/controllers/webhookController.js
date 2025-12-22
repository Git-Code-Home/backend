import Stripe from "stripe";
import axios from "axios";
import Payment from "../models/Payment.js";
import Application from "../models/Application.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PAYPAL_API_BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api.paypal.com"
    : "https://api.sandbox.paypal.com";

// ==================== STRIPE WEBHOOK ====================
// @route   POST /api/webhooks/stripe
// @access  Public (Verified by Stripe signature)
// @desc    Handle Stripe webhook events
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle different event types
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handleStripePaymentSuccess(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handleStripePaymentFailed(event.data.object);
        break;

      case "payment_intent.canceled":
        await handleStripePaymentCancelled(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== HANDLE STRIPE PAYMENT SUCCESS ====================
const handleStripePaymentSuccess = async (paymentIntent) => {
  try {
    const { metadata, id: paymentIntentId } = paymentIntent;
    const { paymentId } = metadata;

    // Update payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      console.error(`Payment record not found: ${paymentId}`);
      return;
    }

    payment.paymentStatus = "completed";
    payment.transactionId = paymentIntentId;
    payment.completedAt = new Date();
    await payment.save();

    // Update application payment status
    await Application.findByIdAndUpdate(
      payment.application,
      { paymentStatus: "paid" },
      { new: true }
    );

    console.log(`✅ Stripe payment succeeded: ${paymentIntentId}`);
  } catch (error) {
    console.error("Error handling Stripe payment success:", error);
  }
};

// ==================== HANDLE STRIPE PAYMENT FAILED ====================
const handleStripePaymentFailed = async (paymentIntent) => {
  try {
    const { metadata, id: paymentIntentId, last_payment_error } = paymentIntent;
    const { paymentId } = metadata;

    // Update payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      console.error(`Payment record not found: ${paymentId}`);
      return;
    }

    payment.paymentStatus = "failed";
    payment.failureReason = last_payment_error?.message || "Payment failed";
    await payment.save();

    console.log(`❌ Stripe payment failed: ${paymentIntentId}`);
  } catch (error) {
    console.error("Error handling Stripe payment failure:", error);
  }
};

// ==================== HANDLE STRIPE PAYMENT CANCELLED ====================
const handleStripePaymentCancelled = async (paymentIntent) => {
  try {
    const { metadata, id: paymentIntentId } = paymentIntent;
    const { paymentId } = metadata;

    // Update payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      console.error(`Payment record not found: ${paymentId}`);
      return;
    }

    payment.paymentStatus = "cancelled";
    await payment.save();

    console.log(`⏸️  Stripe payment cancelled: ${paymentIntentId}`);
  } catch (error) {
    console.error("Error handling Stripe payment cancellation:", error);
  }
};

// ==================== PAYPAL WEBHOOK ====================
// @route   POST /api/webhooks/paypal
// @access  Public (Verified by PayPal)
// @desc    Handle PayPal webhook events
export const paypalWebhook = async (req, res) => {
  try {
    const event = req.body;

    // Verify webhook signature with PayPal
    const isValid = await verifyPayPalWebhook(req.body, req.headers);

    if (!isValid) {
      console.error("PayPal webhook signature verification failed");
      return res.status(400).json({ error: "Signature verification failed" });
    }

    // Handle different event types
    switch (event.event_type) {
      case "CHECKOUT.ORDER.COMPLETED":
        await handlePayPalOrderCompleted(event.resource);
        break;

      case "PAYMENT.CAPTURE.COMPLETED":
        await handlePayPalCaptureCompleted(event.resource);
        break;

      case "PAYMENT.CAPTURE.DENIED":
        await handlePayPalCaptureDenied(event.resource);
        break;

      default:
        console.log(`Unhandled PayPal event type: ${event.event_type}`);
    }

    res.json({ status: "success" });
  } catch (error) {
    console.error("PayPal webhook processing error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== VERIFY PAYPAL WEBHOOK ====================
const verifyPayPalWebhook = async (event, headers) => {
  try {
    const accessToken = await getPayPalAccessToken();

    const verification = await axios.post(
      `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      {
        transmission_id: headers["paypal-transmission-id"],
        transmission_time: headers["paypal-transmission-time"],
        cert_url: headers["paypal-cert-url"],
        auth_algo: headers["paypal-auth-algo"],
        transmission_sig: headers["paypal-transmission-sig"],
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: event,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return verification.data.verification_status === "SUCCESS";
  } catch (error) {
    console.error("PayPal verification error:", error);
    return false;
  }
};

// ==================== GET PAYPAL ACCESS TOKEN ====================
const getPayPalAccessToken = async () => {
  try {
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString("base64");

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error("PayPal Access Token Error:", error);
    throw new Error("Failed to get PayPal access token");
  }
};

// ==================== HANDLE PAYPAL ORDER COMPLETED ====================
const handlePayPalOrderCompleted = async (order) => {
  try {
    console.log(`PayPal Order Completed: ${order.id}`);
    // Payment completion will be handled by PAYMENT.CAPTURE.COMPLETED event
  } catch (error) {
    console.error("Error handling PayPal order completed:", error);
  }
};

// ==================== HANDLE PAYPAL CAPTURE COMPLETED ====================
const handlePayPalCaptureCompleted = async (capture) => {
  try {
    const { id: transactionId, supplementary_data } = capture;

    // Find payment by order ID in metadata
    const payment = await Payment.findOne({
      orderId: transactionId,
    });

    if (!payment) {
      console.error(`Payment record not found for transaction: ${transactionId}`);
      return;
    }

    payment.paymentStatus = "completed";
    payment.transactionId = transactionId;
    payment.completedAt = new Date();
    await payment.save();

    // Update application payment status
    await Application.findByIdAndUpdate(
      payment.application,
      { paymentStatus: "paid" },
      { new: true }
    );

    console.log(`✅ PayPal payment completed: ${transactionId}`);
  } catch (error) {
    console.error("Error handling PayPal capture completed:", error);
  }
};

// ==================== HANDLE PAYPAL CAPTURE DENIED ====================
const handlePayPalCaptureDenied = async (capture) => {
  try {
    const { id: transactionId, status_details } = capture;

    // Find payment
    const payment = await Payment.findOne({
      transactionId: transactionId,
    });

    if (payment) {
      payment.paymentStatus = "failed";
      payment.failureReason = status_details?.reason || "Payment denied";
      await payment.save();
    }

    console.log(`❌ PayPal payment denied: ${transactionId}`);
  } catch (error) {
    console.error("Error handling PayPal capture denied:", error);
  }
};
