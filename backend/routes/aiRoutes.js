// routes/aiRoutes.js
import express from "express";
import { getAISuggestions } from "../controllers/aicontroller.js";

const router = express.Router();

router.post("/", getAISuggestions);

export default router;