import { Router } from "express";
import { auth } from "../middleware/authMiddleware.js";
import {
  listSpaces,
  getSpaceTables,
  createSpace,
  createTable,
} from "../controllers/spaceController.js";

const router = Router();

router.post("/", auth, createSpace); // create new study space
router.post("/:spaceId/tables", auth, createTable); //create table in a study space
router.get("/", auth, listSpaces);
router.get("/:spaceId/tables", auth, getSpaceTables);

export default router;
