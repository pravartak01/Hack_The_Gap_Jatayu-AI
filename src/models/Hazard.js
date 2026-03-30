const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    address: { type: String, default: "" },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { _id: false }
);

const hazardSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    evidenceUrl: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: locationSchema,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      default: "external-detection-service",
    },
    evidenceProvider: {
      type: String,
      default: "external",
    },
    evidencePublicId: {
      type: String,
      default: null,
    },
    routed: {
      type: Boolean,
      default: false,
    },
    routedDepartment: {
      type: String,
      default: null,
    },
    issueId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hazard", hazardSchema);
