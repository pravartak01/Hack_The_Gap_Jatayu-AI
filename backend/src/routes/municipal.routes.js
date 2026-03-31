const express = require("express");
const { requireAuth, allowRoles } = require("../middlewares/auth.middleware");
const {
  getAssignedIssues,
  updateStatus,
  addUpdate,
  resolveIssue,
  getDepartmentDashboard,
} = require("../controllers/department.controller");
const { ROLES } = require("../constants/roles");

const router = express.Router();

router.use(requireAuth, allowRoles(ROLES.MUNICIPAL));

router.get("/dashboard", getDepartmentDashboard);
router.get("/assigned-issues", getAssignedIssues);
router.patch("/update-status", updateStatus);
router.post("/add-update", addUpdate);
router.post("/resolve-issue", resolveIssue);

module.exports = router;