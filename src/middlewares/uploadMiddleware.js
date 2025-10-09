import multer from "multer"
import { v2 as cloudinary } from "cloudinary"
import { CloudinaryStorage } from "multer-storage-cloudinary"

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: "douyx2kru",
  api_key: "295237664934226",
  api_secret: "QrlV-Vx6f3I1Mi2ZWOX9f0oRcRw",
})

// ✅ Set up Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "visa_documents", // folder name in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
  },
})

// ✅ Initialize multer
export const upload = multer({ storage })
