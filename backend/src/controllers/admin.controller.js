const Hazard = require("../models/Hazard");
const Issue = require("../models/Issue");
const ActivityLog = require("../models/ActivityLog");
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const { ROLES } = require("../constants/roles");
const { normalizeHazardType } = require("../constants/hazardRouting");
const { generateIssueId } = require("../utils/issueId");
const { fetchHazardVideosFromFolder, fetchHazardVideosByType } = require("../utils/cloudinary");
const { sendHazardAlertEmail } = require("../utils/mailer");
const { HAZARD_ALERT_EMAILS } = require("../constants/alertEmails");

function getErrorMessage(error, fallback = "Request failed") {
  return error?.message || error?.error?.message || fallback;
}

function toFiniteNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function haversineDistanceKm(fromLat, fromLng, toLat, toLng) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

async function getNearestRecipientEmails({ latitude, longitude, maxRecipients = 10 }) {
  const lat = toFiniteNumber(latitude);
  const lng = toFiniteNumber(longitude);

  if (lat === null || lng === null) {
    return [];
  }

  const users = await User.find({ role: ROLES.CITIZEN })
    .select("email locations role")
    .lean();

  const candidates = users
    .map((user) => {
      if (!user?.email || !Array.isArray(user.locations) || user.locations.length === 0) {
        return null;
      }

      const latestLocation = user.locations[user.locations.length - 1];
      const userLat = toFiniteNumber(latestLocation?.latitude);
      const userLng = toFiniteNumber(latestLocation?.longitude);

      if (userLat === null || userLng === null) {
        return null;
      }

      return {
        email: String(user.email).trim().toLowerCase(),
        distanceKm: haversineDistanceKm(lat, lng, userLat, userLng),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const uniqueEmails = [];
  const seen = new Set();

  for (const candidate of candidates) {
    if (!candidate.email || seen.has(candidate.email)) continue;
    seen.add(candidate.email);
    uniqueEmails.push(candidate.email);
    if (uniqueEmails.length >= maxRecipients) break;
  }

  return uniqueEmails;
}

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
  const { hazardId, department, departments } = req.body;

  if (!hazardId) {
    return res.status(400).json({ message: "hazardId is required" });
  }

  const selectedDepartment = String(
    department || (Array.isArray(departments) && departments.length ? departments[0] : "")
  )
    .toUpperCase()
    .trim();

  const allowedDepartments = [ROLES.POLICE, ROLES.FIRE, ROLES.TRAFFIC, ROLES.MUNICIPAL];
  if (!allowedDepartments.includes(selectedDepartment)) {
    return res.status(400).json({
      message: "department is required and must be POLICE, FIRE, TRAFFIC or MUNICIPAL",
    });
  }

  const hazard = await Hazard.findById(hazardId);
  if (!hazard) {
    return res.status(404).json({ message: "Hazard not found" });
  }

  if (hazard.routed && hazard.issueId) {
    const existingIssue = await Issue.findOne({ issueId: hazard.issueId });

    if (!existingIssue) {
      hazard.routed = false;
      hazard.routedDepartment = null;
      hazard.issueId = null;
      await hazard.save();
    } else {
      const previousDepartment = existingIssue.assignedDepartment;
      if (previousDepartment === selectedDepartment) {
        return res.status(200).json({ message: "Hazard already routed", issue: existingIssue });
      }

      existingIssue.assignedDepartment = selectedDepartment;
      if (existingIssue.status === "Resolved") {
        existingIssue.status = "Pending";
      }
      existingIssue.logs.push({
        message: `Issue reassigned from ${previousDepartment} to ${selectedDepartment}`,
        action: "REASSIGNED",
        createdBy: {
          userId: req.user._id,
          role: req.user.role,
          name: req.user.name,
        },
      });

      await existingIssue.save();

      await ActivityLog.create({
        issue: existingIssue._id,
        issueId: existingIssue.issueId,
        action: "REASSIGNED",
        message: `Hazard reassigned from ${previousDepartment} to ${selectedDepartment}`,
        actor: {
          userId: req.user._id,
          name: req.user.name,
          role: req.user.role,
        },
        metadata: {
          hazardId: String(hazard._id),
          hazardType: hazard.type,
          fromDepartment: previousDepartment,
          toDepartment: selectedDepartment,
        },
      });

      hazard.routedDepartment = selectedDepartment;
      hazard.issueId = existingIssue.issueId;
      hazard.routed = true;
      await hazard.save();

      return res.status(200).json({
        message: "Hazard re-routed successfully",
        issue: existingIssue,
      });
    }
  }

  const issueId = generateIssueId();

  const issue = await Issue.create({
    issueId,
    hazard: hazard._id,
    hazardType: hazard.type,
    assignedDepartment: selectedDepartment,
    status: "Pending",
    evidenceUrl: hazard.evidenceUrl,
    location: hazard.location,
    logs: [
      {
        message: `Issue created and routed to ${selectedDepartment}`,
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
    message: `Hazard routed to ${selectedDepartment}`,
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
  hazard.routedDepartment = selectedDepartment;
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

  const normalizedCategory = String(category).toLowerCase().trim();
  const normalizedDepartment = String(department).toUpperCase().trim();
  const allowedDepartments = [ROLES.POLICE, ROLES.FIRE, ROLES.TRAFFIC, ROLES.MUNICIPAL];

  if (!allowedDepartments.includes(normalizedDepartment)) {
    return res.status(400).json({ message: "department must be POLICE, FIRE, TRAFFIC or MUNICIPAL" });
  }

  const complaint = await Complaint.findOne({ complaintId });
  if (!complaint) {
    return res.status(404).json({ message: "Complaint not found" });
  }

  if (complaint.issueId) {
    const existingIssue = await Issue.findOne({ issueId: complaint.issueId });

    // If an issue already exists for this complaint, allow reassignment to a new department.
    if (existingIssue) {
      const previousDepartment = existingIssue.assignedDepartment;
      const previousDepartmentLabel = previousDepartment || "UNASSIGNED";

      if (existingIssue.assignedDepartment !== normalizedDepartment) {
        existingIssue.assignedDepartment = normalizedDepartment;
        if (existingIssue.status === "Resolved") {
          existingIssue.status = "Pending";
        }

        existingIssue.logs.push({
          message: `Issue reassigned from ${previousDepartmentLabel} to ${normalizedDepartment}`,
          action: "REASSIGNED",
          createdBy: {
            userId: req.user._id,
            role: req.user.role,
            name: req.user.name,
          },
        });

        await existingIssue.save();

        await ActivityLog.create({
          issue: existingIssue._id,
          issueId: existingIssue.issueId,
          action: "REASSIGNED_FROM_COMPLAINT",
          message: `Complaint reassigned from ${previousDepartmentLabel} to ${normalizedDepartment}`,
          actor: {
            userId: req.user._id,
            name: req.user.name,
            role: req.user.role,
          },
          metadata: {
            complaintId: complaint.complaintId,
            category: normalizedCategory,
            fromDepartment: previousDepartment,
            toDepartment: normalizedDepartment,
          },
        });
      }

      complaint.category = normalizedCategory;
      complaint.assignedDepartment = normalizedDepartment;
      complaint.status = "Routed";
      complaint.logs.push({
        message:
          previousDepartment !== normalizedDepartment
            ? `Re-routed to ${normalizedDepartment}`
            : `Routing confirmed for ${normalizedDepartment}`,
        action: previousDepartment !== normalizedDepartment ? "REROUTED" : "ROUTED",
        createdBy: {
          userId: req.user._id,
          role: req.user.role,
          name: req.user.name,
        },
      });

      await complaint.save();

      return res.status(200).json({
        message:
          previousDepartment !== normalizedDepartment
            ? "Complaint re-routed to department successfully"
            : "Complaint already routed to this department",
        issue: existingIssue,
        complaint,
      });
    }
  }

  const issueId = generateIssueId();

  const issue = await Issue.create({
    issueId,
    hazard: null,
    hazardType: normalizedCategory,
    assignedDepartment: normalizedDepartment,
    status: "Pending",
    evidenceUrl: complaint.media.length > 0 ? complaint.media[0].url : "",
    location: {
      address: `Complaint from ${complaint.citizenName}`,
      coordinates: { lat: 0, lng: 0 },
    },
    logs: [
      {
        message: `Issue created from complaint and routed to ${normalizedDepartment}`,
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
    message: `Complaint routed to ${normalizedDepartment}`,
    actor: {
      userId: req.user._id,
      name: req.user.name,
      role: req.user.role,
    },
    metadata: {
      complaintId: complaint.complaintId,
      category: normalizedCategory,
      citizenEmail: complaint.citizenEmail,
    },
  });

  complaint.category = normalizedCategory;
  complaint.assignedDepartment = normalizedDepartment;
  complaint.status = "Routed";
  complaint.issueId = issue.issueId;
  complaint.logs.push({
    message: `Routed to ${normalizedDepartment}`,
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

async function resolveIssueByAdmin(req, res) {
  const { issueId, resolutionNote } = req.body;

  if (!issueId) {
    return res.status(400).json({ message: "issueId is required" });
  }

  const issue = await Issue.findOne({ issueId: String(issueId).trim() });
  if (!issue) {
    return res.status(404).json({ message: "Issue not found" });
  }

  if (issue.status === "Resolved") {
    return res.status(200).json({ message: "Issue is already resolved", issue });
  }

  issue.status = "Resolved";
  issue.logs.push({
    message: resolutionNote || "Issue marked as resolved by admin",
    action: "RESOLVED_BY_ADMIN",
    createdBy: {
      userId: req.user._id,
      role: req.user.role,
      name: req.user.name,
    },
  });
  await issue.save();

  await ActivityLog.create({
    issue: issue._id,
    issueId: issue.issueId,
    action: "RESOLVED_BY_ADMIN",
    message: resolutionNote || "Issue marked as resolved by admin",
    actor: {
      userId: req.user._id,
      name: req.user.name,
      role: req.user.role,
    },
  });

  const complaint = await Complaint.findOne({ issueId: issue.issueId });
  if (complaint) {
    complaint.status = "Resolved";
    complaint.logs.push({
      message: "Complaint marked as resolved by admin",
      action: "RESOLVED_BY_ADMIN",
      createdBy: {
        userId: req.user._id,
        role: req.user.role,
        name: req.user.name,
      },
    });
    await complaint.save();
  }

  return res.status(200).json({
    message: "Issue resolved successfully",
    issue,
    complaint: complaint || null,
  });
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

  const { resources, nextCursor: cursor, warning, cache } = await fetchHazardVideosFromFolder({
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
    warning: warning || null,
    cache: cache || null,
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
  const { hazardType, location, description, coordinates, latitude, longitude } = req.body;

  if (!hazardType) {
    return res.status(400).json({ message: "hazardType is required" });
  }

  try {
    const incidentLat = toFiniteNumber(coordinates?.lat ?? coordinates?.latitude ?? latitude);
    const incidentLng = toFiniteNumber(coordinates?.lng ?? coordinates?.longitude ?? longitude);

    const nearestRecipients = await getNearestRecipientEmails({
      latitude: incidentLat,
      longitude: incidentLng,
      maxRecipients: 10,
    });

    const fallbackRecipients = Array.isArray(HAZARD_ALERT_EMAILS)
      ? HAZARD_ALERT_EMAILS.map((email) => String(email || "").trim().toLowerCase()).filter(Boolean)
      : [];

    const recipients = nearestRecipients.length > 0 ? nearestRecipients : fallbackRecipients;

    if (recipients.length === 0) {
      return res.status(400).json({
        message: "No recipients available. Add users with latest locations or configure fallback emails in constants/alertEmails.js",
      });
    }

    const info = await sendHazardAlertEmail({
      recipients,
      hazardType: String(hazardType).trim(),
      location: location ? String(location).trim() : "Not specified",
      description: description ? String(description).trim() : "Test hazard alert",
    });

    return res.status(200).json({
      message: "Hazard alert email sent successfully",
      emailsCount: recipients.length,
      recipients,
      recipientSource: nearestRecipients.length > 0 ? "nearest-users" : "fallback-config",
      incidentCoordinates:
        incidentLat !== null && incidentLng !== null ? { lat: incidentLat, lng: incidentLng } : null,
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
    const { resources, nextCursor: cursor, warning, cache } = await fetchHazardVideosByType({
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
      warning: warning || null,
      cache: cache || null,
      videos,
    });
  } catch (error) {
    return res.status(error?.statusCode || 500).json({
      message: "Failed to fetch hazard videos by type",
      error: getErrorMessage(error, "Cloudinary request failed"),
    });
  }
}

async function getHazardVideosFire(req, res) {
  const maxResults = Number(req.query.maxResults || 30);
  const nextCursor = req.query.nextCursor ? String(req.query.nextCursor) : undefined;

  try {
    const { resources, nextCursor: cursor, warning, cache } = await fetchHazardVideosByType({
      hazardType: "fire",
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
      hazardType: "fire",
      folder: "hazard-clips",
      count: videos.length,
      nextCursor: cursor,
      warning: warning || null,
      cache: cache || null,
      videos,
    });
  } catch (error) {
    return res.status(error?.statusCode || 500).json({
      message: "Failed to fetch fire hazard videos",
      error: getErrorMessage(error, "Cloudinary request failed"),
    });
  }
}

async function getHazardVideosWeapon(req, res) {
  const maxResults = Number(req.query.maxResults || 30);
  const nextCursor = req.query.nextCursor ? String(req.query.nextCursor) : undefined;

  try {
    const { resources, nextCursor: cursor, warning, cache } = await fetchHazardVideosByType({
      hazardType: "gun",
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
      hazardType: "weapon-detection",
      folder: "weapon-detection-clips",
      count: videos.length,
      nextCursor: cursor,
      warning: warning || null,
      cache: cache || null,
      videos,
    });
  } catch (error) {
    return res.status(error?.statusCode || 500).json({
      message: "Failed to fetch weapon detection videos",
      error: getErrorMessage(error, "Cloudinary request failed"),
    });
  }
}

async function getHazardVideosGarbage(req, res) {
  const maxResults = Number(req.query.maxResults || 30);
  const nextCursor = req.query.nextCursor ? String(req.query.nextCursor) : undefined;

  try {
    const { resources, nextCursor: cursor, warning, cache } = await fetchHazardVideosByType({
      hazardType: "garbage dumping",
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
      hazardType: "garbage",
      folder: "garbage-clips",
      count: videos.length,
      nextCursor: cursor,
      warning: warning || null,
      cache: cache || null,
      videos,
    });
  } catch (error) {
    return res.status(error?.statusCode || 500).json({
      message: "Failed to fetch garbage disposal videos",
      error: getErrorMessage(error, "Cloudinary request failed"),
    });
  }
}

module.exports = {
  createHazard,
  getHazards,
  routeHazard,
  getAllIssues,
  resolveIssueByAdmin,
  getAdminDashboard,
  getCloudinaryHazardVideos,
  getCloudinaryHazardVideosByType,
  getHazardVideosFire,
  getHazardVideosWeapon,
  getHazardVideosGarbage,
  importCloudinaryHazard,
  getAllComplaints,
  getPendingComplaints,
  updateComplaintStatus,
  routeComplaintToDepartment,
  testHazardAlert,
};
