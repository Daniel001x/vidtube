import { v2 as cloudinary } from 'cloudinary';
import fs from "node:fs";
import dotenv from 'dotenv';

dotenv.config();

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET  
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        
        console.log("File uploaded on Cloudinary. File src:", response.url);

        // Once the file is uploaded, delete it from the server 
        fs.unlinkSync(localFilePath);
        
        return response;
        
    } catch (error) {
        console.log("Error on Cloudinary:", error);
        console.log("Error message:", error.message);
        
        // Clean up the local file if it exists
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        
        throw error;  // THROW error instead of return null
    }
}

const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;
        
        const result = await cloudinary.uploader.destroy(publicId);
        console.log("Deleted from Cloudinary. Public ID:", publicId);
        
        return result;
        
    } catch (error) {
        console.log("Error deleting from Cloudinary:", error);
        return null;
    }
}

export { uploadOnCloudinary, deleteFromCloudinary };