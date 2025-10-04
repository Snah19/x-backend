import Comment from "../models/comment.model.js";
import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import { io } from "../server.js";

export const commentOnPost = async (req, res) => {
  const { postId } = req.params;
  const { userId, content } = req.body;

  try {
    const post = await Post.findById(postId);
    const newComment = await Comment.create({ postId, from: userId, content});

    if (newComment?._id) {
      await Notification.create({ from: userId, to: post.user, post: postId, type: "comment", comment: { type: "comment", content } });
    }

    io.emit("realtimeNotifications", { isNew: true });
    res.status(201).json(newComment);
  }
  catch (error) {
    console.log("Error commenting on post:", error.message);
    res.json(500).json({ message: "Internal Server Error" });
  }
};

export const getComments = async (req, res) => {
  const { postId } = req.params;
  try {
    const comments = await Comment.find({ postId, to: null })
      .populate({ path: "from", select: "username profileImg.url" })
      .sort({ createdAt: -1 });

    
    res.status(200).json(comments);
  }
  catch (error) {
    console.log("Error getting comments:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const likeUnlikeComment = async (req, res) => {
  const { commentId } = req.params;
  const { userId } = req.body;
  try {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    const isLiked = comment.likes.includes(userId);

    if (!isLiked) {
      await Comment.findByIdAndUpdate(commentId, { $push: { likes: userId } }, { new: true });

      if (userId.toString() !== comment.from.toString()) {
        await Notification.create({ from: userId, to: comment.from, post: comment.postId, comment: { _id: comment._id, type: "like" }, type: "comment", });
      }

      io.emit("realtimeNotifications", { isNew: true });
      res.status(200).json({ message: "Comment liked successfully" });
    }
    else {
      await Comment.findByIdAndUpdate(commentId, { $pull: { likes: userId } }, { new: true });
      res.status(200).json({ message: "Comment unliked successfully" });
    }

  }
  catch (error) {
    console.log("Error liking/unliking comment");
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const replyComment = async (req, res) => {
  const { commentId } = req.params;
  const { userId, content } = req.body;

  try {
    const comment = await Comment.findById(commentId);
    const newReply = await Comment.create({ from: userId, to: commentId, postId: comment.postId, content });

    if (newReply) {
      await Notification.create({ from: userId, to: comment.from, post: comment.postId, type: "comment", comment: { type: "reply", content } });
    }

    io.emit("realtimeNotifications", { isNew: true });
    res.status(201).json(newReply);
  }
  catch (error) {
    console.log("Error replying comment:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getReplies = async (req, res) => {
  const { commentId } = req.params;

  try {
    const replies = await Comment.find({ to: commentId })
      .populate({ path: "from", select: "username profileImg.url" })
      .sort({ createdAt: -1 });
    res.status(200).json(replies);
  }
  catch (error) {
    console.log("Error getting replies");
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTotalComments = async (req, res) => {
  const { postId } = req.params;

  try {
    const totalComments = await Comment.countDocuments({ postId });

    res.status(200).json(totalComments);
  } catch (error) {
    console.error("Error getting total comments:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteComments = async (req, res) => {
  const { postId } = req.params;

  try {
    await Comment.deleteMany({ postId });
    res.status(200).json({ message: "Comments deleted successfully" });
  }
  catch (error) {
    console.log("Error deleting comments:", error.message);
  }
}