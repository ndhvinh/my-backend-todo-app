import express from "express";
import { authenticateToken } from "../middlewares/auth.js";
import {
  googleLogin,
  login,
  me,
  register,
  resendCode,
  verifyEmail,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/resend-code", resendCode);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/me", authenticateToken, me);

export default router;
