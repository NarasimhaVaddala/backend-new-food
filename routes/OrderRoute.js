import { Router } from "express";
import { PlaceOrder, cancelOrder } from "../controllers/OrderController.js";
import { getUserDetails } from "../middlewares/AuthMiddleware.js";
const router = Router();

router.post("/place-order", getUserDetails, PlaceOrder);

router.post("/cancel-order/:id", getUserDetails, cancelOrder);

export default router;
