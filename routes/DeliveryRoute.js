import { Router } from "express";
import { getUserDetails } from "../middlewares/AuthMiddleware.js";
import { getAllOrders } from "../controllers/DeliveryController.js";

const router = Router();

router.get("/all-orders", getUserDetails, getAllOrders);

export default router;
