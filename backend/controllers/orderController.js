import orderModel from "../models/OrderModel.js";
import userModel from "../models/UserModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import {
  sendOrderConfirmationEmail,
  sendDeliveryConfirmationEmail,
} from "../utils/emailService.js";

dotenv.config();

if (!process.env.TEST_KEY_ID || !process.env.TEST_KEY_SECRET) {
  console.error(
    "[Razorpay] TEST_KEY_ID or TEST_KEY_SECRET is missing. Check your .env file."
  );
}

const razorpayInstance = new Razorpay({
  key_id: process.env.TEST_KEY_ID,
  key_secret: process.env.TEST_KEY_SECRET,
});

// ================= PLACE ORDER =================
const placeOrder = async (req, res) => {
  try {
    console.log("[Order] placeOrder called");
    const userId = req.user?.userId;
    const { items, amount, address } = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No items provided" });
    }

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid amount" });
    }

    if (!address) {
      return res
        .status(400)
        .json({ success: false, message: "Address is required" });
    }

    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
      payment: false,
    });
    console.log("[Order] Creating new order", {
      userId,
      amount,
      itemCount: items.length,
    });

    await newOrder.save();
    console.log("[Order] Order saved in DB", { orderId: newOrder._id });

    // Clear cart
    await userModel.findByIdAndUpdate(userId, { cartData: {} });
    console.log("[Order] Cleared cart for user", { userId });

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency: "INR",
      receipt: newOrder._id.toString(),
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);
    console.log("[Razorpay] Order created", {
      razorpayOrderId: razorpayOrder.id,
      localOrderId: newOrder._id,
    });

    res.json({
      success: true,
      razorpayOrder,
      orderId: newOrder._id,
      keyId: process.env.TEST_KEY_ID,
      order: newOrder,
    });
  } catch (error) {
    console.error("[Order] placeOrder error", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= VERIFY PAYMENT =================
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;
    console.log("[Payment] verifyPayment called", {
      razorpay_order_id,
      razorpay_payment_id,
      orderId,
    });

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.TEST_KEY_SECRET)
      .update(body)
      .digest("hex");
    const signatureMatches = expectedSignature === razorpay_signature;

    if (!signatureMatches) {
      console.warn("[Payment] Invalid signature for order", {
        orderId,
        razorpay_order_id,
        razorpay_payment_id,
      });
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      {
        payment: true,
      },
      { new: true }
    );

    if (!updatedOrder) {
      console.error("[Payment] Order not found while updating payment", {
        orderId,
      });
      return res.status(404).json({
        success: false,
        message: "Order not found while updating payment status",
      });
    }

    console.log("[Payment] Payment verified and order updated", {
      orderId: updatedOrder._id,
      paymentStatus: updatedOrder.payment,
    });

    // Send order confirmation email
    try {
      let userEmail = null;
      let userName = "";

      if (updatedOrder.userId) {
        const user = await userModel.findById(updatedOrder.userId);
        if (user) {
          userEmail = user.email; 
          userName = user.name || updatedOrder.address?.firstName || "";
        }
      }

      // Fallback to address email only if UserModel lookup fails
      if (!userEmail) {
        userEmail = updatedOrder.address?.email;
        userName = updatedOrder.address?.firstName || "";
      }

      if (userEmail) {
        console.log("[Payment] Sending order confirmation email to:", userEmail);
        await sendOrderConfirmationEmail(updatedOrder, userEmail, userName);
      } else {
        console.warn("[Payment] No email found for order confirmation", {
          orderId: updatedOrder._id,
          userId: updatedOrder.userId,
        });
      }
    } catch (emailError) {
      // Don't fail the payment verification if email fails
      console.error("[Payment] Failed to send order confirmation email", emailError);
    }

    res.json({
      success: true,
      message: "Payment verified",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("[Payment] verifyPayment error", error);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};

// ================= GET USER ORDERS =================
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const orders = await orderModel
      .find({ userId })
      .sort({ date: -1 })
      .lean();

    console.log("[Order] Fetched orders for user", {
      userId,
      count: orders.length,
    });

    res.json({ success: true, orders });
  } catch (error) {
    console.error("[Order] getUserOrders error", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch user orders" });
  }
};

// ================= LIST ALL ORDERS (ADMIN) =================
const listUserOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}).sort({ date: -1 }).lean();

    console.log("[Admin] listUserOrders - total orders:", orders.length);

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("[Admin] listUserOrders error", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch orders" });
  }
};

// ================= UPDATE ORDER STATUS (ADMIN) =================
const ORDER_STATUSES = ["Food Processing", "Out for delivery", "Delivered"];

const updateOrderStatus = async (req, res) => {
  try {
    console.log("[Admin] updateOrderStatus called", {
      body: req.body,
      method: req.method,
      path: req.path,
    });
    const { orderId, status } = req.body;

    if (!orderId) {
      console.warn("[Admin] Missing orderId in request");
      return res
        .status(400)
        .json({ success: false, message: "Order ID is required" });
    }

    if (!status || !ORDER_STATUSES.includes(status)) {
      console.warn("[Admin] Invalid status", { status, validStatuses: ORDER_STATUSES });
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${ORDER_STATUSES.join(", ")}`,
      });
    }

    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    console.log("[Admin] Order status updated", {
      orderId: updatedOrder._id,
      status: updatedOrder.status,
    });

    // Send delivery confirmation email if status is "Delivered"
    if (updatedOrder.status === "Delivered") {
      try {
        // Always use logged-in user's email from UserModel (not form address email)
        let userEmail = null;
        let userName = "";

        if (updatedOrder.userId) {
          const user = await userModel.findById(updatedOrder.userId);
          if (user) {
            userEmail = user.email; // Use authenticated user's email
            userName = user.name || updatedOrder.address?.firstName || "";
          }
        }

        // Fallback to address email only if UserModel lookup fails
        if (!userEmail) {
          userEmail = updatedOrder.address?.email;
          userName = updatedOrder.address?.firstName || "";
        }

        if (userEmail) {
          console.log("[Admin] Sending delivery confirmation email to:", userEmail);
          await sendDeliveryConfirmationEmail(updatedOrder, userEmail, userName);
        } else {
          console.warn("[Admin] No email found for delivery confirmation", {
            orderId: updatedOrder._id,
            userId: updatedOrder.userId,
          });
        }
      } catch (emailError) {
        // Don't fail the status update if email fails
        console.error("[Admin] Failed to send delivery confirmation email", emailError);
      }
    }

    res.json({
      success: true,
      message: "Status updated",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("[Admin] updateOrderStatus error", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

export { placeOrder, verifyPayment, getUserOrders, listUserOrders, updateOrderStatus };
