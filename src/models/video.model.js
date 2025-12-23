import { timeStamp } from "console";
import mongooseaggregatepaginate from "mongoose-aggregate-paginate-v2";
import mongoose, { Schema } from "express";
import { type } from "os";
import { ref, title } from "process";
const vidoSchema = new Schema({
    videofile:{
        type: String,
        required: true
    },

    thumbnail:{
        type: String,
        required: true
    },

    title:{
        type: String,
        required: true,
    },

    description:{
        type: String,
        required: true
    },

    duration:{
        type: Number,
        required: true
    },

    views:{
        type: Number,
        default: 0
    },

    isPublished:{
        type: Boolean,
        default: true
    },

    owner:{
        type: Schema.types.ObjectId,
        ref: "User"
    }
},

{timeStamp: true});

vidoSchema.plugin(mongooseaggregatepaginate)

export const Video = mongoose.model('Video', vidoSchema)