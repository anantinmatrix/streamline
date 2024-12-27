import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cloudinaryUpload } from "../utils/cloudinary.upload.js";




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


// user login controller
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


// logout controller
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

// change password
export const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if(!oldPassword || !newPassword){
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
