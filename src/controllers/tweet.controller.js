import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const tweet = await Tweet.create({
        content,
        owner: userId
    });

    if (!tweet) {
        throw new ApiError(500, "Failed to create tweet");
    }

    return res
        .status(201)
        .json(new ApiResponse(
            200,
            tweet,
            "Tweet created successfully"
        )
        );
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId = req.user._id;
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });

    if (!tweets || tweets.length === 0) {
        throw new ApiError(404, "No tweets found for this user");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweets,
                "Tweets retrieved successfully"
            )
        );
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }
    const tweet = await Tweet.findOneAndUpdate(
        { _id: tweetId, owner: userId },
        { content },
        { new: true }
    );
    if (!tweet) {
        throw new ApiError(404, "Tweet not found or you do not have permission to update it");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweet,
                "Tweet updated successfully"
            )
        );
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;
    const userId = req.user._id;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }
    const tweet = await Tweet.findOneAndDelete({ _id: tweetId, owner: userId });
    if (!tweet) {
        throw new ApiError(404, "Tweet not found or you do not have permission to delete it");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Tweet deleted successfully"
            )
        );
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
