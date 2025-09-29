import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ error: "Unauthorized: Invalid Token" });
    }

    const user = await User.findById(decoded.userId, { password: 0 });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    req.user = user; // attach user object to request
    next();
  } catch (error) {
    console.log("Error in authenticate middleware:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};