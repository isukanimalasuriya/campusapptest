import { Router } from "express";
import { auth } from "../middleware/authMiddleware.js";
import {
  getMyActiveBooking,
  createBooking,
  checkout,
} from "../controllers/bookingController.js";

const router = Router();

router.get("/active", auth, getMyActiveBooking);
router.post("/", auth, createBooking);
router.post("/checkout", auth, checkout);

export default router;
