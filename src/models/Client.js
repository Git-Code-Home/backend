import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    nationality: { type: String },
    unqualified: { type: Boolean, default: false },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    profile: {
      address: { type: String },
      dateOfBirth: { type: Date },
      gender: { type: String, enum: ["male", "female", "other"] },
    },

    reminders: [
      {
        type: { type: String, enum: ["expiry", "payment"], required: true },
        message: { type: String },
        date: { type: Date, required: true },
        sent: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
  },
)

clientSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

clientSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

const Client = mongoose.model("Client", clientSchema)

export default Client
