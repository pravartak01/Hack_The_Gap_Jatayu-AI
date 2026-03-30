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

router.use(requireAuth);

<<<<<<< HEAD
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
=======
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
>>>>>>> 175bd4986ded804e540843440c3bbee5fae06e21

module.exports = router;
