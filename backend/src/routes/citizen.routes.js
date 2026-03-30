const express = require("express");
const { requireAuth, allowRoles } = require("../middlewares/auth.middleware");
const { uploadMedia } = require("../middlewares/upload.middleware");
const { createComplaint, getMyCitizensComplaints, getComplaintDetail } = require("../controllers/citizen.controller");
// const { ROLES } = require("../constants/roles");

const router = express.Router();

router.use(requireAuth);

// Debug endpoint to see what multer receives
router.post("/complaints-debug", uploadMedia, (req, res) => {
  console.log("\n[DEBUG ENDPOINT] Multer received:");
  console.log("req.body:", req.body);
  console.log("req.files:", req.files ? req.files.map(f => ({
    fieldname: f.fieldname,
    originalname: f.originalname,
    mimetype: f.mimetype,
    size: f.size,
    hasBuffer: !!f.buffer,
  })) : undefined);
  
  res.json({
    body: req.body,
    files: req.files ? req.files.map(f => ({
      fieldname: f.fieldname,
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
    })) : [],
  });
});

router.post("/complaints", uploadMedia, createComplaint);
router.get("/complaints", getMyCitizensComplaints);
router.get("/complaints/:complaintId", getComplaintDetail);

module.exports = router;
