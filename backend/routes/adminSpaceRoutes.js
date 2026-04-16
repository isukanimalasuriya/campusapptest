import { Router } from "express";
import { auth } from "../middleware/authMiddleware.js";
import {
  createSpace,
  createTable,
  listSpaces,
  getSpaceTables,
  deleteSpace,
} from "../controllers/spaceController.js";

const router = Router();

const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

router.use(auth, isAdmin);

router.get("/spaces", listSpaces);
router.post("/spaces", createSpace);
router.get("/spaces/:spaceId/tables", getSpaceTables);
router.post("/spaces/:spaceId/tables", createTable);
router.delete("/spaces/:spaceId", deleteSpace);

export default router;
