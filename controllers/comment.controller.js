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
    const totalComments = await Comment.countDocuments({ postId });

    if (newComment?._id) {
      await Notification.create({ from: userId, to: post.user, post: postId, type: "comment", comment: { type: "comment", content } });
    }

    io.emit("realtimeNotifications", { isNew: true });
    io.emit("realtimePostStats", { postId });
    io.emit("realtimeTotalComments", { postId, totalComments });
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
    let comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const isLiked = comment.likes.includes(userId);

    let updatedComment;

    if (!isLiked) {
      updatedComment = await Comment.findByIdAndUpdate(commentId, { $push: { likes: userId } }, { new: true });

      if (userId !== comment.from.toString()) {
        await Notification.create({ from: userId, to: comment.from, post: comment.postId, comment: { _id: comment._id }, type: "comment" });
      }

      io.emit("realtimeNotifications", { isNew: true });
      io.emit("realtimeComment", { postId: comment.postId });

      res.status(200).json({ message: "Comment liked successfully" });
    }
    else {
      updatedComment = await Comment.findByIdAndUpdate(commentId, { $pull: { likes: userId } }, { new: true });
      res.status(200).json({ message: "Comment unliked successfully" });
    }

    // Emit updated like count to all clients
    io.emit("realtimeCommentLikes", { commentId, totalLikes: updatedComment.likes.length });
  }
  catch (error) {
    console.log("Error liking/unliking comment:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const replyComment = async (req, res) => {
  const { commentId } = req.params;
  const { userId, content } = req.body;

  try {
    const comment = await Comment.findById(commentId);
    const newReply = await Comment.create({ from: userId, to: commentId, postId: comment.postId, content });
    const totalComments = await Comment.countDocuments({ postId: comment.postId });

    if (newReply) {
      await Notification.create({ from: userId, to: comment.from, post: comment.postId, type: "comment", comment: { type: "reply", content } });
    }

    io.emit("realtimeNotifications", { isNew: true });
    io.emit("realtimeReply", { commentId });
    io.emit("realtimeTotalComments", { postId: comment.postId, totalComments });
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
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const emitCommentLikes = async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await Comment.findById(commentId).select("likes");

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Emit only to clients who care about this comment
    io.emit("commentLikesUpdate", {
      commentId,
      totalLikes: comment.likes.length,
    });

    res.status(200).json({ message: "Like count emitted successfully" });
  }
  catch (error) {
    console.error("Error emitting comment likes:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};