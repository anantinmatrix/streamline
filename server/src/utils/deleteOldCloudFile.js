import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from './ApiError.js';


export const delelteCloudFile = async (file) => {
    try {
        // if no file than throw an error
        if (!file) {
            throw new ApiError(400, "Select a file to delete")
        }

        // get file name with extension
        const assetUrl = file.split('/');
        // remove extionsion form the file name
        const assetName = assetUrl[assetUrl.length - 1].split(".")[0]

        // if file name is a empty string
        if (!assetName) {
            throw new ApiError(400, "Couldn't extract file name from the url.")
        }
        // deleting file with cloudinary api
        const deletedFile = await cloudinary.api.delete_resources(assetName, { resource_type: "image" })

        // consolling the deletion response
        console.log(deletedFile)
    } catch (error) {
        console.log("Error while deleting the file from the cloud", error, )
    }
}