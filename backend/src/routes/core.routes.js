const express = require("express");
const { requireAuth, allowRoles } = require("../middlewares/auth.middleware");
const { ROLES } = require("../constants/roles");
const { getHazards, routeHazard, getAllIssues } = require("../controllers/admin.controller");
const {
  getAssignedIssues,
  updateStatus,
  addUpdate,
  resolveIssue,
} = require("../controllers/department.controller");

const router = express.Router();

router.get("/hazards", requireAuth, allowRoles(ROLES.ADMIN), getHazards);
router.post("/route-hazard", requireAuth, allowRoles(ROLES.ADMIN), routeHazard);
router.get("/all-issues", requireAuth, allowRoles(ROLES.ADMIN), getAllIssues);

router.get(
  "/assigned-issues",
  requireAuth,
  allowRoles(ROLES.FIRE, ROLES.POLICE, ROLES.TRAFFIC, ROLES.MUNICIPAL),
  getAssignedIssues
);
router.patch(
  "/update-status",
  requireAuth,
  allowRoles(ROLES.FIRE, ROLES.POLICE, ROLES.TRAFFIC, ROLES.MUNICIPAL),
  updateStatus
);
router.post(
  "/add-update",
  requireAuth,
  allowRoles(ROLES.FIRE, ROLES.POLICE, ROLES.TRAFFIC, ROLES.MUNICIPAL),
  addUpdate
);
router.post(
  "/resolve-issue",
  requireAuth,
  allowRoles(ROLES.FIRE, ROLES.POLICE, ROLES.TRAFFIC, ROLES.MUNICIPAL),
  resolveIssue
);

module.exports = router;
