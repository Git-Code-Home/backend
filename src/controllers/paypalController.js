import axios from "axios";
import Payment from "../models/Payment.js";
import Application from "../models/Application.js";

// PayPal API endpoints
const PAYPAL_API_BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api.paypal.com"
    : "https://api.sandbox.paypal.com";

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
    console.error("PayPal Access Token Error:", error.response?.data || error.message);
    throw new Error("Failed to get PayPal access token");
  }
};

// ==================== CREATE PAYPAL ORDER ====================
// @route   POST /api/client/payments/paypal/create-order
// @access  Private (Client)
// @desc    Create a PayPal order for visa application payment
export const createPayPalOrder = async (req, res) => {
  try {
    const { visaApplicationId } = req.body;
    const clientId = req.user._id;

    if (!visaApplicationId) {
      return res.status(400).json({ message: "visaApplicationId is required" });
    }

    // Fetch the application
    const application = await Application.findById(visaApplicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Verify client owns this application
    if (application.client.toString() !== clientId.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to pay for this application" });
    }

    // Check if already paid
    if (application.paymentStatus === "paid") {
      return res.status(400).json({ message: "Application already paid" });
    }

    // Get amount
    const amount = process.env.DEFAULT_VISA_FEE || "100";

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount,
          },
          description: `Visa Application Fee - ${application.visaType}`,
        },
      ],
      application_context: {
        return_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/client/applications?payment=success`,
        cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/client/applications?payment=cancelled`,
        user_action: "PAY_NOW",
      },
    };

    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders`,
      orderPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Create payment record
    const payment = await Payment.create({
      user: clientId,
      application: visaApplicationId,
      gateway: "paypal",
      amount: amount,
      currency: "USD",
      paymentStatus: "pending",
      orderId: response.data.id,
    });

    res.status(200).json({
      orderId: response.data.id,
      paymentId: payment._id,
      approvalLink: response.data.links.find((link) => link.rel === "approve")
        ?.href,
    });
  } catch (error) {
    console.error("PayPal Order Creation Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== CAPTURE PAYPAL ORDER ====================
// @route   POST /api/client/payments/paypal/capture-order
// @access  Private (Client)
// @desc    Capture (finalize) a PayPal order
export const capturePayPalOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const clientId = req.user._id;

    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }

    // Find payment record
    const payment = await Payment.findOne({
      orderId: orderId,
      user: clientId,
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Capture the order
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status === "COMPLETED") {
      // Extract transaction ID
      const transactionId =
        response.data.purchase_units[0]?.payments?.captures[0]?.id || orderId;

      // Update payment record
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

      res.status(200).json({
        message: "Payment captured successfully",
        payment,
      });
    } else {
      payment.paymentStatus = "failed";
      payment.failureReason = `Payment status: ${response.data.status}`;
      await payment.save();

      res.status(400).json({
        message: "Payment capture failed",
        status: response.data.status,
      });
    }
  } catch (error) {
    console.error("PayPal Capture Error:", error);

    // Update payment as failed
    if (req.body.orderId) {
      await Payment.findOneAndUpdate(
        { orderId: req.body.orderId },
        { paymentStatus: "failed", failureReason: error.message }
      );
    }

    res.status(500).json({ message: error.message });
  }
};

// ==================== GET PAYPAL PAYMENT STATUS ====================
// @route   GET /api/client/payments/paypal/:applicationId
// @access  Private (Client)
// @desc    Get PayPal payment status for an application
export const getPayPalPaymentStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const clientId = req.user._id;

    const payment = await Payment.findOne({
      application: applicationId,
      user: clientId,
      gateway: "paypal",
    });

    if (!payment) {
      return res
        .status(200)
        .json({ message: "No payment found", paymentStatus: "pending" });
    }

    res.status(200).json({
      paymentStatus: payment.paymentStatus,
      gateway: payment.gateway,
      amount: payment.amount,
      currency: payment.currency,
      transactionId: payment.transactionId,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt,
    });
  } catch (error) {
    console.error("Get PayPal Payment Status Error:", error);
    res.status(500).json({ message: error.message });
  }
};
