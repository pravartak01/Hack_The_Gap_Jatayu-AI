const Hazard = require("../models/Hazard");
const Issue = require("../models/Issue");
const ActivityLog = require("../models/ActivityLog");
const Complaint = require("../models/Complaint");
const { mapHazardToDepartment, normalizeHazardType } = require("../constants/hazardRouting");
const { generateIssueId } = require("../utils/issueId");
const { fetchHazardVideosFromFolder, fetchHazardVideosByType } = require("../utils/cloudinary");
const { sendHazardAlertEmail } = require("../utils/mailer");
const { HAZARD_ALERT_EMAILS } = require("../constants/alertEmails");

async function createHazard(req, res) {
  const { type, evidenceUrl, location, timestamp } = req.body;

  if (!type || !evidenceUrl || !location) {
    return res.status(400).json({ message: "type, evidenceUrl and location are required" });
  }

  const hazard = await Hazard.create({
    type: normalizeHazardType(type),
    evidenceUrl,
    location,
    timestamp: timestamp || new Date(),
  });

  return res.status(201).json({ message: "Hazard received", hazard });
}

async function getHazards(req, res) {
  const hazards = await Hazard.find().sort({ createdAt: -1 });
  return res.status(200).json({ hazards });
}

async function routeHazard(req, res) {
  const { hazardId } = req.body;

  if (!hazardId) {
    return res.status(400).json({ message: "hazardId is required" });
  }

  const hazard = await Hazard.findById(hazardId);
  if (!hazard) {
    return res.status(404).json({ message: "Hazard not found" });
  }

  if (hazard.routed && hazard.issueId) {
    const existingIssue = await Issue.findOne({ issueId: hazard.issueId });
    return res.status(200).json({ message: "Hazard already routed", issue: existingIssue });
  }

  const assignedDepartment = mapHazardToDepartment(hazard.type);
  if (!assignedDepartment) {
    return res.status(422).json({ message: "No routing rule for this hazard type" });
  }

  const issueId = generateIssueId();

  const issue = await Issue.create({
    issueId,
    hazard: hazard._id,
    hazardType: hazard.type,
    assignedDepartment,
    status: "Pending",
    evidenceUrl: hazard.evidenceUrl,
    location: hazard.location,
    logs: [
      {
        message: `Issue created and routed to ${assignedDepartment}`,
        action: "ROUTED",
        createdBy: {
          userId: req.user._id,
          role: req.user.role,
          name: req.user.name,
        },
      },
    ],
  });

  await ActivityLog.create({
    issue: issue._id,
    issueId: issue.issueId,
    action: "ROUTED",
    message: `Hazard routed to ${assignedDepartment}`,
    actor: {
      userId: req.user._id,
      name: req.user.name,
      role: req.user.role,
    },
    metadata: {
      hazardId: String(hazard._id),
      hazardType: hazard.type,
    },
  });

  hazard.routed = true;
  hazard.routedDepartment = assignedDepartment;
  hazard.issueId = issue.issueId;
  await hazard.save();

  return res.status(201).json({ message: "Hazard routed successfully", issue });
}

async function getAllComplaints(req, res) {
  const complaints = await Complaint.find().sort({ createdAt: -1 });
  return res.status(200).json({ complaints });
}

async function getPendingComplaints(req, res) {
  const complaints = await Complaint.find({ status: "Pending" }).sort({ createdAt: -1 });
  return res.status(200).json({ complaints });
}

async function updateComplaintStatus(req, res) {
  const { complaintId, status } = req.body;

  if (!complaintId || !status) {
    return res.status(400).json({ message: "complaintId and status are required" });
  }

  if (!["Pending", "Under Review", "Routed", "Resolved"].includes(status)) {
    return res.status(400).json({
      message: "status must be Pending, Under Review, Routed or Resolved",
    });
  }

  const complaint = await Complaint.findOne({ complaintId });
  if (!complaint) {
    return res.status(404).json({ message: "Complaint not found" });
  }

  complaint.status = status;
  complaint.logs.push({
    message: `Status updated to ${status}`,
    action: "STATUS_UPDATED",
    createdBy: {
      userId: req.user._id,
      role: req.user.role,
      name: req.user.name,
    },
  });

  await complaint.save();
  return res.status(200).json({ message: "Complaint status updated", complaint });
}

async function routeComplaintToDepartment(req, res) {
  const { complaintId, category, department } = req.body;

  if (!complaintId || !category || !department) {
    return res.status(400).json({ message: "complaintId, category and department are required" });
  }

  const complaint = await Complaint.findOne({ complaintId });
  if (!complaint) {
    return res.status(404).json({ message: "Complaint not found" });
  }

  if (complaint.issueId) {
    const existingIssue = await Issue.findOne({ issueId: complaint.issueId });
    return res.status(200).json({ message: "Complaint already routed", issue: existingIssue });
  }

  const issueId = generateIssueId();

  const issue = await Issue.create({
    issueId,
    hazard: null,
    hazardType: String(category).toLowerCase().trim(),
    assignedDepartment: String(department).toUpperCase().trim(),
    status: "Pending",
    evidenceUrl: complaint.media.length > 0 ? complaint.media[0].url : "",
    location: {
      address: `Complaint from ${complaint.citizenName}`,
      coordinates: { lat: 0, lng: 0 },
    },
    logs: [
      {
        message: `Issue created from complaint and routed to ${department}`,
        action: "ROUTED_FROM_COMPLAINT",
        createdBy: {
          userId: req.user._id,
          role: req.user.role,
          name: req.user.name,
        },
      },
    ],
  });

  await ActivityLog.create({
    issue: issue._id,
    issueId: issue.issueId,
    action: "ROUTED_FROM_COMPLAINT",
    message: `Complaint routed to ${department}`,
    actor: {
      userId: req.user._id,
      name: req.user.name,
      role: req.user.role,
    },
    metadata: {
      complaintId: complaint.complaintId,
      category,
      citizenEmail: complaint.citizenEmail,
    },
  });

  complaint.category = String(category).toLowerCase().trim();
  complaint.assignedDepartment = String(department).toUpperCase().trim();
  complaint.status = "Routed";
  complaint.issueId = issue.issueId;
  complaint.logs.push({
    message: `Routed to ${department}`,
    action: "ROUTED",
    createdBy: {
      userId: req.user._id,
      role: req.user.role,
      name: req.user.name,
    },
  });

  await complaint.save();

  return res.status(201).json({
    message: "Complaint routed to department successfully",
    issue,
    complaint,
  });
}

async function getAllIssues(req, res) {
  const issues = await Issue.find().populate("hazard").sort({ createdAt: -1 });
  return res.status(200).json({ issues });
}

async function getAdminDashboard(req, res) {
  const [totalHazards, totalIssues, pending, ongoing, resolved] = await Promise.all([
    Hazard.countDocuments(),
    Issue.countDocuments(),
    Issue.countDocuments({ status: "Pending" }),
    Issue.countDocuments({ status: "Ongoing" }),
    Issue.countDocuments({ status: "Resolved" }),
  ]);

  return res.status(200).json({
    role: "ADMIN",
    metrics: {
      totalHazards,
      totalIssues,
      pending,
      ongoing,
      resolved,
    },
  });
}

async function getCloudinaryHazardVideos(req, res) {
  const folder = String(req.query.folder || process.env.CLOUDINARY_HAZARD_FOLDER || "hazards").trim();
  const maxResults = Number(req.query.maxResults || 30);
  const nextCursor = req.query.nextCursor ? String(req.query.nextCursor) : undefined;

  if (!folder) {
    return res.status(400).json({ message: "folder is required" });
  }

  const { resources, nextCursor: cursor } = await fetchHazardVideosFromFolder({
    folder,
    maxResults,
    nextCursor,
  });

  const videos = resources.map((item) => ({
    publicId: item.public_id,
    secureUrl: item.secure_url,
    thumbnailUrl: item.thumbnail_url || null,
    duration: item.duration || null,
    bytes: item.bytes || null,
    format: item.format || null,
    createdAt: item.created_at || null,
  }));

  return res.status(200).json({
    folder,
    count: videos.length,
    nextCursor: cursor,
    videos,
  });
}

async function importCloudinaryHazard(req, res) {
  const { publicId, secureUrl, type, location, timestamp } = req.body;

  if (!publicId || !secureUrl || !type || !location) {
    return res
      .status(400)
      .json({ message: "publicId, secureUrl, type and location are required" });
  }

  const normalizedType = normalizeHazardType(type);

  const existingHazard = await Hazard.findOne({
    $or: [{ evidencePublicId: String(publicId).trim() }, { evidenceUrl: String(secureUrl).trim() }],
  });

  if (existingHazard) {
    return res.status(409).json({
      message: "This Cloudinary video is already imported",
      hazard: existingHazard,
    });
  }

  const hazard = await Hazard.create({
    type: normalizedType,
    evidenceUrl: String(secureUrl).trim(),
    evidenceProvider: "cloudinary",
    evidencePublicId: String(publicId).trim(),
    source: "cloudinary-folder",
    location,
    timestamp: timestamp || new Date(),
  });

  return res.status(201).json({
    message: "Cloudinary video imported as hazard",
    hazard,
  });
}

async function testHazardAlert(req, res) {
  const { hazardType, location, description } = req.body;

  if (!hazardType) {
    return res.status(400).json({ message: "hazardType is required" });
  }

  if (HAZARD_ALERT_EMAILS.length === 0) {
    return res.status(400).json({
      message: "No email recipients configured. Please add emails to HAZARD_ALERT_EMAILS in constants/alertEmails.js",
    });
  }

  try {
    const info = await sendHazardAlertEmail({
      recipients: HAZARD_ALERT_EMAILS,
      hazardType: String(hazardType).trim(),
      location: location ? String(location).trim() : "Not specified",
      description: description ? String(description).trim() : "Test hazard alert",
    });

    return res.status(200).json({
      message: "Hazard alert email sent successfully",
      emailsCount: HAZARD_ALERT_EMAILS.length,
      recipients: HAZARD_ALERT_EMAILS,
      mailInfo: process.env.SMTP_HOST ? info : { jsonTransport: true, message: "Email sent via JSON transport (dev mode)" },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to send hazard alert email",
      error: error.message,
    });
  }
}

async function getCloudinaryHazardVideosByType(req, res) {
  const { hazardType } = req.query;
  const maxResults = Number(req.query.maxResults || 30);
  const nextCursor = req.query.nextCursor ? String(req.query.nextCursor) : undefined;

  if (!hazardType) {
    return res.status(400).json({ message: "hazardType query parameter is required" });
  }

  try {
    const { resources, nextCursor: cursor } = await fetchHazardVideosByType({
      hazardType: String(hazardType).trim(),
      maxResults,
      nextCursor,
    });

    const videos = resources.map((item) => ({
      publicId: item.public_id,
      secureUrl: item.secure_url,
      thumbnailUrl: item.thumbnail_url || null,
      duration: item.duration || null,
      bytes: item.bytes || null,
      format: item.format || null,
      createdAt: item.created_at || null,
    }));

    return res.status(200).json({
      hazardType: String(hazardType).trim(),
      count: videos.length,
      nextCursor: cursor,
      videos,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch hazard videos by type",
      error: error.message,
    });
  }
}

module.exports = {
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
};
