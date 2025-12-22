import Stripe from "stripe";
import Payment from "../models/Payment.js";
import Application from "../models/Application.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ==================== CREATE PAYMENT INTENT ====================
// @route   POST /api/client/payments/stripe/create-payment-intent
// @access  Private (Client)
// @desc    Create a Stripe payment intent for a visa application
export const createStripePaymentIntent = async (req, res) => {
  try {
    const { visaApplicationId } = req.body;
    const clientId = req.user._id; // Assuming auth middleware sets user

    if (!visaApplicationId) {
      return res.status(400).json({ message: "visaApplicationId is required" });
    }

    // Fetch the application to get visa type and verify client owns it
    const application = await Application.findById(visaApplicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Verify the client owns this application
    if (application.client.toString() !== clientId.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to pay for this application" });
    }

    // Check if already paid
    if (application.paymentStatus === "paid") {
      return res.status(400).json({ message: "Application already paid" });
    }

    // Fetch visa fee from database (you can store fees per visa type)
    // For now, using a default fee from env
    const amount = parseInt(process.env.DEFAULT_VISA_FEE) * 100; // Convert to cents

    // Create or update payment record
    let payment = await Payment.findOne({
      application: visaApplicationId,
      user: clientId,
      paymentStatus: "pending",
    });

    if (!payment) {
      payment = await Payment.create({
        user: clientId,
        application: visaApplicationId,
        gateway: "stripe",
        amount: amount / 100,
        currency: "USD",
        paymentStatus: "pending",
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      metadata: {
        visaApplicationId,
        clientId,
        paymentId: payment._id.toString(),
      },
      description: `Visa Application Fee - ${application.visaType}`,
    });

    // Save payment intent ID
    payment.paymentIntentId = paymentIntent.id;
    await payment.save();

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
      amount: amount / 100,
      currency: "USD",
    });
  } catch (error) {
    console.error("Stripe Payment Intent Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== CONFIRM PAYMENT ====================
// @route   POST /api/client/payments/stripe/confirm
// @access  Private (Client)
// @desc    Confirm payment completion (called after Stripe confirms payment)
export const confirmStripePayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const clientId = req.user._id;

    if (!paymentIntentId) {
      return res.status(400).json({ message: "paymentIntentId is required" });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res
        .status(400)
        .json({ message: "Payment intent not yet succeeded" });
    }

    // Find payment record
    const payment = await Payment.findOne({
      paymentIntentId: paymentIntentId,
      user: clientId,
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    // Update payment status
    payment.paymentStatus = "completed";
    payment.transactionId = paymentIntent.id;
    payment.completedAt = new Date();
    await payment.save();

    // Update application payment status
    await Application.findByIdAndUpdate(
      payment.application,
      { paymentStatus: "paid" },
      { new: true }
    );

    res.status(200).json({
      message: "Payment confirmed successfully",
      payment,
    });
  } catch (error) {
    console.error("Confirm Payment Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== GET PAYMENT STATUS ====================
// @route   GET /api/client/payments/:applicationId
// @access  Private (Client)
// @desc    Get payment status for an application
export const getPaymentStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const clientId = req.user._id;

    const payment = await Payment.findOne({
      application: applicationId,
      user: clientId,
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
    console.error("Get Payment Status Error:", error);
    res.status(500).json({ message: error.message });
  }
};
