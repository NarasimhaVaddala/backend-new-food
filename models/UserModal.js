import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      unique: true,
    },

    aadhar: {
      type: String,
      default: null,
    },

    license: { type: String, default: null },

    role: {
      type: String,
      enum: ["customer", "admin", "delivery"],
      default: "customer",
    },

    approved: {
      type: Boolean,
      default: false,
    },

    address: {
      housenumber: {
        type: String,
      },

      street: {
        type: String,
      },

      city: {
        type: String,
      },

      pincode: {
        type: String,
      },
    },

    isDelivering: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const UserModal = mongoose.model("User", schema);
export default UserModal;
