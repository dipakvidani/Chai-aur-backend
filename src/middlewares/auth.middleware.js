import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        // console.log("request cookies ",req.cookies);
        // console.log("request header     ",req.header("Authorization"));

        const token = req.cookies?.accessToken ||
            req.header("Authorization")?.
                replace("Bearer ", "");
        // console.log("token",token);


        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        // console.log("decodedToken", decodedToken);

        const user = await User.findById(decodedToken?._id)
            .select("-password -refreshToken")
        // console.log("user", user);

        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }

        req.user = user
        next()
    } catch (error) {
        console.error("JWT verification failed:", error);
        throw new ApiError(401, error.message || "invalid Access Token")
    }

})