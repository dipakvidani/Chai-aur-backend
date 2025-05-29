import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { deleteImageFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { Subscriber } from "../models/subsciption.model.js";


const genrateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.genrateAccessToken();
        const refreshToken = user.genrateRefreshToken();

        user.refreshToken = refreshToken
        await user.save({
            validateBeforeSave: false
        })

        return { refreshToken, accessToken }

    } catch (error) {

        throw new ApiError(500, "Something Went Wrong While Genrating Acess Token")

    }
}

const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    //validation - not empty
    //check if user already exists:username email
    //check for images - check for avatar
    //upload them to cloudianary , avatar
    //create user object - create entry in DB
    //remove password and refreshtoken field from response
    //check for user creation
    //return response

    const { username, fullName, email, password } = req.body

    if (
        [username, fullName, email, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All field is required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "user Already Exists")
    }

    // console.log(req.files);  


    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    if (!avatar) {
        throw new ApiError(400, "Avtar is Required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username ? username.toLowerCase() : undefined
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "something went wrong during register user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered sucessfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    //req body -data
    //user name or email
    //find the user
    //password check
    //access and refresh token
    //send cookies

    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
    // }

    const user = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (!user) {
        throw new ApiError(404, "User Not Found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user Credentials")
    }

    const { accessToken, refreshToken } = await
        genrateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged In Successfully"
            )
        )
})


const logoutUser = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user._id)
    if (!user) {
        throw new ApiError(404, "User Not Found")
    }
    // console.log("user",user);


    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        }, {
        new: true
    }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User loggedout"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken ||
        req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        if (!decodedToken) {
            throw new ApiError(401, "invalid refresh token")
        }

        const user = await User.findById(decodedToken._id)

        if (!user) {
            throw new ApiError(401, "user not found")
        }

        if (user.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Refresh token is expired")
        }

        const { accessToken, newRefreshToken } = await genrateAccessAndRefreshTokens(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken
                    },
                    "Access token refreshed successfully"
                )
            )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while refreshing access token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password Updated Successfully")
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user?._id)
    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Current User Fetched Successfully")
        )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (fullName || email) {
        throw new ApiError(400, "All Field is Required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                username,
                email
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account Details Updated Successfully")
        )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is Missing")
    }

    //delete old image
    const user = await User.findById(req.user?._id)
    if (user?.avatar) {
        await deleteImageFromCloudinary(user.avatar)
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Error While Uploading avatar")
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "Avatar is updated Sucessfully")
        )

})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage file is Missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage) {
        throw new ApiError(400, "Error While Uploading coverImage")
    }

    const user = await User.findById(req.user?._id)
    if (user?.coverImage) {
        await deleteImageFromCloudinary(user.coverImage)
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")


    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "coverImage is updated Sucessfully")
        )

})

const getUserChannelprofile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is Missing")
    }

    const channel = await User.aggregate([
        {
            $match: username?.toLowercase()
        },
        {
            $lookup: {
                from: "subsciptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subsciptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
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
        {
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                subscriberCount: 1,
                channelSubscribedToCount: 1,
                coverImage: 1,
                email: 1,
                isSubscribed: 1
            }
        }
    ])


    // console.log(channel);

    if (!channel?.length) {
        throw new ApiError(404, "Channel doesnot exists")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "user Channel fetched sucessfully")
        )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelprofile
}

