import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
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

  state: {
    type: String,
  },
  landmark: {
    type: String,
  },
  primary: {
    type: Boolean,
    default: false,
  },

  lat: {
    type: Number,
  },

  lng: {
    type: Number,
  },
});

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
      // required: true,
    },
    mobile: {
      type: String,
      unique: true,
      required: true,
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
      type: [addressSchema],
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
