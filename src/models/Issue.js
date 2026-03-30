const mongoose = require("mongoose");
const { ROLES } = require("../constants/roles");

const issueLogSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    action: { type: String, required: true },
    createdBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      role: { type: String, required: true },
      name: { type: String, required: true },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const proofSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "video", "text"],
      required: true,
    },
    url: { type: String, default: "" },
    text: { type: String, default: "" },
    addedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      role: { type: String, required: true },
      name: { type: String, required: true },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const locationSnapshotSchema = new mongoose.Schema(
  {
    address: { type: String, default: "" },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { _id: false }
);

const issueSchema = new mongoose.Schema(
  {
    issueId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    hazard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hazard",
      required: true,
    },
    hazardType: {
      type: String,
      required: true,
    },
    assignedDepartment: {
      type: String,
      enum: [ROLES.FIRE, ROLES.POLICE, ROLES.TRAFFIC, ROLES.MUNICIPAL],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Ongoing", "Resolved"],
      default: "Pending",
      index: true,
    },
    evidenceUrl: {
      type: String,
      required: true,
    },
    location: {
      type: locationSnapshotSchema,
      required: true,
    },
    logs: {
      type: [issueLogSchema],
      default: [],
    },
    proofOfWork: {
      type: [proofSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Issue", issueSchema);
