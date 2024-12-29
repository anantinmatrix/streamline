import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cloudinaryUpload } from "../utils/cloudinary.upload.js";
import { delelteCloudFile } from "../utils/deleteOldCloudFile.js";




// function to generate access token and refresh token
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findOne({ _id: userId });
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong.")
    }
}



// ********************* CONTROLLERS **********************
// registering new user **********************
export const registerUser = asyncHandler(async (req, res) => {
    // get user filled fields
    let { fullName, email, username, password, avatar, coverImage } = req.body;
    // to confirm any field should not be empty
    if (
        [fullName, email, username, password, avatar].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required.")
    }
    // check if the user already exists
    const existingUser = await User.find({
        $or: [{ email: email }, { username: username }]
    });
    if (existingUser.length > 0) {
        console.log('this exitsting user conditional is hitting')
        // throw new ApiError(409, "User already exists.");
        return res.status(409).json(
            new ApiResponse(400, { data: null, message: "user already exists." }, "User already exists, Try log in.")
        )
    };
    // checking if the images are loaded
    const localAvatar = req.files?.avatar[0].path;
    if (!localAvatar) {
        throw new ApiError(500, "Couldn't upload Avatar.")
    }
    let localCoverImage;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage > 0) {
        localCoverImage = req.files.coverImage[0].path;
    }
    // uploading images to cloudinary
    const uploadedAvatar = await cloudinaryUpload(localAvatar)
    if (!uploadedAvatar) {
        throw new ApiError(500, "Couldn't upload Avatar to cloudinary")
    }
    let uploadedCoverImage;
    if (localCoverImage) {
        let upload = await cloudinaryUpload(localCoverImage)
        uploadedCoverImage = upload.secure_url;
    } else {
        uploadedCoverImage = ""
    }
    // creating a new user
    const newUser = await User.create({
        fullName,
        email,
        username,
        password,
        avatar: uploadedAvatar.secure_url,
        coverImage: uploadedCoverImage
    })
    await newUser.save()
    // creating response user
    const responseUser = await User.find({ '_id': newUser._id }).select('-password -refreshToken')
    if (!responseUser) {
        throw new ApiError(500, "Couldn't find this user in database")
    }

    return res.status(201).json(
        new ApiResponse(200, responseUser, "User created successfully.")
    )
})


// user login controller **********************
export const userLogin = asyncHandler(async (req, res, next) => {
    let { email, username, password } = req.body;
    // check if all fields are filled
    if (!username) {
        if (!email)
            throw new ApiError(400, "Username or email is required.")
    }
    // checking if the user exists
    const user = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (!user) {
        throw new ApiError(404, "User does not exist.")
    }
    //checking if the password is correct
    const passwordVarification = await user.isPasswordCorrect(password);
    if (!passwordVarification) {
        throw new ApiError(401, "Invalid credentials.")
    }

    // generate access token and refresh token
    const generateAccessAndRefreshToken = async (userId) => {
        try {
            const user = await User.findOne({ _id: userId });
            const accessToken = user.generateAccessToken();
            const refreshToken = user.generateRefreshToken();

            user.refreshToken = refreshToken;
            await user.save({ validateBeforeSave: false });

            return { accessToken, refreshToken }
        } catch (error) {
            throw new ApiError(500, "Something went wrong.")
        }
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    // getting info for logged in user
    const loggedInUser = await User.findById(user._id).
        select("-password -refreshToken")

    const options = {
        httpsOnly: true,
        secure: true
    }

    return res.
        status(201).
        cookie("accessToken", accessToken, options).
        cookie("refreshToken", refreshToken, options).
        json(new ApiResponse(
            200,
            { user: loggedInUser, accessToken, refreshToken },
            "User logged in successfully."
        ))
})


// logout controller **********************
export const logoutUser = asyncHandler(async (req, res) => {
    //finding user and updating it
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            },
        },
        {
            new: true
        }
    );

    const options = {
        httpsOnly: true,
        secure: true
    }

    res.status(201)
    res.clearCookie("accessToken", options)
    res.clearCookie("refreshToken", options)
    res.json(new ApiResponse(200, {}, "User logout successfully."))
})

// change password **********************
export const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Enter current and new password.")
    }

    // fetching user from the database
    const user = await User.findById(req.user?._id);
    // checking if the old password is correct or not
    const oldPasswordVerification = await user.isPasswordCorrect(oldPassword);
    console.log(oldPassword, oldPasswordVerification, newPassword, "just to show the current and the new password.")
    if (!oldPasswordVerification) {
        throw new ApiError(400, "You entered wrong current password")
    }
    // changing current password to new password
    user.password = newPassword;
    await user.save();

    const responseUser = await User.findById(user._id).select("-password -refreshToken")

    return res.status(201)
        .json(new ApiResponse(200, responseUser, "Password changed successfully."))
})

// editing user details ********************
export const updateUserDetails = asyncHandler(async (req, res) => {
    const { email, fullName } = req.body;

    // checking if any field is empty
    if (!email || !fullName) {
        throw new ApiError(400, "Fill all the required fields.")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res.status(200)
        .json(new ApiResponse(200, user, "Email and Full Name has been changed successfully."))
})


// changing user's avatar ***************
export const updateUserAvatar = asyncHandler(async (req, res) => {
    // getting new file
    const avatarLocalPath = req.file?.path;

    // checking if file is available or not
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing.")
    }

    const avatar = await cloudinaryUpload(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(500, "Error while uploading avatar file to cloud in controllers.")
    }

    // getting the user's old avatar image from this to put into deleteCloudFile function
    const oldAvatar = await User.findById(req.user?._id)

    // updating user's avatar and saving it
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.secure_url
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    // function to delete the old avatar image from the cloud
    await delelteCloudFile(oldAvatar.avatar)

    res.status(201)
        .json(new ApiResponse(200, user, "Updated avatar successfully"))
})


// changing user's cover image ****************
export const updateUserCoverImage = asyncHandler(async (req, res) => {
    // getting new file
    const coverImageLocalPath = req.file?.path;

    // checking if file is available or not
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Avatar file is missing.")
    }

    const coverImage = await cloudinaryUpload(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(500, "Error while uploading cover image file to cloud in controllers.")
    }

    const oldCoverImage = await User.findById(req.user?._id);

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.secure_url
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    // deleting old coverImage from the cloud
    await delelteCloudFile(oldCoverImage.coverImage)

    res.status(201)
        .json(new ApiResponse(200, user, "Updated cover image successfully"))
})

// getting user channel profile **********************
export const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    console.log(username)

    if (!username?.trim()) {
        throw new ApiError(404, "No parameters detected.")
    }

    const channel = await User.aggregate([
        // match pipeline
        {
            $match: {
                username: username?.toLowerCase()
            },
        },
        // lookup for subscribers pipeline
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        // lookup for subscribed to pipeline
        {
            $lookup: {
                from: 'subscriptions',
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribed_to"
            }
        },
        // pipelines to add fields
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCounts: {
                    $size: "$subscribed_to"
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
        // projection pipeline
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCounts: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "Couldn't fetch channel details.")
    }

    console.log(channel)

    return res.status(200)
        .json(new ApiResponse(200, channel, "User fetched successfully"))
})


// getting user's watch history *****************
export const getUserWatchHistory = asyncHandler(async (req, res) => {

    // getting user details
    const user = await User.aggregate([
        // match pipeline to find user
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        // lookup pipeline to look for watch history in user channel
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watch_history",
                // nested pipeline to populate or add user as nested fields
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            // nested or sub pipeline to project user fields
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1,
                                        coverImage: 1,

                                    }
                                },
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
        },
        {
            $project:{
                username:1,
                fullName:1,
                email:1,
                watchHistory: 1,
                
            }
        }
    ])

    if(!user?.length){
        throw new ApiError(400, "User not found.")
    }

    res.status(200)
    .json(new ApiResponse(200, user, "Fetched watch history"))
})

