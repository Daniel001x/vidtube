import mongoose from "mongoose";

const { Schema } = mongoose;

const likeSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    video: {
      type: Schema.Types.ObjectId,
      ref: "Video"
    },

    playlist: {
      type: Schema.Types.ObjectId,
      ref: "Playlist"
    }
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

// Optional: Prevent the same user from liking the same video or playlist multiple times
likeSchema.index({ user: 1, video: 1 }, { unique: true, sparse: true });
likeSchema.index({ user: 1, playlist: 1 }, { unique: true, sparse: true });

const Like = mongoose.model("Like", likeSchema);

export default Like;
