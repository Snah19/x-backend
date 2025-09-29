import User from "../models/user.model.js";
import bcrypt from "bcryptjs"
import { generateTokenAndSetCookies } from "../lib/utils/generateToken.js";

export const signup = async (req, res) => {
  try {
    const { email, username, fullname, password } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      res.status(400).json({ message: "Email is already taken" });
      return;
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      res.status(400).json({ message: "Username is already taken" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters long" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullname,
      username,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      generateTokenAndSetCookies(newUser._id, res);
      await newUser.save();
      res.status(201).json({ 
        _id: newUser._id,
        fullname: newUser.fullname,
        username: newUser.username,
        email: newUser.email,
        followers: newUser.followers,
        following: newUser.following,
        profileImg: newUser.profileImg,
        coverImg: newUser.coverImg, 
      });
    }
    else {
      res.status(400).json({ error: "Invalid user data" });
    }
  }
  catch (error) {
    console.log("Error in signing up user");
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    const isPasswordMatched = await bcrypt.compare(password, user?.password || "");

    if (!user) {
      res.status(400).json({ message: `Cannot find username: ${username}` });
      return;
    }

    if (!isPasswordMatched) {
      res.status(400).json({ message: "Incorrect password" });
      return;
    }

    generateTokenAndSetCookies(user._id, res);

    res.status(200).json({ 
      _id: user._id,
      username: user.username,
      fullname: user.fullname,
      email: user.email,
      followers: user.followers,
      following: user.following,
      profileImg: user.profileImg,
      coverImg: user.coverImg,
    });
  }
  catch (error) {
    console.log("Error logging in user:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = async (_, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  }
  catch (error) {
    console.log("Error logging out user:", error.message);
    res.status(500).json({ message: "Internal Server Error" });    
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const { user: { _id } } = req;
    const currentUser = await User.findById(_id, { password: 0 });
    res.status(200).json(currentUser);
  }
  catch (error) {
    console.log("Error in getMe controller:", error.message);
    res.status(500).json({ message: "Internal Server Erorr" });
  }
};