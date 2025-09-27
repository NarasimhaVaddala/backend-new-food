import mongoose, { Schema, model } from "mongoose";

const schema = new Schema({
  orderId: {
    type: String,
    requried: true,
  },

  amount: {
    type: Number,
    required: true,
  },

  paymentId: {
    type: String,
    default: null,
  },

  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },

  order: {
    type: mongoose.Types.ObjectId,
    ref: "order",
  },
});

const TransactionModal = model("transactions", schema);

export default TransactionModal;
