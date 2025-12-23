import mongoose from "mongoose";

const { Schema } = mongoose;

const playlistSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video" // references the Video model
      }
    ],

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    isPublic: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

const Playlist = mongoose.model("Playlist", playlistSchema);

export default Playlist;
