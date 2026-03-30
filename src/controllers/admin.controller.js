const Hazard = require("../models/Hazard");
const Issue = require("../models/Issue");
const ActivityLog = require("../models/ActivityLog");
const { mapHazardToDepartment, normalizeHazardType } = require("../constants/hazardRouting");
const { generateIssueId } = require("../utils/issueId");

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

module.exports = {
  createHazard,
  getHazards,
  routeHazard,
  getAllIssues,
  getAdminDashboard,
};
