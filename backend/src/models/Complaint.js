const mongoose = require("mongoose");
const { ROLES } = require("../constants/roles");

const mediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      default: null,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    citizenName: {
      type: String,
      required: true,
    },
    citizenEmail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    media: {
      type: [mediaSchema],
      default: [],
    },
    category: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Under Review", "Routed", "Resolved"],
      default: "Pending",
      index: true,
    },
    assignedDepartment: {
      type: String,
      default: null,
    },
    issueId: {
      type: String,
      default: null,
    },
    logs: [
      {
        message: String,
        action: String,
        createdBy: {
          userId: mongoose.Schema.Types.ObjectId,
          role: String,
          name: String,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);
