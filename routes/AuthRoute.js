import { Router } from "express";
import {
  onLogin,
  getUserProfile,
  onRegisterCustomer,
  onRegisterDelivery,
  editProfile,
} from "../controllers/AuthController.js";
import upload from "../lib/multer.js";
import { getUserDetails } from "../middlewares/AuthMiddleware.js";

const router = Router();

router.post(
  "/register-delivery",
  upload.fields([
    {
      name: "aadhar",
      maxCount: 1,
    },
    {
      name: "license",
      maxCount: 1,
    },
  ]),
  onRegisterDelivery
);

router.post(
  "/register",

  onRegisterCustomer
);

router.post("/login", onLogin);

router.get("/profile", getUserDetails, getUserProfile);

router.put("/edit-profile", getUserDetails, editProfile);

export default router;
