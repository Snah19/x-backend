import mongoose from "mongoose";

const { Schema, model, models } = mongoose;
const { ObjectId } = Schema.Types;

const postSchema = new Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    imgs: {
      type: [
        {
          url: { type: String },
          publicId: { type: String }
        }
      ],
      default: []
    },
    likes: [
      {
        type: ObjectId,
        ref: "User",
      }
    ],
    reposts: [
      {
        type: ObjectId,
        ref: "User"
      }
    ],
    favorites: [
      {
        type: ObjectId,
        ref: "User",
      }
    ],
    views: [
      {
        type: ObjectId,
        ref: "User"
      }
    ]
  },
  {
    timestamps: true,
  }
);

const Post = models.Post || model("Post", postSchema);

export default Post;