import { Router } from "express";
import {
  onRegister,
  onLogin,
  getUserProfile,
} from "../controllers/AuthController.js";
import upload from "../lib/multer.js";
import { getUserDetails } from "../middlewares/AuthMiddleware.js";

const router = Router();

router.post(
  "/register",
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
  onRegister
);

router.post("/login", onLogin);

router.get("/profile", getUserDetails, getUserProfile);

export default router;
