import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_NAME,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    console.log("file upload has been started on cloudinary");
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file has been uploaded succesfully
    console.log("file has been uploaded on cloudinary", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null; //remove the locally saved temperory file
  }
};

const deleteOnCloudinary = async (Path) => {
  try {
    if (!Path) return null;
    const publicId = Path.split("/").pop().split(".")[0];
    const deletionResponse = await cloudinary.uploader.destroy(publicId);

    if (deletionResponse.result === "ok") {
      console.log(`Deleted ${imageUrl} from Cloudinary`);
    } else {
      console.log(`Failed to delete ${imageUrl} from Cloudinary`);
    }

    return;
  } catch (error) {
    console.log("Error in removing file from cloudinary", error);
    return;
  }
};

export { uploadOnCloudinary, deleteOnCloudinary };
