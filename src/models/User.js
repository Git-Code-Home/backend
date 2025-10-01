import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "employee", "client"],
      default: "client",
    },
    designation: { type: String, default: "" }, // ✅ added
    phone: { type: String, default: "" }, // ✅ added
    status: { type: String, default: "Active" }, // ✅ added
  },
  { timestamps: true },
)

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password)
}

export default mongoose.model("User", userSchema)
