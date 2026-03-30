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

async function fetchHazardVideosFromFolder({ folder, maxResults = 30, nextCursor }) {
  const isConfigured = configureCloudinary();
  if (!isConfigured) {
    const error = new Error("Cloudinary is not configured");
    error.statusCode = 500;
    throw error;
  }

  const params = {
    type: "upload",
    resource_type: "video",
    prefix: `${folder.replace(/\/+$/, "")}/`,
    max_results: Math.min(Math.max(Number(maxResults) || 30, 1), 100),
  };

  if (nextCursor) {
    params.next_cursor = nextCursor;
  }

  const response = await cloudinary.api.resources(params);

  return {
    resources: response.resources || [],
    nextCursor: response.next_cursor || null,
  };
}

async function fetchHazardVideosByType({ hazardType, maxResults = 30, nextCursor }) {
  const folder = mapHazardTypeToCloudinaryFolder(hazardType);
  console.log(`[fetchHazardVideosByType] Fetching videos from folder: ${folder} for hazardType: ${hazardType}`);
  return await fetchHazardVideosFromFolder({ folder, maxResults, nextCursor });
}

module.exports = {
  hasCloudinaryConfig,
  fetchHazardVideosFromFolder,
  fetchHazardVideosByType,
};
