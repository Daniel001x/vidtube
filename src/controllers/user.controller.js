import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/apiErrorResponse.js';
import { User } from "../models/user.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";




const genrateAccessAndRefreshToken = async(userId) =>{
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
    
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
    
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave}, false)
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, 
            "Something went wrong while genrating the access and refresh token")
    }

}


const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;

    // Validation
    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existingUser) {
        throw new ApiError(409, "User with email or username already exists");
    }
    
    console.log(req.files);
      
    // Get file paths
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // Upload avatar to cloudinary
    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath);
        
        if (!avatar || !avatar.url) {
            throw new Error("Avatar upload returned null");
        }
        
        console.log("Uploaded avatar", avatar);
    } catch (error) {
        console.log("Error uploading avatar", error);
        throw new ApiError(500, "Failed to upload avatar");
    }

    // Upload cover image to cloudinary (optional)
    let coverImage = null;
    if (coverImageLocalPath) {
        try {
            coverImage = await uploadOnCloudinary(coverImageLocalPath);
            
            if (coverImage && !coverImage.url) {
                throw new Error("Cover image upload returned invalid response");
            }
            
            console.log("Uploaded coverImage", coverImage);
        } catch (error) {
            console.log("Error uploading coverImage", error);
            // Clean up avatar if cover image fails
            if (avatar && avatar.public_id) {
                await deleteFromCloudinary(avatar.public_id);
            }
            throw new ApiError(500, "Failed to upload cover image");
        }
    }

    // Create user
    try {
        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || '',
            email,
            password,
            username: username.toLowerCase()
        });

        // Fetch created user without password and refreshToken
        const createdUser = await User.findById(user._id).select('-password -refreshToken');

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user");
        }

        return res.status(201).json(
            new ApiResponse(201, createdUser, "User registered successfully")
        );
    } catch (error) {
        console.log("User creation failed", error);
        
        // Clean up uploaded images from cloudinary
        if (avatar && avatar.public_id) {
            await deleteFromCloudinary(avatar.public_id);
        }
        if (coverImage && coverImage.public_id) {
            await deleteFromCloudinary(coverImage.public_id);
        }
        
        throw new ApiError(500, "Something went wrong while registering the user");
    }
});

//get data from the body
const loginUser = asyncHandler(async(req,res)=>{
    const {email, username, password} = req.body

    //validation
if (!email) {
    throw new ApiError(400, "email is required")

}

 const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const {accessToken, refreshToken} = await
    genrateAccessAndRefreshToken(user._id)


    const loggedInUser = await User.findById(user._id)
    .select('-password -refreshToken');

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
        
    200,
    {loggedInUser, accessToken, refreshToken},
    "User logged in successfully"

    ));
})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        await User.findByIdAndUpdate (
            req.user._id,
            {
                $set: {refreshToken, undefined}

            },

            {new: true} 

          
        )
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out successfully"));
})

const refreshAccessToke = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "refresh token required");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id)

        if (!user) {
            throw new ApiError(404, "user not found");

        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        }

    const {accessToken, refreshToken: newRefreshToken} = await genrateAccessAndRefreshToken(user._id)

    res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(new ApiResponse (200,
        {accessToken,
             refreshToken: newRefreshToken},
        "Access token refreshed successfully"
    ))

    } catch (error) {
        throw new ApiError(500, "something went wrong")
    }
});


const ChangeCurrentPassword = asyncHandler(async(req,res)=>{
   const {oldPassword, newPassword} = req.body;
   const user = await User.findById(req.user?._id);
   const isPasswordValid = await user.isPasswordValid(oldPassword)

   if (!isPasswordValid) {
    throw new ApiError(401, "Old password is incorrect")
   }

   user.password = newPassword;

   await user.save({ValidateBeforeSave: false});
   return res.status(200).json(new ApiResponse(200, {}, "password change successfully"))
});

const getCurrentUser = asyncHandler(async(req,res)=>{
  return res.status(200)
  .json(200, new ApiResponse(200, req.user, "current user details"))
});

const UpdateAccoutDetails = asyncHandler(async(req,res)=>{
  const {fullname, email} = req.body;
  if (!fullname || !email) {
    throw new ApiError(400, "FullName and email is required");
  }

  const user = await User.findByIdAndUpdate(req.user._id,
    {
        $set:{
            fullname,
            email: true
        }
    },

    {new: true}
  ).select("-password -refreshToken");

  return res.status(200)
  .json(
    new ApiResponse(200, user, "Accound details update successfully")
  )
});

const UpdateUserAvatar = asyncHandler(async(req,res)=>{
   const avatarLocalPath = req.file?.path
   if (!UpdateUserAvatar) {
    throw new ApiError(400, "File is required");
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   if (!avatar.url) {
    throw new ApiError(500, "something went wrong while uploading the avatar")
   }

   await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            avatar: avatar.url
        }
    },

    {new: true}

   ).select("-password -refreshToken")

   res.status(200)
   .json(new ApiResponse(200, user, "Avatar updated successfully"))
});

const UpdateUserCoverImage = asyncHandler(async(req,res)=>{
  const coverImageLocalPath = req.file?.path

  if (!coverImageLocalPath) {
    throw new ApiError(400, "File required")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  if (!coverImage.url) {
    throw new ApiError(500, "Something went wrong while uploading cover image")
  }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
        $set:{
           coverImage: coverImage.url
        }
    },
    {new : true}
  )

  return res.status(200)
  .json(new ApiResponse(200, user, "Cover image Update successfully"));
});

const getUserChannelProfile = asyncHandler(async(req,res)=>{
   const {username} = req.params
   if (!username.trim()) {
    throw new ApiError(400, "UserName is Required")
   };

  const channel = await User.aggregate([
    {
        $match: {
            username: username?.toLowerCase()
        }
    },
    {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        }
    },
    {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
        }
    },
    {
        $addFields: {
            subscribersCount: {
                $size: "$subscribers"
            },
            channelSubscribedToCount: {
                $size: "$subscribedTo"
            },
            isSubscribed: {
                $cond: {
                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                    then: true,
                    else: false
                }
            }
        }
    },
    {
        $project: {
            fullname: 1,
            username: 1,
            avatar: 1,
            subscribersCount: 1,
            channelSubscribedToCount: 1,
            isSubscribed: 1,
            coverImage: 1,
            email: 1
        }
    }
]);

// Check if channel exists AFTER the aggregation
if (!channel?.length) {
    throw new ApiError(404, "Channel not found");
}
return res.status(200)
.json(ApiResponse(200, channel[0], "Channel profile fetch successfully"));
});
const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0]?.watchHistory,
                "Watch history fetched successfully"
            )
        );
});
export { registerUser, loginUser, refreshAccessToke, logoutUser,
    ChangeCurrentPassword, getCurrentUser, UpdateAccoutDetails, UpdateUserCoverImage,
    UpdateUserAvatar
};