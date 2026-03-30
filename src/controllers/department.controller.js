const Issue = require("../models/Issue");
const ActivityLog = require("../models/ActivityLog");

async function appendLog(issue, reqUser, action, message, metadata = {}) {
  issue.logs.push({
    action,
    message,
    createdBy: {
      userId: reqUser._id,
      role: reqUser.role,
      name: reqUser.name,
    },
  });

  await ActivityLog.create({
    issue: issue._id,
    issueId: issue.issueId,
    action,
    message,
    actor: {
      userId: reqUser._id,
      name: reqUser.name,
      role: reqUser.role,
    },
    metadata,
  });
}

async function getAssignedIssues(req, res) {
  const issues = await Issue.find({ assignedDepartment: req.user.role }).sort({ createdAt: -1 });
  return res.status(200).json({ department: req.user.role, issues });
}

async function updateStatus(req, res) {
  const { issueId, status } = req.body;

  if (!issueId || !status) {
    return res.status(400).json({ message: "issueId and status are required" });
  }

  if (!["Pending", "Ongoing", "Resolved"].includes(status)) {
    return res.status(400).json({ message: "status must be Pending, Ongoing or Resolved" });
  }

  if (status === "Resolved") {
    return res.status(400).json({ message: "Use /resolve-issue API to mark resolved with proof" });
  }

  const issue = await Issue.findOne({ issueId });
  if (!issue) {
    return res.status(404).json({ message: "Issue not found" });
  }

  if (issue.assignedDepartment !== req.user.role) {
    return res.status(403).json({ message: "Issue is not assigned to your department" });
  }

  issue.status = status;
  await appendLog(issue, req.user, "STATUS_UPDATED", `Issue status updated to ${status}`);
  await issue.save();

  return res.status(200).json({ message: "Issue status updated", issue });
}

async function addUpdate(req, res) {
  const { issueId, message } = req.body;

  if (!issueId || !message) {
    return res.status(400).json({ message: "issueId and message are required" });
  }

  const issue = await Issue.findOne({ issueId });
  if (!issue) {
    return res.status(404).json({ message: "Issue not found" });
  }

  if (issue.assignedDepartment !== req.user.role) {
    return res.status(403).json({ message: "Issue is not assigned to your department" });
  }

  if (issue.status === "Pending") {
    issue.status = "Ongoing";
  }

  await appendLog(issue, req.user, "UPDATE_ADDED", message);
  await issue.save();

  return res.status(200).json({ message: "Update added", issue });
}

async function resolveIssue(req, res) {
  const { issueId, proofType, proofUrl, proofText, resolutionNote } = req.body;

  if (!issueId || !proofType) {
    return res.status(400).json({ message: "issueId and proofType are required" });
  }

  if (!["image", "video", "text"].includes(proofType)) {
    return res.status(400).json({ message: "proofType must be image, video or text" });
  }

  if ((proofType === "image" || proofType === "video") && !proofUrl) {
    return res.status(400).json({ message: "proofUrl is required for image/video proof" });
  }

  if (proofType === "text" && !proofText) {
    return res.status(400).json({ message: "proofText is required for text proof" });
  }

  const issue = await Issue.findOne({ issueId });
  if (!issue) {
    return res.status(404).json({ message: "Issue not found" });
  }

  if (issue.assignedDepartment !== req.user.role) {
    return res.status(403).json({ message: "Issue is not assigned to your department" });
  }

  issue.status = "Resolved";
  issue.proofOfWork.push({
    type: proofType,
    url: proofUrl || "",
    text: proofText || "",
    addedBy: {
      userId: req.user._id,
      role: req.user.role,
      name: req.user.name,
    },
  });

  await appendLog(
    issue,
    req.user,
    "ISSUE_RESOLVED",
    resolutionNote || "Issue marked as resolved with proof",
    { proofType }
  );
  await issue.save();

  return res.status(200).json({ message: "Issue resolved", issue });
}

async function getDepartmentDashboard(req, res) {
  const department = req.user.role;

  const [total, pending, ongoing, resolved] = await Promise.all([
    Issue.countDocuments({ assignedDepartment: department }),
    Issue.countDocuments({ assignedDepartment: department, status: "Pending" }),
    Issue.countDocuments({ assignedDepartment: department, status: "Ongoing" }),
    Issue.countDocuments({ assignedDepartment: department, status: "Resolved" }),
  ]);

  return res.status(200).json({
    department,
    metrics: {
      total,
      pending,
      ongoing,
      resolved,
    },
  });
}

module.exports = {
  getAssignedIssues,
  updateStatus,
  addUpdate,
  resolveIssue,
  getDepartmentDashboard,
};
