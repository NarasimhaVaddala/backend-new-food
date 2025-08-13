import { TryCatch } from "../middlewares/error.js";
import OrderModal from "../models/OrderModal.js";

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
