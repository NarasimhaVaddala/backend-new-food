import { TryCatch } from "../middlewares/error.js";
import OrderModal from "../models/OrderModal.js";
import UserModal from "../models/UserModal.js";

export const getDeliveryBoys = TryCatch(async (req, res) => {
  //   const user = req.user;

  //   if (user.role !== "admin") {
  //     return res.status(401).send({ message: "Unauthorised" });
  //   }

  const { approved, search, isDelivering } = req.query;

  const query = { role: "delivery" };

  if (approved) query.approved = approved;
  if (isDelivering) query.isDelivering = isDelivering;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
    ];
  }

  const users = await UserModal.find(query);

  return res.status(200).send(users);
});

export const approveOrRejectUser = TryCatch(async (req, res) => {
  //   const user = req.user;
  //   if (user.role !== "admin") {
  //     return res.status(401).send({ message: "Unauthorised" });
  //   }
  const { id } = req.params;
  const { status } = req.body;

  const updateUser = await UserModal.findByIdAndUpdate(id, {
    $set: {
      approved: status,
    },
  });

  if (!updateUser) {
    return res.status(404).send({ message: "User Not Found" });
  }

  return res.status(200).send(updateUser);
});

export const getOrders = TryCatch(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const { search, status, paymentMode } = req.query;

  // Build the base match stage
  const matchStage = {
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  };

  if (status) matchStage.status = status;
  if (paymentMode) matchStage.paymentMode = paymentMode;

  // Handle assigned filter

  // Handle search (by user name or mobile)
  if (search) {
    // This requires lookup to access user fields
    const searchRegex = new RegExp(search.trim(), "i"); // case-insensitive

    return res.status(200).send(
      await OrderModal.aggregate([
        {
          $match: matchStage,
        },
        {
          $lookup: {
            from: "users", // Make sure this matches your User collection name
            localField: "user",
            foreignField: "_id",
            as: "userObj",
          },
        },
        {
          $unwind: {
            path: "$userObj",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            userMobileStr: { $toString: "$userObj.mobile" }, // in case mobile is number
          },
        },
        {
          $match: {
            $or: [
              { "userObj.name": { $regex: searchRegex } },
              { userMobileStr: { $regex: searchRegex } },
            ],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "partner",
            foreignField: "_id",
            as: "partnerObj",
          },
        },
        {
          $unwind: {
            path: "$partnerObj",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            userObj: 0, // clean up temp fields
            partnerObj: 0,
            userMobileStr: 0,
          },
        },
        {
          $set: {
            user: "$userObj",
            partner: "$partnerObj",
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ])
    );
  }

  // If no search, just use regular query with populate
  let query = OrderModal.find(matchStage)
    .populate("user")
    .populate("partner")
    .sort({ createdAt: -1 });

  const orders = await query;
  return res.status(200).send(orders);
});
export const assignDeliveryBoy = TryCatch(async (req, res) => {
  const { orderId, delboyId } = req.params;

  if (!orderId || !delboyId) {
    return res
      .status(400)
      .send({ message: "Order Id and Delivery Boy Id are required" });
  }

  const order = await OrderModal.findById(orderId);

  const delBoy = await UserModal.findById(delboyId);

  if (!order) {
    return res.status(404).send({ message: "Order Not Found" });
  }

  if (!delBoy) {
    return res.status(404).send({ message: "Delivery Boy Not Found" });
  }

  if (delBoy.isDelivering) {
    return res.status(400).send({ message: "This delivery Boy is busy" });
  }

  if (order.status == "accepted") {
    return res.status(400).send({ message: "This Order is already assigned" });
  }

  if (order.status == "cancelled" || order.status == "completed") {
    return res
      .status(400)
      .send({ message: "This Order is already completed or cancelled" });
  }

  order.partner = delBoy._id;
  delBoy.isDelivering = true;

  order.status = "accepted";

  await delBoy.save();
  await order.save();

  return res.status(200).send({ message: "Order Assigned" });
});
