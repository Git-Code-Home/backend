import express from "express";
import seedController from "../controllers/seedController.js";

const router = express.Router();

// POST /api/admin/seed
router.post("/seed", seedController.runSeed);

export default router;
