import express from "express";
import {
  placeOrder,
  verifyPayment,
  getUserOrders,
} from "../controllers/orderController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/place", authMiddleware, placeOrder);
router.post("/verify", authMiddleware, verifyPayment);
router.get("/user", authMiddleware, getUserOrders);

export default router;
