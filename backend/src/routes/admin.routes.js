const express = require("express");
const { requireAuth, allowRoles } = require("../middlewares/auth.middleware");
const {
  createHazard,
  getHazards,
  routeHazard,
  getAllIssues,
  getAdminDashboard,
  getCloudinaryHazardVideos,
  importCloudinaryHazard,
  getAllComplaints,
  getPendingComplaints,
  updateComplaintStatus,
  routeComplaintToDepartment,
  testHazardAlert,
} = require("../controllers/admin.controller");
const { ROLES } = require("../constants/roles");

const router = express.Router();

router.use(requireAuth);

router.get("/dashboard", allowRoles(ROLES.ADMIN), getAdminDashboard);
router.get("/cloudinary-videos", allowRoles(ROLES.ADMIN), getCloudinaryHazardVideos);
router.post("/import-cloudinary-hazard", allowRoles(ROLES.ADMIN), importCloudinaryHazard);
router.post("/hazards", allowRoles(ROLES.ADMIN), createHazard);
router.get("/hazards", allowRoles(ROLES.ADMIN), getHazards);
router.post("/route-hazard", allowRoles(ROLES.ADMIN), routeHazard);
router.get("/all-issues", allowRoles(ROLES.ADMIN), getAllIssues);
router.get("/complaints", allowRoles(ROLES.ADMIN, ROLES.MUNICIPAL), getAllComplaints);
router.get("/complaints/pending", allowRoles(ROLES.ADMIN, ROLES.MUNICIPAL), getPendingComplaints);
router.patch("/complaints/status", allowRoles(ROLES.ADMIN, ROLES.MUNICIPAL), updateComplaintStatus);
router.post("/complaints/route", allowRoles(ROLES.ADMIN, ROLES.MUNICIPAL), routeComplaintToDepartment);
router.post("/test-hazard-alert", allowRoles(ROLES.ADMIN), testHazardAlert);

module.exports = router;
