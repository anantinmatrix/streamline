import mongoose from "mongoose";
import { mongoDbName } from '../constants.js';

export async function connectToDB(){
    try {
        const dbConnection = await mongoose.connect(`${process.env.MONGO_URI}/${mongoDbName}`)
    } catch (error) {
        console.error('ERROR IN CONNECTTODB FUNCTION (./src/db/index.js)', error)
        process.exit(1)
    }
} 