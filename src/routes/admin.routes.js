const express = require("express");
const { requireAuth, allowRoles } = require("../middlewares/auth.middleware");
const {
  createHazard,
  getHazards,
  routeHazard,
  getAllIssues,
  getAdminDashboard,
} = require("../controllers/admin.controller");
const { ROLES } = require("../constants/roles");

const router = express.Router();

router.use(requireAuth, allowRoles(ROLES.ADMIN));

router.get("/dashboard", getAdminDashboard);
router.post("/hazards", createHazard);
router.get("/hazards", getHazards);
router.post("/route-hazard", routeHazard);
router.get("/all-issues", getAllIssues);

module.exports = router;
