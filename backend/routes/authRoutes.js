import { Router } from "express";
import { register, login, me } from "../controllers/authcontroller.js";
import { auth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", auth, me);
router.get("/profile", auth, me);

export default router;
