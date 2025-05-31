import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subsciption.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelId = req.user._id;
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }
    const channelVideos = await Video.find({ owner: channelId });
    if (!channelVideos || channelVideos.length === 0) {
        throw new ApiError(404, "No videos found for this channel");
    }
    const totalViews = channelVideos.reduce((acc, video) => acc + video.views, 0);
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });
    const totalVideos = channelVideos.length;
    const totalLikes = await Like.countDocuments({ video: { $in: channelVideos.map(video => video._id) } });
    return res.status(200).json(new ApiResponse(  
        200,
        {
            totalViews,
            totalSubscribers,
            totalVideos,
            totalLikes
        },
        "Channel stats retrieved successfully"
    ));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const channelId = req.user._id;
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }
    const channelVideos = await Video.find({ owner: channelId }).sort({ createdAt: -1 });
    if (!channelVideos || channelVideos.length === 0) {
        throw new ApiError(404, "No videos found for this channel");
    }
    return res.status(200).json(new ApiResponse(
        200,
        channelVideos,
        "Channel videos retrieved successfully"
    ));
})

export {
    getChannelStats, 
    getChannelVideos
    }