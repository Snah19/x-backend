import express from "express";
import { commentOnPost, deleteComments, getComments, getReplies, getTotalComments, likeUnlikeComment, replyComment } from "../controllers/comment.controller.js";

const router = express.Router();

router.post("/:postId", commentOnPost);
router.get("/:postId", getComments);
router.patch("/:commentId", likeUnlikeComment);
router.post("/replies/:commentId", replyComment);
router.get("/replies/:commentId", getReplies);
router.get("/total/:postId", getTotalComments);
router.delete("/:postId", deleteComments);


export default router;