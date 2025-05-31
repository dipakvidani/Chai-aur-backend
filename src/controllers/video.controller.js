import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const filter = {}
    if (query) {
        filter.title = { $regex: query, $options: 'i' } // Case-insensitive search
    }
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID")
        }
        filter.owner = userId

    }
    const sort = {}
    if (sortBy) {
        sort[sortBy] = sortType === 'desc' ? -1 : 1 // Default to ascending if not specified
    } else {
        sort.createdAt = -1 // Default sort by createdAt descending
    }
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort
    }
    const videos = await Video.paginate(filter, options)
    if (!videos || videos.length === 0) {
        throw new ApiError(404, "No videos found")
    }
    return res.status(200).json(new ApiResponse(
        200,
        videos,
        "Videos retrieved successfully"
    ))
})

const publishVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    const userId = req.user._id
    if (!title || title.trim() === "") {
        throw new ApiError(400, "Video title is required")
    }
    if (!description || description.trim() === "") {
        throw new ApiError(400, "Video description is required")
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    if (!req.file) {
        throw new ApiError(400, "Video file is required")
    }
    const videoUrl = await uploadOnCloudinary(req.file.path, "videos")
    if (!videoUrl) {
        throw new ApiError(500, "Failed to upload video")
    }
    const video = await Video.create({
        title,
        description,
        videoUrl,
        owner: userId
    })
    if (!video) {
        throw new ApiError(500, "Failed to create video")
    }
    return res.status(201).json(new ApiResponse(
        201,
        video,
        "Video published successfully"
    ))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }   
    const video = await Video.findById(videoId).populate('owner', 'username profilePicture')
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    return res.status(200).json(new ApiResponse(
        200,
        video,
        "Video retrieved successfully"
    ))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const { title, description } = req.body
    if (!title || title.trim() === "") {
        throw new ApiError(400, "Video title is required")
    }
    if (!description || description.trim() === "") {
        throw new ApiError(400, "Video description is required")
    }
    const video = await Video.findByIdAndUpdate(videoId, {
        title,
        description
    }, { new: true })
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    return res.status(200).json(new ApiResponse(
        200,
        video,
        "Video updated successfully"
    ))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findByIdAndDelete(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    return res.status(200).json(new ApiResponse(
        200,
        null,
        "Video deleted successfully"
    ))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    // TODO: toggle publish status of video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    video.isPublished = !video.isPublished
    await video.save()
    return res.status(200).json(new ApiResponse(
        200,
        video,
        `Video ${video.isPublished ? 'published' : 'unpublished'} successfully`
    ))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
