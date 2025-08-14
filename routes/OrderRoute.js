import { Router } from "express";
import {
  PlaceOrder,
  cancelOrder,
  getAllOrders,
} from "../controllers/OrderController.js";
import { getUserDetails } from "../middlewares/AuthMiddleware.js";
const router = Router();

router.post("/place-order", getUserDetails, PlaceOrder);

router.put("/cancel-order/:id", getUserDetails, cancelOrder);

router.get("/all-orders", getUserDetails, getAllOrders);

export default router;
