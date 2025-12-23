import { Router } from "express";
import { registerUser, logoutUser, loginUser, refreshAccessToke, ChangeCurrentPassword, UpdateUserCoverImage } from "../controllers/user.controller.js";
import {upload} from "../middleware/multter.js"
import { verifyJwt } from "../middleware/auth.middleware.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const router = Router();

router.route('/register').post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {  
        name: "coverImage",
        maxCount: 1
    }
]), registerUser)

router.route('/login').post(loginUser)
router.route('/refresh-token').post(refreshAccessToke)

//secured router
router.route('/logout').post(verifyJwt, logoutUser);
router.route('/change-password').post(verifyJwt, ChangeCurrentPassword)
router.route('/current-user').get(verifyJwt, getCurrentUser)
router.route('/channel/:username').get(verifyJwt, getUserChannelProfile)
router.route('/update-account').patch(verifyJwt,UpdateAccoutDetails)
router.route('/avatar').patch(verifyJwt, upload.single("avatar"), UpdateUserAvatar)
router.route('/cover-image').patch(verifyJwt, upload.single('coverImage'), UpdateUserCoverImage)
router.route('/history').get(verifyJwt, getWatchHistory)

export default router;
