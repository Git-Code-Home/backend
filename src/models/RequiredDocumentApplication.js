import mongoose from "mongoose"

const requiredDocumentApplicationSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    // Personal Information
    fullName: String,
    gender: String,
    dateOfBirth: Date,
    placeOfBirth: String,
    nationality: String,
    passportNumber: String,
    passportIssueDate: Date,
    passportExpiryDate: Date,
    placeOfIssue: String,
    emiratesId: String,
    // Family Details
    fatherName: String,
    motherName: String,
    maritalStatus: String,
    spouseName: String,
    children: String,
    // Address Details
    homeAddress: String,
    currentAddress: String,
    city: String,
    country: String,
    mobileNumber: String,
    whatsappNumber: String,
    email: String,
    // Employment Details
    occupation: String,
    companyName: String,
    companyAddress: String,
    jobTitle: String,
    monthlySalary: String,
    employerContact: String,
    noc: String,
    // Travel Information
    purposeOfVisit: String,
    destinationCountry: String,
    departureDate: Date,
    returnDate: Date,
    durationOfStay: String,
    travelHistory: String,
    visaRefusal: String,
    visaRefusalDetails: String,
    // Accommodation
    hotelName: String,
    flightBooking: String,
    travelInsurance: String,
    // Financial Details
    tripPayment: String,
    sponsorName: String,
    sponsorRelationship: String,
    sponsorContact: String,
    sponsorAddress: String,
    bankStatement: String,
    // Documents Checklist
    documentsChecklist: [String],
    // Declaration
    clientSignature: String,
    declarationDate: Date,
    // Status
    status: {
      type: String,
      enum: ["pending", "reviewed", "approved", "rejected"],
      default: "pending",
    },
    adminNotes: String,
  },
  { timestamps: true }
)

export default mongoose.model("RequiredDocumentApplication", requiredDocumentApplicationSchema)
