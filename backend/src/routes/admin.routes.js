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

router.get("/dashboard", getAdminDashboard);
router.get("/cloudinary-videos", getCloudinaryHazardVideos);
router.get("/cloudinary-videos-by-type", getCloudinaryHazardVideosByType);
router.post("/import-cloudinary-hazard", importCloudinaryHazard);
router.post("/hazards", createHazard);
router.get("/hazards", getHazards);
router.post("/route-hazard", routeHazard);
router.get("/all-issues", getAllIssues);
router.get("/complaints", getAllComplaints);
router.get("/complaints/pending", getPendingComplaints);
router.patch("/complaints/status", updateComplaintStatus);
router.post("/complaints/route", routeComplaintToDepartment);
router.post("/test-hazard-alert", testHazardAlert);

module.exports = router;
