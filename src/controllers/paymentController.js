import PaymentReceipt from "../models/PaymentReceipt.js";

export const uploadReceipt = async (req, res) => {
  try {
    const { amount, description, uploadedBy, role } = req.body;
    const fileUrl = `/uploads/receipts/${req.file.filename}`;

    const receipt = new PaymentReceipt({
      uploadedBy,
      role,
      amount,
      description,
      fileUrl,
    });

    await receipt.save();
    res.status(201).json({ message: "Receipt uploaded successfully", receipt });
  } catch (error) {
    res.status(500).json({ message: "Error uploading receipt", error });
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

    res.status(200).json({ message: "Receipt verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error verifying receipt", error });
  }
};
