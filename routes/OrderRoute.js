import { Router } from "express";
import {
  PlaceOrder,
  cancelOrder,
  createRazorpayOrder,
  getAllOrders,
  verifyPayment,
} from "../controllers/OrderController.js";
import { getUserDetails } from "../middlewares/AuthMiddleware.js";
const router = Router();

router.post("/place-order", getUserDetails, PlaceOrder);
router.put("/cancel-order/:id", getUserDetails, cancelOrder);
router.get("/all-orders", getUserDetails, getAllOrders);

// RAZORPAY PAYMENT THINGS (Creating Payment and verifying payment)
router.post("/create-order", getUserDetails, createRazorpayOrder);
router.post("/verify-payment", getUserDetails, verifyPayment);

export default router;
