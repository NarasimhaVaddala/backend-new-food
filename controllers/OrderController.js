import { TryCatch } from "../middlewares/error.js";
import OrderModal from "../models/OrderModal.js";
import { io, adminId, connectedUsers } from "../app.js";
import { ThrowInternalError } from "../lib/ThrowInternalError.js";
import UserModal from "../models/UserModal.js";
import { getSocketIdByUserId } from "../utils/socketUtils.js";
import Razorpay from "razorpay";
import TransactionModal from "../models/TransactionModal.js";
import { createHmac } from "crypto";
import { envMode } from "../app.js";

// const key_id =
//   process.env.NODE_ENV === "development"
//     ? process.env.RZP_KEY_ID_DEV
//     : process.env.RZP_KEY_ID;

// const key_secret =
//   process.env.NODE_ENV === "development"
//     ? process.env.RZP_SECRET_DEV
//     : process.env.RZP_SECRET;

// const razorpay = new Razorpay({
//   key_id,
//   key_secret,
// });

const getRazorpayCredentials = () => {
  const key_id =
    envMode === "DEVELOPMENT"
      ? process.env.RZP_KEY_ID_DEV
      : process.env.RZP_KEY_ID;

  const key_secret =
    envMode === "DEVELOPMENT"
      ? process.env.RZP_SECRET_DEV
      : process.env.RZP_SECRET;

  return { key_id, key_secret };
};

// Function to create Razorpay instance
const createRazorpayInstance = () => {
  const { key_id, key_secret } = getRazorpayCredentials();

  console.log(key_id, key_secret);

  if (!key_id || !key_secret) {
    console.error("Razorpay credentials missing:", {
      key_id: !!key_id,
      key_secret: !!key_secret,
      NODE_ENV: process.env.NODE_ENV,
    });
    throw new Error("Razorpay credentials are not properly configured");
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};

export const PlaceOrder = TryCatch(async (req, res) => {
  const user = req.user;
  const { items, totalPrice, paymentStatus, paymentMode, selectedAddress } =
    req.body;

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

  if (!addr) {
    return res.status(404).send({ message: "Address Not Found" });
  }

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

export const createRazorpayOrder = TryCatch(async (req, res) => {
  const user = req.user;

  const { amount } = req.body;
  if (!amount)
    return res.status(400).send({ message: "Order Amount is required" });

  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
    payment_capture: 1,
  };

  const razorpay = await createRazorpayInstance();

  const order = await razorpay.orders.create(options);

  await TransactionModal.create({
    orderId: order.id,
    amount: amount,
    user: user._id,
  });

  return res.status(200).send({ orderId: order.id });
});

export const verifyPayment = async (req, res) => {
  const { key_secret } = getRazorpayCredentials();
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    console.log(razorpay_order_id);
    console.log(razorpay_payment_id);
    console.log(razorpay_signature);

    const hmac = createHmac("sha256", key_secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    const paymentData = await TransactionModal.findOne({
      orderId: razorpay_order_id,
    });

    if (generatedSignature === razorpay_signature) {
      if (paymentData) {
        paymentData.paymentId = razorpay_payment_id;
        await paymentData.save();
      }
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: "Failed To process payment" });
  }
};
