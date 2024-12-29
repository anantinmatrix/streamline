import { Router } from "express";
import { changeCurrentPassword, updateUserAvatar, updateUserCoverImage, updateUserDetails, logoutUser, registerUser, userLogin, getUserChannelProfile, getUserWatchHistory } from "../controllers/user.controllers.js";
import { upload } from '../middlewares/multer.middleware.js'
import { authMiddleware } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.route('/register').post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]), // multer middleware to upload file    
    registerUser
)

userRouter.route('/login').post(userLogin)

// secured routes
userRouter.route('/logout').post(authMiddleware, logoutUser)
userRouter.route('/change-password').patch(authMiddleware, changeCurrentPassword)
userRouter.route('/update-details').patch(updateUserDetails)
userRouter.route('/update-avatar').patch(authMiddleware, upload.single("avatar"), updateUserAvatar)
userRouter.route('/update-cover-image').patch(upload.single("coverImage"), authMiddleware, updateUserCoverImage)
userRouter.route('/get-channel-details/username/:username').get(authMiddleware, getUserChannelProfile)
userRouter.route('/get-user-watch-history').get(authMiddleware, getUserWatchHistory)


export { userRouter };