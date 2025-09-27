import { Router } from "express";
import { getUserDetails } from "../middlewares/AuthMiddleware.js";
import {
  getAllOrders,
  completeOrder,
} from "../controllers/DeliveryController.js";

const router = Router();

router.get("/all-orders", getUserDetails, getAllOrders);

router.post("/complete-order/:id", getUserDetails, completeOrder);

export default router;
