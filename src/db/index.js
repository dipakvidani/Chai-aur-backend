import { DB_NAME } from "../constants.js";
import mongoose from "mongoose"

 const connectDb = async () => {
    try {
       const ConnectionInstance = await mongoose.connect(`${process.env.MOGODB_URI}/${DB_NAME}`)
       console.log(`\n MongoDB Connected !! DB HOST: ${ConnectionInstance.connection.host}`);
       
    } catch (error) {
        console.log("Error Connection in MONGODB Connection",error);
        process.exit(1);
    }
}

export default connectDb