const { ROLES } = require("./roles");

const HAZARD_TO_DEPARTMENT = {
  fire: ROLES.FIRE,
  robbery: ROLES.POLICE,
  gun: ROLES.POLICE,
  knife: ROLES.POLICE,
  accident: ROLES.TRAFFIC,
  "garbage dumping": ROLES.MUNICIPAL,
};

function normalizeHazardType(type) {
  return String(type || "")
    .trim()
    .toLowerCase();
}

function mapHazardToDepartment(type) {
  return HAZARD_TO_DEPARTMENT[normalizeHazardType(type)] || null;
}

module.exports = {
  HAZARD_TO_DEPARTMENT,
  normalizeHazardType,
  mapHazardToDepartment,
};
