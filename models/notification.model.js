import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const { ObjectId } = Schema.Types;

const notificationSchema = new Schema(
  {
    from: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: ObjectId,
      ref: "User",
      required: true,      
    },
    post: {
      type: ObjectId,
      ref: "Post",
    },
    comment: {
      _id: {
        type: ObjectId,
        ref: "Comment"
      },
      type: {
        type: String,
        enum: ["comment", "like", "reply"]
      },
      content: {
        type: String,
      }
    },
    type: {
      type: String,
      required: true,
      enum: ["follow", "comment", "like", "repost", "favorite"],
    },
    read: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true
  }
);

const Notification = models.Notification || model("Notification", notificationSchema);

export default Notification;