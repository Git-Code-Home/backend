import RequiredDocumentApplication from "../models/RequiredDocumentApplication.js"
import Client from "../models/Client.js"

// Submit Required Document Application
export const submitApplication = async (req, res) => {
  try {
    const clientId = req.client?._id
    if (!clientId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const applicationData = {
      clientId,
      ...req.body,
    }

    // Convert date strings to Date objects
    if (applicationData.dateOfBirth) {
      applicationData.dateOfBirth = new Date(applicationData.dateOfBirth)
    }
    if (applicationData.passportIssueDate) {
      applicationData.passportIssueDate = new Date(applicationData.passportIssueDate)
    }
    if (applicationData.passportExpiryDate) {
      applicationData.passportExpiryDate = new Date(applicationData.passportExpiryDate)
    }
    if (applicationData.departureDate) {
      applicationData.departureDate = new Date(applicationData.departureDate)
    }
    if (applicationData.returnDate) {
      applicationData.returnDate = new Date(applicationData.returnDate)
    }
    if (applicationData.declarationDate) {
      applicationData.declarationDate = new Date(applicationData.declarationDate)
    }

    const application = new RequiredDocumentApplication(applicationData)
    await application.save()

    res.status(201).json({
      message: "Application submitted successfully",
      application,
    })
  } catch (err) {
    console.error("Error submitting application:", err)
    res.status(500).json({ message: err.message || "Failed to submit application" })
  }
}

// Get all Required Document Applications (Admin)
export const getAllApplications = async (req, res) => {
  try {
    const applications = await RequiredDocumentApplication.find()
      .populate("clientId", "name email mobileNumber")
      .sort({ createdAt: -1 })

    res.status(200).json(applications)
  } catch (err) {
    console.error("Error fetching applications:", err)
    res.status(500).json({ message: err.message || "Failed to fetch applications" })
  }
}

// Get single application by ID
export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params
    const application = await RequiredDocumentApplication.findById(id).populate("clientId")

    if (!application) {
      return res.status(404).json({ message: "Application not found" })
    }

    res.status(200).json(application)
  } catch (err) {
    console.error("Error fetching application:", err)
    res.status(500).json({ message: err.message || "Failed to fetch application" })
  }
}

// Get user's own applications
export const getMyApplications = async (req, res) => {
  try {
    const clientId = req.client?._id
    const applications = await RequiredDocumentApplication.find({ clientId }).sort({ createdAt: -1 })

    res.status(200).json(applications)
  } catch (err) {
    console.error("Error fetching user applications:", err)
    res.status(500).json({ message: err.message || "Failed to fetch applications" })
  }
}

// Update application status (Admin)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, adminNotes } = req.body

    if (!["pending", "reviewed", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const application = await RequiredDocumentApplication.findByIdAndUpdate(
      id,
      { status, adminNotes },
      { new: true }
    )

    if (!application) {
      return res.status(404).json({ message: "Application not found" })
    }

    res.status(200).json({
      message: "Application status updated",
      application,
    })
  } catch (err) {
    console.error("Error updating application:", err)
    res.status(500).json({ message: err.message || "Failed to update application" })
  }
}

// Delete application
export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params
    const application = await RequiredDocumentApplication.findByIdAndDelete(id)

    if (!application) {
      return res.status(404).json({ message: "Application not found" })
    }

    res.status(200).json({ message: "Application deleted successfully" })
  } catch (err) {
    console.error("Error deleting application:", err)
    res.status(500).json({ message: err.message || "Failed to delete application" })
  }
}
