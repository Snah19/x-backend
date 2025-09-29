import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { commentOnPost, createPost, deletePost, updatePostText, favUnfavPost, getFollowingPosts, getForYouFeed, getPost, getUserPosts, likeUnlikePost, repostUnrepostPost } from "../controllers/post.controller.js";

const router = express.Router();
router.get("/for-you", getForYouFeed);
router.get("/following", authenticate, getFollowingPosts);
router.get("/user/:username", getUserPosts);
router.post("/create", authenticate, createPost);
router.delete("/:postId", authenticate, deletePost);
router.patch("/like/:postId", authenticate, likeUnlikePost);
router.patch("/favorite/:postId", authenticate, favUnfavPost);
router.patch("/repost/:postId", authenticate, repostUnrepostPost);
router.patch("/comment/:postId", authenticate, commentOnPost);
router.get("/status/:postId", getPost);
router.patch("/text/:postId", updatePostText);


export default router;