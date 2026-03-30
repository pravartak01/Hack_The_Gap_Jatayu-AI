// Hazard type to Cloudinary folder mapping
// Distributes hazard evidence files to appropriate folders

const HAZARD_TO_CLOUDINARY_FOLDER = {
  // General hazards
  fire: "hazard-clips",
  robbery: "hazard-clips",
  accident: "hazard-clips",
  
  // Weapon-related hazards
  gun: "weapon-detection-clips",
  knife: "weapon-detection-clips",
  "weapon detection": "weapon-detection-clips",
  
  // Environmental/sanitation hazards
  "garbage dumping": "garbage-clips",
};

function normalizeHazardTypeForFolder(hazardType) {
  return String(hazardType || "")
    .trim()
    .toLowerCase();
}

function mapHazardTypeToCloudinaryFolder(hazardType) {
  const normalized = normalizeHazardTypeForFolder(hazardType);
  return HAZARD_TO_CLOUDINARY_FOLDER[normalized] || "hazard-clips"; // Default to hazard-clips
}

module.exports = {
  HAZARD_TO_CLOUDINARY_FOLDER,
  normalizeHazardTypeForFolder,
  mapHazardTypeToCloudinaryFolder,
};
