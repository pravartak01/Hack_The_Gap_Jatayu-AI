const User = require("../models/User");

async function pushLocation(req, res) {
  const { latitude, longitude, label } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: "latitude and longitude are required" });
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ message: "latitude and longitude must be valid numbers" });
  }

  const locationEntry = {
    latitude: lat,
    longitude: lng,
    label: label ? String(label).trim() : null,
    recordedAt: new Date(),
  };

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $push: { locations: locationEntry } },
    { new: true }
  ).select("_id locations");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(201).json({
    message: "Location saved successfully",
    latestLocation: user.locations[user.locations.length - 1] || null,
  });
}

async function getLatestLocation(req, res) {
  const user = await User.findById(req.user._id).select("_id locations");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const latestLocation = user.locations.length > 0 ? user.locations[user.locations.length - 1] : null;

  return res.status(200).json({ latestLocation });
}

async function getAllLocations(req, res) {
  const user = await User.findById(req.user._id).select("_id locations");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json({
    count: user.locations.length,
    locations: user.locations,
  });
}

module.exports = {
  pushLocation,
  getLatestLocation,
  getAllLocations,
};
