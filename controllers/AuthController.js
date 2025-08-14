import { TryCatch } from "../middlewares/error.js";
import UserModal from "../models/UserModal.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import axios from "axios";
import OtpModel from "../models/OtpModal.js";

export const onRegisterDelivery = TryCatch(async (req, res) => {
  console.log(req.files);

  const {
    name,
    email,
    mobile,
    role,
    password,
    housenumber,
    street,
    city,
    pincode,
    district,
  } = req.body;

  if (!name || !email || !mobile || !password) {
    return res.status(400).send({ message: "Please fill required fields" });
  }

  if (role == "delivery") {
    if (!req.files.aadhar || !req.files.license) {
      return res
        .status(400)
        .send({ message: "License and aadhar are required" });
    }
  }

  const address = {};

  if (housenumber) address.housenumber = housenumber;
  if (city) address.city = city;
  if (pincode) address.pincode = pincode;
  if (street) address.street = street;
  if (district) address.district = district;

  const body = { name, email, mobile, address };

  if (req.files.aadhar) body.aadhar = req.files.aadhar?.[0]?.path;
  if (req.files.license) body.license = req.files.license?.[0]?.path;

  console.log(body);

  if (role) {
    body.role = role;
  } else {
    body.role = "customer";
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  body.password = hash;

  const newUser = await UserModal.create(body);

  const token = await jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET);

  return res.status(200).send({ message: "Registered Success", token });
});
export const onRegisterCustomer = TryCatch(async (req, res) => {
  const {
    name,
    email,
    mobile,
    role,
    password,
    housenumber,
    street,
    city,
    pincode,
    district,
  } = req.body;

  if (!name || !email || !mobile || !password) {
    return res.status(400).send({ message: "Please fill required fields" });
  }

  const address = {};

  if (housenumber) address.housenumber = housenumber;
  if (city) address.city = city;
  if (pincode) address.pincode = pincode;
  if (street) address.street = street;
  if (district) address.district = district;

  const body = { name, email, mobile, address };

  body.role = "customer";

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  body.password = hash;

  const newUser = await UserModal.create(body);

  const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET);

  return res.status(200).send({ message: "Registered Success", token });
});

export const onLogin = TryCatch(async (req, res) => {
  const { mobile, password } = req.body;

  const user = await UserModal.findOne({ mobile });

  if (!user) return res.status(404).send({ message: "User Not Found" });

  const passCorrect = bcrypt.compareSync(password, user.password);

  if (!passCorrect)
    return res.status(400).send({ message: "Invalid Credentials" });

  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  return res
    .status(200)
    .send({ message: "Login Success", token, approved: user.approved });
});

export const getUserProfile = TryCatch(async (req, res) => {
  return res.status(200).send(req.user);
});

export const editProfile = TryCatch(async (req, res) => {
  const user = req.user;

  const { housenumber, street, city, pincode, name, email, mobile } = req.body;

  const body = {};
  const address = {};

  // if (housenumber) address.housenumber = housenumber;
  // if (street) address.street = street;
  // if (city) address.city = city;
  // if (pincode) address.pincode = pincode;

  if (name) body.name = name;
  if (email) body.email = email;
  if (mobile) body.mobile = mobile;

  // if (housenumber || street || city || pincode) {
  //   body.address = address;
  // }

  const updated = await UserModal.findByIdAndUpdate(user._id, {
    $set: body,
  });

  return res.status(200).send(updated);
});

// sending otp from registration
export const sendOtp = async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ message: "Mobile number is required" });
  }

  try {
    const otpExist = await OtpModel.findOne({ mobile: mobile });
    const user = await UserModal.findOne({ mobile });

    // let otp = Math.floor(100000 + Math.random() * 900000);
    let otp = "123456";

    const otpApiUrl = `https://2factor.in/API/V1/${process.env.OTP_API_KEY}/SMS/+91${mobile}/${otp}/OTP TEMPLATE`;
    try {
      // Send OTP using Axios GET request
      await axios.get(otpApiUrl);

      if (otpExist) {
        // Update the existing OTP document
        otpExist.otp = otp;
        await otpExist.save();
      } else {
        // Create a new OTP document
        const newOtp = new OtpModel({ mobile, otp });
        await newOtp.save();
      }

      return res.status(200).json({
        message: "OTP sent successfully!",
        name: user ? user.name : "user not found",
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
      return res.status(500).json({
        message: "Sending OTP failed due to an external server error",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("Error finding/updating OTP:", error);
    return res
      .status(500)
      .json({ message: "OTP send failed", error: error.message });
  }
};

export const onVerificationOtp = async (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile) {
    return res.status(400).json({ message: "Please send mobile number..!" });
  }
  if (!otp) {
    return res.status(400).json({ message: "Please send otp ..!" });
  }

  try {
    const existingOtpEntry = await OtpModel.findOne({ mobile });
    if (!existingOtpEntry) {
      return res.status(401).json({ message: "User not found in database" });
    }

    if (existingOtpEntry.otp.toString() !== otp.toString()) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    const user = await UserModal.findOne({ mobile });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User does not exist", mobile: mobile });
    }

    const payload = { _id: user._id, mobile };
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    return res.status(200).json({ token, message: "Verified" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server error during OTP verification",
      error: error.message,
    });
  }
};

export const userSignupUser = async (req, res) => {
  try {
    const { name, email, mobile } = req.body;

    // Check if user exists
    const existingUser = await UserModal.findOne({
      $or: [{ email }, { mobile }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email or mobile already exists" });
    }
    const newUser = await UserModal.create({ name, email, mobile });
    const payload = { _id: newUser._id, mobile };
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    return res
      .status(201)
      .json({ message: "User created successfully", user: newUser, token });
  } catch (err) {
    console.error("Signup Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const addAddress = TryCatch(async (req, res) => {
  const user = req.user;
  const { housenumber, street, city, pincode, state, lat, lng } = req.body;

  if (!housenumber || !street || !city || !pincode || !lat || !lng) {
    return res.status(400).send({ message: "Fill all fields" });
  }

  const userToUpdate = await UserModal.findById(user._id);

  const details = {
    housenumber,
    street,
    city,
    pincode,
    lat,
    lng,
  };

  if (state) details.state = state;
  userToUpdate.address.push(details);

  await userToUpdate.save();

  return res.status(200).send({ message: "Updated Success" });
});

export const editAddress = TryCatch(async (req, res) => {
  const user = req.user;
  const { housenumber, street, city, pincode, state, lat, lng } = req.body;
  const { id } = req.params;

  // Build update object
  const updateData = {};
  if (housenumber) updateData.housenumber = housenumber;
  if (street) updateData.street = street;
  if (city) updateData.city = city;
  if (pincode) updateData.pincode = pincode;
  if (state) updateData.state = state;
  if (lat !== undefined) updateData.lat = lat;
  if (lng !== undefined) updateData.lng = lng;

  // Find user and update specific address
  const updatedUser = await UserModal.findById(user._id);
  if (!updatedUser) {
    return res.status(404).send({ message: "User not found" });
  }

  const address = updatedUser.address.id(id);
  if (!address) {
    return res.status(404).send({ message: "Address not found" });
  }

  Object.assign(address, updateData);

  await updatedUser.save();

  return res.status(200).send({ message: "Address updated successfully" });
});

export const deleteAddress = TryCatch(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  const userToUpdate = await UserModal.findById(user._id);

  userToUpdate.address.pull({ _id: id });

  await userToUpdate.save();

  return res.status(200).send({ message: "Deleted Success" });
});
