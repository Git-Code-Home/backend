import express from "express";
import { listCountries } from "../controllers/countryController.js";

const router = express.Router();

// Public: list available countries
router.get("/", listCountries);

export default router;
