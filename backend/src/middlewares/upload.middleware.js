const multer = require("multer");

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("File must be an image"), false);
  }
};

const videoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("File must be a video"), false);
  }
};

const mediaFilter = (req, file, cb) => {
  console.log(`[uploadMedia filter] Processing field: "${file.fieldname}", mimetype: ${file.mimetype}`);
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("File must be an image or video"), false);
  }
};

const storage = multer.memoryStorage();

const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadVideo = multer({
  storage,
  fileFilter: videoFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

const uploadMedia = multer({
  storage,
  fileFilter: mediaFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

module.exports = {
  uploadImage: uploadImage.single("file"),
  uploadImages: uploadImage.array("files", 10),
  uploadVideo: uploadVideo.single("file"),
  uploadMedia: uploadMedia.any(),
};
