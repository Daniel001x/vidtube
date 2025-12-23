import { timeLog, timeStamp } from "console";
import mongoose,{ Schema } from "express";
import { type } from "os";
import { ref } from "process";
const tweetSchema = new Schema({
    content:{
        type: String,
        required: true
    },

    owner:{
       type: Schema.Types.ObjectId,
       ref: "User"
    }
},
{timeStamp: true}
);

export const tweet = mongoose.model("tweet", tweetSchema)