import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            // Do not throw an error here, just return null as no file was provided
            return null;
        }
        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        });
        //file has been uploaded successfully
        // console.log(`File uploaded successfully: ${response.url}`);
        
        // Only unlink if the upload was successful and localFilePath exists
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;
    } catch (error) {
        // Log the error but do not re-throw, and only unlink if the localFilePath exists
        console.error("Cloudinary upload failed:", error);
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath); // Delete the local file if upload fails
        }
        return null;
    }
}

const deleteImageFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Cloudinary delete failed:", error);
    }
}

export {
    uploadOnCloudinary,
    deleteImageFromCloudinary
}