import express from "express";
import { followUnfollowUser, getFavoritePosts, getLikedPosts, getRepostedPosts, getSuggestedUser, getUserProfile, updateProfile } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.get("/profile/:username", getUserProfile);
router.get("/suggested", authenticate, getSuggestedUser);
router.patch("/follow/:username", authenticate, followUnfollowUser);
router.patch("/profile/update", authenticate, updateProfile);
router.get("/posts/liked/:username", getLikedPosts);
router.get("/posts/favorite/:username", getFavoritePosts);
router.get("/posts/repost/:username", getRepostedPosts);


export default router;