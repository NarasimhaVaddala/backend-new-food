import { TryCatch } from "../middlewares/error.js";
import OrderModal from "../models/OrderModal.js";
import UserModal from "../models/UserModal.js";

export const getAllOrders = TryCatch(async (req, res) => {
  const user = req.user;

  const { status } = req.query;

  const query = {
    partner: user._id,
  };

  if (status) query.status = status;

  const orders = await OrderModal.find(query).populate("user");

  return res.status(200).send(orders);
});

export const completeOrder = TryCatch(async (req, res) => {
  const user = req.user;

  const { id } = req.params;

  if (user.role === "customer") {
    return res.status(401).send({ message: "Unauthorised" });
  }

  const order = await OrderModal.findById(id);

  if (!order) {
    return res.status(404).send({ message: "Order Not Found" });
  }

  const deliveryBoy = await UserModal.findById(user._id);

  if (order.partner?.toString() !== deliveryBoy._id?.toString()) {
    return res.status(401).send({ message: "Unauthorised" });
  }

  order.paymentStatus = "completed";
  order.status = "completed";

  await order.save();

  deliveryBoy.isDelivering = false;

  await deliveryBoy.save();

  return res.status(200).send({ message: "Order Completed" });
});
