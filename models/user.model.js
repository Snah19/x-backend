import mongoose from "mongoose";

const { Schema, model, models } = mongoose;
const { ObjectId } = Schema.Types;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    fullname: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    followers: [
      {
        type: ObjectId,
        ref: "User",
        default: [],
      }
    ],
    following: [
      {
        type: ObjectId,
        ref: "User",
        default: [],
      }
    ],
    profileImg: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      }
    },
    coverImg: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      }
    },
    bio: {
      type: String,
      default: "",
    },
    link: {
      type: String,
      default: ""
    },
    likedPosts: [
      {
        type: ObjectId,
        ref: "Post",
        default: [],
      }
    ],
    repostedPosts: [
      {
        type: ObjectId,
        ref: "Post",
        default: []        
      }
    ],
    favoritePosts: [
      {
        type: ObjectId,
        ref: "Post",
        default: []
      }
    ],
  },
  {
    timestamps: true
  }
);

const User = models.User || model("User", userSchema);

export default User;