import { Router } from "express";
import { logoutUser, registerUser, userLogin } from "../controllers/user.controllers.js";
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


export { userRouter };