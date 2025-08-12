import { TryCatch } from "../middlewares/error.js";
import OrderModal from "../models/OrderModal.js";

export const PlaceOrder = TryCatch(async (req, res) => {
  const user = req.user;
  const { items, totalPrice, paymentStatus, paymentMode } = req.body;

  if (!items || !totalPrice || !paymentStatus || !paymentMode) {
    return res.status(400).send("Please fill required fields");
  }

  console.log(items, totalPrice, paymentStatus, paymentMode);

  const newOrder = await OrderModal.create({
    totalPrice,
    paymentStatus,
    paymentMode,
    items,
    user: user._id,
  });

  return res.status(200).send(newOrder);
});

export const cancelOrder = TryCatch(async (req, res) => {
  const user = req.user;

  const { id } = req.params;

  if (user.role == "delivery") {
    return res.status(401).send({ message: "Unautorised" });
  }

  const order = await OrderModal.findById(id);

  if (!order) {
    return res.status(404).send({ message: "Order Not Found" });
  }

  if (user._id !== order.user) {
    return res.status(401).send({ message: "Unautorised" });
  }

  order.status = "cancelled";
  order.cancelReason = user.role;

  await order.save();

  return res.status(200).send({ message: "Order Cancelled" });
});
