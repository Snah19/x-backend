import express from "express";
import { followUnfollowUser, getFavoritePosts, getLikedPosts, getRepostedPosts, getSuggestedUser, getUserProfile, updateProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile/:username", getUserProfile);
router.get("/suggested/:userId", getSuggestedUser);
router.patch("/follow/:username", followUnfollowUser);
router.patch("/profile/update/:userId", updateProfile);
router.get("/posts/liked/:username", getLikedPosts);
router.get("/posts/favorite/:username", getFavoritePosts);
router.get("/posts/repost/:username", getRepostedPosts);


export default router;