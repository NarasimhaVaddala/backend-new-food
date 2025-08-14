import { TryCatch } from "../middlewares/error.js";
import OrderModal from "../models/OrderModal.js";
import { io, adminId, connectedUsers } from "../app.js";
import { ThrowInternalError } from "../lib/ThrowInternalError.js";
import UserModal from "../models/UserModal.js";
import { getSocketIdByUserId } from "../utils/socketUtils.js";

export const PlaceOrder = TryCatch(async (req, res) => {
  const user = req.user;
  const { items, totalPrice, paymentStatus, paymentMode, selectedAddress } =
    req.body;

  console.log(selectedAddress);

  if (!items || !totalPrice || !paymentStatus || !paymentMode) {
    return res.status(400).send("Please fill required fields");
  }

  if (!selectedAddress) {
    return res.status(400).send("Please Select Address");
  }

  // console.log(items, totalPrice, paymentStatus, paymentMode);

  const usr = await UserModal.findById(user._id);

  const addr = usr.address.find(
    (e) => e._id?.toString() === selectedAddress?.toString()
  );

  const newOrder = await OrderModal.create({
    totalPrice,
    paymentStatus,
    paymentMode,
    items,
    user: user._id,
    address: addr,
  });

  try {
    console.log("Sendoinf order to admin", adminId);
    io.to(adminId).emit("new-order", newOrder);
    console.log("Sendoinf order to admin");
  } catch (error) {
    console.log("Failed to send Order to admin");
  }

  return res.status(200).send(newOrder);
});

export const cancelOrder = TryCatch(async (req, res) => {
  console.log("API HITa");

  const user = req.user;

  const { id } = req.params;

  if (user.role == "delivery") {
    return res.status(401).send({ message: "Unautorised" });
  }

  const order = await OrderModal.findById(id);

  if (!order) {
    return res.status(404).send({ message: "Order Not Found" });
  }

  if (user._id?.toString() !== order.user?.toString()) {
    return res.status(401).send({ message: "Unautorised" });
  }

  if (order.partner) {
    const partner = await UserModal.findById(order.partner);
    partner.isDelivering = false;
    await partner.save();

    try {
      const socketid = getSocketIdByUserId(connectedUsers, partner._id);
      console.log(socketid, "DELIVERY BOY SOCKET IT");
      io.to(socketid).emit("cancel-order", order);
    } catch (error) {
      console.log("Failed to send cancel to Delivery Boy");
    }
  }

  order.status = "cancelled";
  order.cancelReason = user.role;

  await order.save();

  try {
    console.log("Sendoinf order to admin", adminId);
    io.to(adminId).emit("cancel-order", order);
    console.log("Sending  cacncel order to admin");
  } catch (error) {
    console.log("Failed to send cencel to admin");
  }

  return res.status(200).send({ message: "Order Cancelled" });
});

export const getAllOrders = TryCatch(async (req, res) => {
  try {
    const user = req.user;
    const orders = await OrderModal.find({ user: user._id });

    return res.status(200).send(orders);
  } catch (error) {
    ThrowInternalError(errpr);
  }
});
