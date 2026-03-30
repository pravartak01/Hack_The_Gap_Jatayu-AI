const express = require("express");
const { requireAuth, allowRoles } = require("../middlewares/auth.middleware");
const {
  createNotification,
  getNotifications,
} = require("../controllers/notification.controller");
const { ROLES } = require("../constants/roles");

const router = express.Router();

// GET - Public route (no authentication needed)
router.get("/", getNotifications);

// POST - Admin only route (protected)
router.post("/", requireAuth, allowRoles(ROLES.ADMIN), createNotification);

module.exports = router;
