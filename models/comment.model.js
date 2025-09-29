import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const { ObjectId } = Schema.Types;

const commentSchema = new Schema(
  {
    postId: {
      type: ObjectId,
      ref: "Post",
    },
    from: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: ObjectId,
      ref: "Comment",
      default: null
    },
    content: {
      type: String,
    },
    likes: [
      {
        type: ObjectId,
        ref: "User",
        default: []
      }
    ]
  },
  {
    timestamps: true,
  }
);

const Comment = models.Comment || model("Comment", commentSchema);

export default Comment;