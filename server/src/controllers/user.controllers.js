import { asyncHandler } from "../utils/asyncHandler.js";

export const registerUser = asyncHandler( async (req, res)=>{
    res.status(200).json({
        message: "ok",
        messageTwo: "This is the first controller for out youtube clone backend"
    })
})

