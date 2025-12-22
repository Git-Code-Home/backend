import Payment from "../models/Payment.js";

// ==================== GET ALL PAYMENTS ====================
// @route   GET /api/admin/payments
// @access  Private (Admin)
// @desc    Get all payments with filtering options
export const getAllPayments = async (req, res) => {
  try {
    const { status, gateway, userId, applicationId } = req.query;

    const filter = {};
    if (status) filter.paymentStatus = status;
    if (gateway) filter.gateway = gateway;
    if (userId) filter.user = userId;
    if (applicationId) filter.application = applicationId;

    const payments = await Payment.find(filter)
      .populate("user", "name email phone")
      .populate("application", "visaType country status")
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    console.error("Get All Payments Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== GET PAYMENT BY ID ====================
// @route   GET /api/admin/payments/:id
// @access  Private (Admin)
// @desc    Get payment details by ID
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate("user", "name email phone")
      .populate("application", "visaType country status clientId");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error("Get Payment By ID Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== PAYMENT STATISTICS ====================
// @route   GET /api/admin/payments/stats
// @access  Private (Admin)
// @desc    Get payment statistics and summary
export const getPaymentStats = async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments();
    const completedPayments = await Payment.countDocuments({
      paymentStatus: "completed",
    });
    const pendingPayments = await Payment.countDocuments({
      paymentStatus: "pending",
    });
    const failedPayments = await Payment.countDocuments({
      paymentStatus: "failed",
    });

    const totalRevenue = await Payment.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const revenueByGateway = await Payment.aggregate([
      { $match: { paymentStatus: "completed" } },
      {
        $group: {
          _id: "$gateway",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const revenueByCountry = await Payment.aggregate([
      { $match: { paymentStatus: "completed" } },
      {
        $lookup: {
          from: "applications",
          localField: "application",
          foreignField: "_id",
          as: "appData",
        },
      },
      { $unwind: "$appData" },
      {
        $group: {
          _id: "$appData.country",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      summary: {
        totalPayments,
        completedPayments,
        pendingPayments,
        failedPayments,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
      byGateway: revenueByGateway,
      byCountry: revenueByCountry,
    });
  } catch (error) {
    console.error("Get Payment Stats Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== EXPORT PAYMENTS ====================
// @route   GET /api/admin/payments/export
// @access  Private (Admin)
// @desc    Export payments as CSV
export const exportPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("user", "name email")
      .populate("application", "visaType country");

    // Create CSV header
    let csv =
      "Date,Client Name,Client Email,Visa Type,Country,Amount,Currency,Gateway,Status,Transaction ID\n";

    // Add payment rows
    payments.forEach((payment) => {
      csv += `"${new Date(payment.createdAt).toLocaleDateString()}","${payment.user.name}","${
        payment.user.email
      }","${payment.application.visaType}","${payment.application.country}","${payment.amount}","${
        payment.currency
      }","${payment.gateway}","${payment.paymentStatus}","${payment.transactionId}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="payments.csv"');
    res.send(csv);
  } catch (error) {
    console.error("Export Payments Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== REFUND PAYMENT ====================
// @route   POST /api/admin/payments/:id/refund
// @access  Private (Admin)
// @desc    Process a refund for a payment
export const refundPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.paymentStatus !== "completed") {
      return res.status(400).json({ message: "Only completed payments can be refunded" });
    }

    // TODO: Implement actual refund logic with Stripe/PayPal
    // For now, just update the status
    payment.paymentStatus = "refunded";
    payment.failureReason = reason || "Refund requested by admin";
    await payment.save();

    res.status(200).json({
      message: "Refund processed successfully",
      payment,
    });
  } catch (error) {
    console.error("Refund Payment Error:", error);
    res.status(500).json({ message: error.message });
  }
};
