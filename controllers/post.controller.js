import { io } from "../server.js";

import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import Comment from "../models/comment.model.js";
import Notification from "../models/notification.model.js";

export const createPost = async (req, res) => {
  const { userId } = req.params;
  const { text, imgs } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!text && !imgs) {
      res.status(400).json({ message: "Post must have text or image" });
    }

    const newPost = new Post({
      user: userId,
      text,
      imgs
    });

    const { _id } = await newPost.save();

    io.emit("realtimePost", { userId, postId: _id });
    res.status(200).json(newPost);
  }
  catch (error) {
    console.log("Error creating post:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deletePost = async (req, res) => {
  const { userId } = req.body;
  const { postId } = req.params
  try {
    const post = await Post.findById(postId);
    
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    if (post.user.toString() !== userId) {
      res.status(401).json({ message: "You are not authorized to delete this post" });
      return;
    }

    const { _id } = await Post.findByIdAndDelete(postId);

    io.emit("realtimePost", { userId, postId: _id });
    res.status(200).json({ message: "Post deleted successfully" });
  }
  catch (error) {
    console.log("Error deleting post:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const likeUnlikePost = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;
  try {
    let post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const isLiked = post.likes.includes(userId);
    let updatedPost;
    
    if (!isLiked) {
      updatedPost = await Post.findOneAndUpdate({ _id: postId }, { $push: { likes: userId } }, { new: true });
      await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } }, { new: true });

      if (post.user.toString() !== userId.toString()) {
        const notification = new Notification({
          from: userId,
          to: post.user,
          post: post._id,
          type: "like",
        });

        await notification.save();
        io.emit("realtimeNotifications", { isNew: true });
      }

      res.status(200).json({ message: "Post liked successfully" });
    }
    else {
      updatedPost = await Post.findOneAndUpdate({ _id: postId }, { $pull: { likes: userId } }, { new: true });
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } }, { new: true });

      res.status(200).json({ message: "Post unliked successfully" });
    }

    io.emit("realtimePostLikes", { postId, totalLikes: updatedPost.likes.length });
  }
  catch (error) {
    console.log("Error liking/unliking post:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const favUnfavPost = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const isFav = post.favorites.includes(userId);
    let updatedPost;
    if (!isFav) {
      updatedPost = await Post.findOneAndUpdate({ _id: postId }, { $push: { favorites: userId } }, { new: true });
      await User.updateOne({ _id: userId }, { $push: { favoritePosts: postId } });

      if (post.user.toString() !== userId.toString()) {
        const notification = new Notification({
          from: userId,
          to: post.user,
          post: post._id,
          type: "favorite",
        });

        await notification.save();
        io.emit("realtimeNotifications", { isNew: true });
      }

      res.status(200).json({ message: "Post added to favorite successfully" });
    }
    else {
      updatedPost = await Post.findOneAndUpdate({ _id: postId }, { $pull: { favorites: userId } }, { new: true });
      await User.updateOne({ _id: userId }, { $pull: { favoritePosts: postId } });

      res.status(200).json({ message: "Post removed from favorite successfully" });
    }

    io.emit("realtimePostFavorites", { postId, totalFavorites: updatedPost.favorites.length });
  }
  catch (error) {
    console.log("Error adding/removing post to favorite:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const repostUnrepostPost = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;
  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const isReposted = post.reposts.includes(userId);
    let updatedPost;
    if (!isReposted) {
      updatedPost = await Post.findOneAndUpdate({ _id: postId }, { $push: { reposts: userId } }, { new: true });
      await User.updateOne({ _id: userId }, { $push: { repostedPosts: postId } });

      if (post.user.toString() !== userId.toString()) {
        const notification = new Notification({
          from: userId,
          to: post.user,
          post: post._id,
          type: "repost",
        });

        await notification.save();
        io.emit("realtimeNotifications", { isNew: true });
      }

      res.status(200).json({ message: "Post reposted successfully" });
    }
    else {
      updatedPost = await Post.findOneAndUpdate({ _id: postId }, { $pull: { reposts: userId } }, { new: true });
      await User.updateOne({ _id: userId }, { $pull: { repostedPosts: postId } });

      io.emit("realtimeNotifications", { isNew: true });
      res.status(200).json({ message: "Post unreposted successfully" });
    }

    io.emit("realtimePostReposts", { postId, totalReposts: updatedPost.reposts.length });
  }
  catch (error) {
    console.log("Error reposting/unreposting post:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getForYouFeed = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "user",
        select: "-password -profileImg.publicId -coverImg.publicId",
      });

    const total = await Post.countDocuments();
    const hasNextPage = page * limit < total;

    res.status(200).json({
      data: posts,
      nextPage: hasNextPage ? page + 1 : null,
    });
  }
  catch (error) {
    console.log("Error getting for you feed:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getFollowingPosts = async (req, res) => {
  const { userId } = req.params;

  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const posts = await Post.find({ user: { $in: user.following } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "user", select: "-password -profileImg.publicId -coverImg.publicId" });

    const total = await Post.countDocuments({ user: { $in: user.following } });
    const hasNextPage = page * limit < total;

    res.status(200).json({ data: posts, nextPage: hasNextPage ? page + 1 : null });
  }
  catch (error) {
    console.log("Error getting following posts", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserPosts = async (req, res) => {
  const { username } = req.params;
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findOne({ username });

    if (!user) {
      res.status(404).json({ message: "User not found" });
    }

    const posts = await Post.find({ user: user._id }).sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "user", select: "-password -profileImg.publicId -coverImg.publicId" });
    
    const total = await Post.countDocuments({ user: user._id });
    const hasNextPage = page * limit < total;

    res.status(200).json({ data: posts, nextPage: hasNextPage ? page + 1 : null });
  }
  catch (error) {
    console.log("Error getting user posts:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getPost = async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await Post.findOne({ _id: postId })
      .populate({ path: "user", select: "-password -profileImg.publicId -coverImg.publicId" });

    res.status(200).json(post);
  }
  catch (error) {
    console.log(`Error getting post: ${postId}:`, error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updatePostText = async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;

  try {
    const { _id } = await Post.findByIdAndUpdate(postId, { text });
    io.emit("realtimePost", { userId: null, postId: _id });
    res.status(200).json({ message: "Text updated successfully" });
  }
  catch (error) {
    console.log(`Error getting post: ${postId}:`, error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getPostStats = async (req, res) => {
  const { postId } = req.params;
  try {
    const { likes, reposts, favorites } = await Post.findById(postId);
    const comments = await Comment.countDocuments({ postId });

    res.status(200).json({ comments, likes: likes.length, reposts: reposts.length, favorites: favorites.length });
  }
  catch (error) {
    console.log(`Error getting post stats:`, error);
    res.status(200).json({ message: "Internal Server Error" });
  }
};