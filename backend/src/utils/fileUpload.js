const { v2: cloudinary } = require("cloudinary");
const { mapHazardTypeToCloudinaryFolder } = require("../constants/hazardCloudinaryFolders");

function hasCloudinaryConfig() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function configureCloudinary() {
  if (!hasCloudinaryConfig()) {
    return false;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return true;
}

async function uploadToCloudinary(fileBuffer, fileName, resourceType = "auto", folder = "complaints") {
  console.log(`[uploadToCloudinary] Starting upload: fileName=${fileName}, resourceType=${resourceType}, folder=${folder}`);
  const isConfigured = configureCloudinary();
  if (!isConfigured) {
    const error = new Error("Cloudinary is not configured");
    error.statusCode = 500;
    throw error;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: folder,
        public_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
      (error, result) => {
        if (error) {
          console.error(`[uploadToCloudinary] Error uploading ${fileName}:`, error.message);
          return reject(error);
        }
        console.log(`[uploadToCloudinary] Successfully uploaded: ${fileName}, url: ${result.secure_url}`);
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
}

async function uploadComplaintMedia(fileBuffer, fileName, resourceType = "auto") {
  const result = await uploadToCloudinary(fileBuffer, fileName, resourceType, "complaints");
  return {
    url: result.secure_url,
    publicId: result.public_id,
    type: resourceType === "video" ? "video" : "image",
  };
}

async function uploadHazardMedia(fileBuffer, fileName, hazardType, resourceType = "auto") {
  const folder = mapHazardTypeToCloudinaryFolder(hazardType);
  console.log(`[uploadHazardMedia] Uploading to folder: ${folder} for hazardType: ${hazardType}`);
  const result = await uploadToCloudinary(fileBuffer, fileName, resourceType, folder);
  return {
    url: result.secure_url,
    publicId: result.public_id,
    type: resourceType === "video" ? "video" : "image",
    folder: folder,
  };
}

module.exports = {
  hasCloudinaryConfig,
  uploadToCloudinary,
  uploadComplaintMedia,
  uploadHazardMedia,
};
