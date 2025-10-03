import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

export const getUserProfile = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username }, { password: 0 });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  }
  catch (error) {
    console.log("Error getting user profile:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getSuggestedUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { following } = await User.findById(userId, { _id: 0, following: 1 });

    let users = await User.aggregate([{$sample: { size: 11 }}]);
    users = users.filter(user => user._id.toString() !== userId);

    const filteredUsers = users.filter(user => !following.includes(user._id));
    const suggestedUsers = filteredUsers.slice(0, 4);
    suggestedUsers.forEach(user => user.password = null);
    
    res.status(200).json(suggestedUsers);
  }
  catch (error) {
    console.log("Error getting suggested users:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const followUnfollowUser = async (req, res) => {
  const { username } = req.params;
  const { userId } = req.body;
  try {
    const targetUser = await User.findOne({ username });
    const currentUser = await User.findById(userId);

    if (targetUser?._id.toString() === currentUser._id.toString()) {
      res.status(400).json({ message: "You can't follow yourself" });
      return;
    }

    if (!targetUser || !currentUser) {
      res.status(400).json({ message: "User not found" });
      return;
    }

    const isFollowing = currentUser.following.includes(targetUser?._id.toString());

    if (isFollowing) {
      // Unfollow the user
      await User.findByIdAndUpdate(targetUser?._id,  { $pull: { followers: currentUser?._id } });
      await User.findByIdAndUpdate(currentUser?._id, { $pull: { following: targetUser?._id } });

      res.status(200).json({ message: "User unfollowed successfully" });
    }
    else {
      // Follow the user
      await User.findByIdAndUpdate(targetUser?._id, { $push: { followers: currentUser?._id } });
      await User.findByIdAndUpdate(currentUser?._id, { $push: { following: targetUser?._id } });

      // Send notification to the user
      const newNotification = new Notification({
        type: "follow",
        from: currentUser?._id,
        to: targetUser?._id,
      });

      await newNotification.save();

      res.status(200).json({ message: "User followed successfully" });
    }

  }
  catch (error) {
    console.log("Erorr follow/unfollow user", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  const { userId } = req.params;
  const { username, fullname, email, link, bio, currentPassword, newPassword, profileImg, coverImg } = req.body;
  try {
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if username is taken
    if (username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ message: `Username: ${username} is unavailable` });
      }
    }

    // Check if email is taken
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ message: `Email: ${email} is unavailable` });
      }
    }

    // Handle password update
    if ((currentPassword && !newPassword) || (newPassword && !currentPassword)) {
      return res.status(400).json({ message: "Please provide both current password and new password" });
    }

    if (currentPassword && newPassword) {
      const isMatched = await bcrypt.compare(currentPassword, user.password);
      if (!isMatched) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    // Build update fields dynamically
    const updateFields = {};
    if (username) updateFields.username = username;
    if (fullname) updateFields.fullname = fullname;
    if (email) updateFields.email = email;
    if (link) updateFields.link = link;
    if (bio) updateFields.bio = bio;
    if (profileImg) updateFields.profileImg = profileImg;
    if (coverImg) updateFields.coverImg = coverImg;

    // Apply updates
    Object.assign(user, updateFields);
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating profile:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getLikedPosts = async (req, res) => {
  const { username } = req.params;
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findOne({ username });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const posts = await Post.find({ _id: { $in: user.likedPosts } })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "user", select: "-password -profileImg.publicId -coverImg.publicId" });

    const total = await Post.countDocuments({ _id: { $in: user.likedPosts } });
    const hasNextPage = page * limit < total;

    res.status(200).json({ data: posts, nextPage: hasNextPage ? page + 1 : null });
  }
  catch (error) {
    console.log("Error getting liked posts:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getFavoritePosts = async (req, res) => {
  const { username } = req.params;
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findOne({ username });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const posts = await Post.find({ _id: { $in: user.favoritePosts } })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "user", select: "-password -profileImg.publicId -coverImg.publicId" });

    const total = await Post.countDocuments({ _id: { $in: user.favoritePosts } });
    const hasNextPage = page * limit < total;

    res.status(200).json({ data: posts, nextPage: hasNextPage ? page + 1 : null });
  }
  catch (error) {
    console.log("Error getting favorite posts:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getRepostedPosts = async (req, res) => {
  const { username } = req.params;
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findOne({ username });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;      
    }

    const posts = await Post.find({ _id: { $in: user.repostedPosts } })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "user", select: "-password -profileImg.publicId -coverImg.publicId" });

    const total = await Post.countDocuments({ _id: { $in: user.repostedPosts } });
    const hasNextPage = page * limit < total;

    res.status(200).json({ data: posts, nextPage: hasNextPage ? page + 1 : null });
  }
  catch (error) {
    console.log("Error getting favorite posts:", error.message);
    res.status(500).json({ message: "Internal Server Error" });   
  }
};