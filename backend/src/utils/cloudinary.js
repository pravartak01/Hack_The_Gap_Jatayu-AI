const { v2: cloudinary } = require("cloudinary");
const { mapHazardTypeToCloudinaryFolder } = require("../constants/hazardCloudinaryFolders");

const folderCache = new Map();
const CACHE_TTL_MS = Number(process.env.CLOUDINARY_VIDEO_CACHE_TTL_MS || 5 * 60 * 1000);

function extractCloudinaryError(error) {
  const httpCode =
    error?.error?.http_code || error?.http_code || error?.statusCode || null;
  const message =
    error?.error?.message || error?.message || "Cloudinary request failed";

  return { httpCode, message };
}

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

  const cacheKey = `${params.prefix}|${params.max_results}|${params.next_cursor || ""}`;

  try {
    const response = await cloudinary.api.resources(params);
    const payload = {
      resources: response.resources || [],
      nextCursor: response.next_cursor || null,
      warning: null,
      cache: "miss",
    };

    folderCache.set(cacheKey, {
      payload,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return payload;
  } catch (error) {
    const { httpCode, message } = extractCloudinaryError(error);
    const cached = folderCache.get(cacheKey);
    const hasFreshCache = cached && cached.expiresAt > Date.now();

    if (httpCode === 420 || httpCode === 429) {
      if (hasFreshCache) {
        return {
          ...cached.payload,
          warning: `Cloudinary rate limit reached. Serving cached results. ${message}`,
          cache: "hit",
        };
      }

      return {
        resources: [],
        nextCursor: null,
        warning: `Cloudinary rate limit reached. ${message}`,
        cache: "empty",
      };
    }

    const normalizedError = new Error(message);
    normalizedError.statusCode = httpCode || 500;
    throw normalizedError;
  }
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
