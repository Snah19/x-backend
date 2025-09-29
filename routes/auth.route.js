import express from "express";
import { getCurrentUser, login, logout, signup } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.get("/current-user", authenticate, getCurrentUser);
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);


export default router;