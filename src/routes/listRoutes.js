import express from "express";
import { authenticateToken } from "../middlewares/auth.js";
import {
  createList,
  deleteList,
  getListDetail,
  getListNames,
  getLists,
  updateList,
} from "../controllers/listController.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getLists);
router.get("/name", getListNames);
router.get("/detail", getListDetail);
router.post("/", createList);
router.patch("/:id", updateList);
router.delete("/:id", deleteList);

export default router;
