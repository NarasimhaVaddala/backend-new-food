import { Router } from "express";
import {
  getDeliveryBoys,
  approveOrRejectUser,
  getOrders,
  assignDeliveryBoy,
  getAnalytics,
  getContacts,
} from "../controllers/AdminControllers.js";

const router = Router();

router.get(
  "/get-delivery-boys",

  // getUserDetails,

  getDeliveryBoys
);

router.put("/approve-or-reject/:id", approveOrRejectUser);

router.get("/get-orders", getOrders);
router.get("/analytics", getAnalytics);

router.put("/assign-delivery-boy/:orderId/:delboyId", assignDeliveryBoy);

router.get("/contacts", getContacts);

export default router;
