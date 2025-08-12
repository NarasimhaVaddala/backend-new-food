import { Router } from "express";
import {
  getDeliveryBoys,
  approveOrRejectUser,
  getOrders,
  assignDeliveryBoy,
} from "../controllers/AdminControllers.js";
import { getUserDetails } from "../middlewares/AuthMiddleware.js";

const router = Router();

router.get(
  "/get-delivery-boys",

  // getUserDetails,

  getDeliveryBoys
);

router.put("/approve-or-reject/:id", approveOrRejectUser);

router.get("/get-orders", getOrders);

router.put("/assign-delivery-boy/:orderId/:delboyId", assignDeliveryBoy);

export default router;
