const express = require("express");
const { requireAuth, allowRoles } = require("../middlewares/auth.middleware");
const {
  createHazard,
  getHazards,
  routeHazard,
  getAllIssues,
  getAdminDashboard,
  getCloudinaryHazardVideos,
  getCloudinaryHazardVideosByType,
  getHazardVideosFire,
  getHazardVideosWeapon,
  getHazardVideosGarbage,
  importCloudinaryHazard,
  getAllComplaints,
  getPendingComplaints,
  updateComplaintStatus,
  routeComplaintToDepartment,
  testHazardAlert,
} = require("../controllers/admin.controller");
const { ROLES } = require("../constants/roles");

const router = express.Router();

router.use(requireAuth, allowRoles(ROLES.ADMIN));

// Dashboard & Core
router.get("/dashboard", getAdminDashboard);

// Hazard Management
router.post("/hazards", createHazard);
router.get("/hazards", getHazards);
router.post("/route-hazard", routeHazard);

// Cloudinary Video Fetching - Generic & By Type
router.get("/cloudinary-videos", getCloudinaryHazardVideos);
router.get("/cloudinary-videos-by-type", getCloudinaryHazardVideosByType);

// Cloudinary Videos - Hazard Type Specific Routes
router.get("/videos/fire", getHazardVideosFire);
router.get("/videos/weapon", getHazardVideosWeapon);
router.get("/videos/garbage", getHazardVideosGarbage);

// Cloudinary Import
router.post("/import-cloudinary-hazard", importCloudinaryHazard);

// Issues
router.get("/all-issues", getAllIssues);

// Complaints
router.get("/complaints", getAllComplaints);
router.get("/complaints/pending", getPendingComplaints);
router.patch("/complaints/status", updateComplaintStatus);
router.post("/complaints/route", routeComplaintToDepartment);

// Hazard Alerts
router.post("/test-hazard-alert", testHazardAlert);


module.exports = router;
