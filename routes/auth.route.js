import express from "express";
import { getSessionUser, signup } from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/session-user/:username", getSessionUser);
router.post("/signup", signup);


export default router;