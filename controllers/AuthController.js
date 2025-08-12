import { TryCatch } from "../middlewares/error.js";
import UserModal from "../models/UserModal.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const onRegister = TryCatch(async (req, res) => {
  console.log(req.files);

  const { name, email, mobile, role, password } = req.body;

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

  const body = { name, email, mobile };

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

export const onLogin = TryCatch(async (req, res) => {
  const { mobile, password } = req.body;

  const user = await UserModal.findOne({ mobile });

  if (!user) return res.status(404).send({ message: "User Not Found" });

  const passCorrect = bcrypt.compareSync(password, user.password);

  if (!passCorrect)
    return res.status(400).send({ message: "Invalid Credentials" });

  const token = await jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  console.log(user);

  return res
    .status(200)
    .send({ message: "Login Success", token, approved: user.approved });
});

export const getUserProfile = TryCatch(async (req, res) => {
  return res.status(200).send(req.user);
});
