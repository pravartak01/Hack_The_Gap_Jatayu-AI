const express = require("express");
const { requireAuth, allowRoles } = require("../middlewares/auth.middleware");
const { ROLES } = require("../constants/roles");
const { getAdminDashboard } = require("../controllers/admin.controller");
const { getDepartmentDashboard } = require("../controllers/department.controller");

const router = express.Router();

router.get("/admin", requireAuth, allowRoles(ROLES.ADMIN), getAdminDashboard);
router.get("/fire", requireAuth, allowRoles(ROLES.FIRE), getDepartmentDashboard);
router.get("/police", requireAuth, allowRoles(ROLES.POLICE), getDepartmentDashboard);
router.get("/traffic", requireAuth, allowRoles(ROLES.TRAFFIC), getDepartmentDashboard);
router.get("/municipal", requireAuth, allowRoles(ROLES.MUNICIPAL), getDepartmentDashboard);

module.exports = router;
