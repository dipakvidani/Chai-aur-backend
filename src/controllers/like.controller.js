import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const userId = req.user._id
    const existingLike = await Like.findOne({video: videoId, user: userId})
    if (existingLike) {
        // If like exists, remove it
        await Like.deleteOne({video: videoId, user: userId})
        return res.status(200).json(new ApiResponse(
            200,
            {message: "Like removed"},
            "Video unliked successfully"
        ))
    } else {
        // If like does not exist, create it
        const newLike = await Like.create({video: videoId, user: userId})
        return res.status(201).json(new ApiResponse(
            201,
            newLike,
            "Video liked successfully"
        ))
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }
    const userId = req.user._id
    const existingLike = await Like.findOne({comment: commentId, user: userId})
    if (existingLike) {
        // If like exists, remove it
        await Like.deleteOne({comment: commentId, user: userId})
        return res.status(200).json(new ApiResponse(
            200,
            {message: "Like removed"},
            "Comment unliked successfully"
        ))
    } else {
        // If like does not exist, create it
        const newLike = await Like.create({comment: commentId, user: userId})
        return res.status(201).json(new ApiResponse(
            201,
            newLike,
            "Comment liked successfully"
        ))
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }
    const userId = req.user._id
    const existingLike = await Like.findOne({tweet: tweetId, user: userId})
    if (existingLike) {
        // If like exists, remove it
        await Like.deleteOne({tweet: tweetId, user: userId})
        return res.status(200).json(new ApiResponse(
            200,
            {message: "Like removed"},
            "Tweet unliked successfully"
        ))
    } else {
        // If like does not exist, create it
        const newLike = await Like.create({tweet: tweetId, user: userId})
        return res.status(201).json(new ApiResponse(
            201,
            newLike,
            "Tweet liked successfully"
        ))
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }
    const likedVideos = await Like.find({user: userId, video: {$ne: null}})
        .populate('video')
        .sort({createdAt: -1})
    if (!likedVideos || likedVideos.length === 0) {
        throw new ApiError(404, "No liked videos found for this user")
    }
    return res.status(200).json(new ApiResponse(
        200,
        likedVideos,
        "Liked videos retrieved successfully"
    ))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}