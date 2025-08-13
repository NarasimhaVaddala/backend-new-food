import { Router } from "express";
import {
  onLogin,
  getUserProfile,
  onRegisterCustomer,
  onRegisterDelivery,
  editProfile,
  sendOtp,
  onVerificationOtp,
  userSignupUser,
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

router.post("/register", onRegisterCustomer);

router.post("/login", onLogin);

router.get("/profile", getUserDetails, getUserProfile);

router.put("/edit-profile", getUserDetails, editProfile);

router.post("/send-otp", sendOtp);
router.post("/verify-otp", onVerificationOtp);
router.post("/user-sign-up", userSignupUser);

export default router;
