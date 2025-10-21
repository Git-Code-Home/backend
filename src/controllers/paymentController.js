import PaymentReceipt from "../models/PaymentReceipt.js";
import Application from "../models/Application.js";

export const uploadReceipt = async (req, res) => {
  try {
    const { amount, description, uploadedBy, role, applicationId, fileUrl } = req.body;
    // fileUrl is now the Cloudinary URL, passed from paymentRoutes.js
    const receipt = new PaymentReceipt({
      uploadedBy,
      role,
      amount,
      description,
      fileUrl,
    });
    await receipt.save();

    // If applicationId is provided, update the application
    if (applicationId) {
      const application = await Application.findById(applicationId);
      if (application) {
        application.documents.paymentReceipt = fileUrl;
        if (!application.invoice) application.invoice = {};
        application.invoice.paid = true;
        application.applicationStatus = 'under_review';
        await application.save();
      }
    }
    res.status(201).json({ message: "Receipt uploaded successfully", receipt });
  } catch (error) {
    res.status(500).json({ message: "Error uploading receipt", error: error.message });
  }
};

export const getReceipts = async (req, res) => {
  try {
    const receipts = await PaymentReceipt.find().populate("uploadedBy", "name email");
    res.status(200).json(receipts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching receipts", error });
  }
};

export const verifyReceipt = async (req, res) => {
  try {
    const receipt = await PaymentReceipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ message: "Receipt not found" });
    receipt.verified = true;
    await receipt.save();

    // Update application status to 'approved' if linked
    const application = await Application.findOne({ "documents.paymentReceipt": receipt.fileUrl });
    if (application) {
      application.applicationStatus = "approved";
      await application.save();
    }
    res.status(200).json({ message: "Receipt verified and application approved" });
  } catch (error) {
    res.status(500).json({ message: "Error verifying receipt", error: error.message });
  }
};
