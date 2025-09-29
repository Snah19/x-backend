import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { commentOnPost, deleteComments, getComments, getReplies, getTotalComments, likeUnlikeComment, replyComment } from "../controllers/comment.controller.js";

const router = express.Router();

router.post("/:postId", authenticate, commentOnPost);
router.get("/:postId", getComments);
router.patch("/:commentId", authenticate, likeUnlikeComment);
router.post("/replies/:commentId", authenticate, replyComment);
router.get("/replies/:commentId", getReplies);
router.get("/total/:postId", getTotalComments);
router.delete("/:postId", deleteComments);


export default router;