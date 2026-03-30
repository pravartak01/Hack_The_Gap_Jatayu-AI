const Complaint = require("../models/Complaint");
const { uploadComplaintMedia } = require("../utils/fileUpload");
const { generateIssueId } = require("../utils/issueId");

function generateComplaintId() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CMP-${datePart}-${randomPart}`;
}

async function createComplaint(req, res) {
  // Extract fields: text fields come as FormData text, files come as file objects
  let title = req.body?.title || "";
  let description = req.body?.description || "";
  
  // If multer processed them, extract from files array
  if (req.files && !title) {
    const titleObj = req.files.find(f => f.fieldname === "title");
    if (titleObj) title = titleObj.buffer.toString();
  }
  if (req.files && !description) {
    const descObj = req.files.find(f => f.fieldname === "description");
    if (descObj) description = descObj.buffer.toString();
  }
  
  title = title?.trim();
  description = description?.trim();
  
  // Files are objects where fieldname is 'files'
  const files = req.files?.filter(f => f.fieldname === "files") || [];

  console.log(`[createComplaint] Received files: ${files.length}, title: "${title}", description: "${description}"`);
  if (req.files) {
    console.log(`[createComplaint] All req.files fieldnames:`, req.files.map(f => f.fieldname));
  }

  if (!title || !description) {
    return res.status(400).json({ message: "title and description are required" });
  }

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const complaintId = generateComplaintId();
  const media = [];

  if (files.length > 0) {
    try {
      for (const file of files) {
        try {
          const resourceType = file.mimetype.startsWith("video/") ? "video" : "image";
          const uploadedMedia = await uploadComplaintMedia(file.buffer, file.originalname, resourceType);
          media.push(uploadedMedia);
        } catch (fileError) {
          console.error(`Error uploading file ${file.originalname}:`, fileError.message);
          // Continue processing remaining files even if one fails
        }
      }
    } catch (error) {
      console.error("Error processing media uploads:", error);
    }
  }

  const complaint = await Complaint.create({
    complaintId,
    citizen: req.user._id,
    citizenName: req.user.name,
    citizenEmail: req.user.email,
    title: String(title).trim(),
    description: String(description).trim(),
    media,
    logs: [
      {
        message: "Complaint created",
        action: "CREATED",
        createdBy: {
          userId: req.user._id,
          role: req.user.role,
          name: req.user.name,
        },
      },
    ],
  });

  return res.status(201).json({
    message: "Complaint created successfully",
    complaint,
  });
}

async function getMyCitizensComplaints(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const complaints = await Complaint.find({ citizen: req.user._id }).sort({ createdAt: -1 });
  return res.status(200).json({ complaints });
}

async function getComplaintDetail(req, res) {
  const { complaintId } = req.params;

  if (!complaintId) {
    return res.status(400).json({ message: "complaintId is required" });
  }

  const complaint = await Complaint.findOne({ complaintId });
  if (!complaint) {
    return res.status(404).json({ message: "Complaint not found" });
  }

  if (complaint.citizen.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Forbidden: not your complaint" });
  }

  return res.status(200).json({ complaint });
}

module.exports = {
  createComplaint,
  getMyCitizensComplaints,
  getComplaintDetail,
};
