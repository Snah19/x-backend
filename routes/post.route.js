import express from "express";
import { createPost, deletePost, updatePostText, favUnfavPost, getFollowingPosts, getForYouFeed, getPost, getUserPosts, likeUnlikePost, repostUnrepostPost } from "../controllers/post.controller.js";

const router = express.Router();
router.get("/for-you", getForYouFeed);
router.get("/following/:userId", getFollowingPosts);
router.get("/user/:username", getUserPosts);
router.post("/create/:userId", createPost);
router.delete("/:postId", deletePost);
router.patch("/like/:postId", likeUnlikePost);
router.patch("/favorite/:postId", favUnfavPost);
router.patch("/repost/:postId", repostUnrepostPost);
router.get("/status/:postId", getPost);
router.patch("/text/:postId", updatePostText);


export default router;