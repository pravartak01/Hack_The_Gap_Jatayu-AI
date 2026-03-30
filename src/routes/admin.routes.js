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
} = require("../controllers/admin.controller");
const { ROLES } = require("../constants/roles");

const router = express.Router();

router.use(requireAuth, allowRoles(ROLES.ADMIN));

router.get("/dashboard", getAdminDashboard);
router.get("/cloudinary-videos", getCloudinaryHazardVideos);
router.post("/import-cloudinary-hazard", importCloudinaryHazard);
router.post("/hazards", createHazard);
router.get("/hazards", getHazards);
router.post("/route-hazard", routeHazard);
router.get("/all-issues", getAllIssues);

module.exports = router;
