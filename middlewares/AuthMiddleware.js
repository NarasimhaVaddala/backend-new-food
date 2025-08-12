import UserModal from "../models/UserModal.js";
import { TryCatch } from "./error.js";
import jwt from "jsonwebtoken";

export const getUserDetails = TryCatch(async (req, res, next) => {
  const Bearertoken = req.headers.authorization;

  console.log(Bearertoken);

  if (!Bearertoken) {
    return res.status(400).send({ message: "Please Login to continue" });
  }

  if (!Bearertoken.startsWith("Bearer")) {
    return res.status(400).send({ message: "Invalid JWT Token" });
  }

  const token = Bearertoken?.split(" ")[1];
  const { _id } = await jwt.verify(token, process.env.JWT_SECRET);
  if (!_id) {
    return res.status(400).send({ message: "Invalid JWT Token" });
  }

  const user = await UserModal.findById(_id).select("-password");

  if (!user) {
    return res.status(400).send({ message: "User Not Found" });
  }

  req.user = user;
  next();
});
