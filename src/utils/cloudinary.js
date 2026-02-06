import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "./ApiError.js";
import fs from "fs"
import dotenv from "dotenv"

dotenv.config({
    path:"./.env"
})


console.log(
  "Cloudinary config",
  process.env.CLOUDINARY_CLOUD_NAME,
  process.env.CLOUDINARY_API_KEY,
  process.env.CLOUDINARY_API_SECRET?.length // just length, not the secret
);


cloudinary.config({ 
  cloud_name: process.env?.CLOUDINARY_CLOUD_NAME , 
  api_key: process.env?.CLOUDINARY_API_KEY, 
  api_secret: process.env?.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (fileURL) => {
  if (!fileURL) {
    throw new ApiError(403, "file is required!");
  }

  try {
    const response = await cloudinary.uploader.upload(fileURL, {
      resource_type: "auto",
    });

    console.log("Cloudinary upload OK", response.url);
    return response;

  } catch (error) {

    console.error("Cloudinary upload failed:", error);
    throw new ApiError(404, "Cloudinary upload error", error);

  } finally {

    if (fs.existsSync(fileURL)) {
      fs.unlinkSync(fileURL);
    }
  }
};


export {uploadOnCloudinary}