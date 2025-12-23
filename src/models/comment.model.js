import mongoose from "mongoose";
import mongooseaggregatepaginate from "mongoose-aggregate-paginate-v2";

const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true
    },

    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);
commentSchema.plugin(mongooseaggregatepaginate)
const Comment = mongoose.model("Comment", commentSchema);


export default Comment;
