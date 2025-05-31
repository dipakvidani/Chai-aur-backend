import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subsciption.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    const userId = req.user._id
    const existingSubscription = await Subscription.findOne({channel: channelId, subscriber: userId})
    if (existingSubscription) {
        // If subscription exists, remove it 
        await Subscription.deleteOne({channel: channelId, subscriber: userId})
        return res.status(200).json(new ApiResponse(
            200,
            {message: "Unsubscribed successfully"},
            "Subscription removed"
        ))
    }
    else {
        // If subscription does not exist, create it
        const newSubscription = await Subscription.create({channel: channelId, subscriber: userId})
        return res.status(201).json(new ApiResponse(
            201,
            newSubscription,
            "Subscribed successfully"
        ))
    }

})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // controller to return subscriber list of a channel
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    
    const subscribers = await Subscription.find({channel: channelId}).populate('subscriber', 'username profilePicture')
    if (!subscribers || subscribers.length === 0) {
        throw new ApiError(404, "No subscribers found for this channel")
    }
    return res.status(200).json(new ApiResponse(
        200,
        subscribers,
        "Channel subscribers retrieved successfully"
    ))

})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    // controller to return channel list to which user has subscribed
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID")
    }
    const subscriptions = await Subscription.find({ subscriber: subscriberId }).populate('channel', 'username profilePicture')
    if (!subscriptions || subscriptions.length === 0) {
        throw new ApiError(404, "No subscriptions found for this user")
    }
    return res.status(200).json(new ApiResponse(
        200,
        subscriptions,
        "Subscribed channels retrieved successfully"
    ))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}