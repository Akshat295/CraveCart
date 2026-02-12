import express from "express";
import {
  placeOrder,
  verifyPayment,
  getUserOrders,
  listUserOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { authMiddleware } from "../middleware/auth.js";

const orderRouter = express.Router();

orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/verify", authMiddleware, verifyPayment);
orderRouter.get("/user", authMiddleware, getUserOrders);
orderRouter.get("/list", listUserOrders);
orderRouter.patch("/status", updateOrderStatus);

export default orderRouter;
