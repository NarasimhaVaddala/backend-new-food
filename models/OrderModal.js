import { Schema, Types, model } from "mongoose";

const item = new Schema({
  name: {
    type: String,
    required: true,
  },

  main_ingredient: {
    type: String,
  },

  description: {
    type: String,
  },
  type: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  images: {
    type: Array,
    default: [],
  },

  qty: {
    type: Number,
    default: 1,
  },
});

const schema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
    },

    partner: {
      type: Types.ObjectId,
      ref: "User",
      default: null,
    },

    items: [item],

    totalPrice: {
      type: Number,
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },

    paymentMode: {
      type: String,
      enum: ["cash", "upi"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "completed", "cancelled"],
      default: "pending",
    },

    coordinates: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
    },

    cancelReason: {
      type: String,
      enum: ["delivery", "customer", "admin"],
      default: null,
    },

    completedImage: {
      type: String,
      default: null,
    },
    address: {
      type: {
        housenumber: { type: String, default: null },
        city: { type: String, default: null },
        pincode: { type: String, default: null },
        street: { type: String, default: null },
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },
  },
  {
    timestamps: true,
  }
);

const OrderModal = model("order", schema);

export default OrderModal;
