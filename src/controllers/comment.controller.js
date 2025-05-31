import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id,
    });

    return res.status(201).json(new ApiResponse(
        201,
        comment,
        "Comment added successfully"
    ));
});

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const comments = await Comment.find({ video: videoId })
        .populate("owner", "username profilePicture")
        .sort({ createdAt: -1 });

    if (!comments || comments.length === 0) {
        throw new ApiError(404, "No comments found for this video");
    }

    return res.status(200).json(new ApiResponse(
        200,
        comments,
        "Comments retrieved successfully"
    ));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment");
    }

    comment.content = content;
    await comment.save();

    return res.status(200).json(new ApiResponse(
        200,
        comment,
        "Comment updated successfully"
    ));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    await comment.remove();

    return res.status(200).json(new ApiResponse(
        200,
        { message: "Comment deleted successfully" },
        "Comment deleted"
    ));
});


export {
    addComment,
    getVideoComments,
    updateComment,
    deleteComment
};