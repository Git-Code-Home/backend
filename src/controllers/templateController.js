import FormTemplate from "../models/FormTemplate.js";

export const getTemplateByCountry = async (req, res) => {
  try {
    const { countrySlug } = req.params;
    const template = await FormTemplate.findOne({ countrySlug }).lean();
    if (!template) return res.status(404).json({ message: "Template not found" });
    
    // If formPdfUrl is not set, construct it from the frontend public folder
    if (!template.formPdfUrl) {
      template.formPdfUrl = `/documents/FORM FOR CLIENT.pdf`;
    }
    
    res.json(template);
  } catch (error) {
    console.error("getTemplateByCountry error:", error && error.message ? error.message : error);
    res.status(500).json({ message: error.message || "Failed to fetch template" });
  }
};

export default { getTemplateByCountry };
