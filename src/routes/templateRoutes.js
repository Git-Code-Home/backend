import express from "express";
import { getTemplateByCountry } from "../controllers/templateController.js";

const router = express.Router();

// Public: get template for a country
router.get("/:countrySlug", getTemplateByCountry);

export default router;
