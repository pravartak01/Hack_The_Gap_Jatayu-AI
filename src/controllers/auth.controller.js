const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const PendingSignup = require("../models/PendingSignup");
const { ROLES } = require("../constants/roles");
const { sendOtpEmail } = require("../utils/mailer");

function buildToken(user) {
  return jwt.sign(
    {
      sub: user._id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function normalizeRole(roleInput) {
  return String(roleInput || "")
    .trim()
    .toUpperCase();
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function signup(req, res) {
  const { name, email, password, empID, confirmPass } = req.body;
  const role = normalizeRole(req.body.role || req.params.role);
  const normalizedEmail = String(email || "").toLowerCase().trim();

  if (!name || !email || !password || !role || !empID || !confirmPass) {
    return res.status(400).json({ message: "All of the fields are required" });
  }

  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  if (password !== confirmPass) {
    return res.status(400).json({ message: "Password and confirmed password must be same" });
  }

  const existing = await User.findOne({
    $or: [{ email: normalizedEmail }, { empID: String(empID).trim() }],
  });
  if (existing) {
    return res.status(409).json({ message: "User already exists with this email or empID" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresMinutes = Number(process.env.OTP_EXPIRES_MINUTES || 10);
  const otpExpiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

  await PendingSignup.findOneAndUpdate(
    { email: normalizedEmail },
    {
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: hashedPassword,
      role,
      empID: String(empID).trim(),
      otpHash,
      otpExpiresAt,
      attempts: 0,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await sendOtpEmail({ to: normalizedEmail, name: String(name).trim(), otp });
  } catch (error) {
    return res.status(500).json({ message: "Failed to send OTP email", error: error.message });
  }

  return res.status(200).json({
    message: "OTP sent to email. Verify OTP to complete signup.",
    email: normalizedEmail,
    role,
    expiresInMinutes: expiresMinutes,
  });
}

async function verifySignupOtp(req, res) {
  const { email, otp, role } = req.body;
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const normalizedRole = normalizeRole(role || req.params.role);

  if (!normalizedEmail || !otp) {
    return res.status(400).json({ message: "email and otp are required" });
  }

  const pending = await PendingSignup.findOne({ email: normalizedEmail });
  if (!pending) {
    return res.status(404).json({ message: "No pending signup found for this email" });
  }

  if (normalizedRole && pending.role !== normalizedRole) {
    return res.status(400).json({ message: "Role mismatch for pending signup" });
  }

  if (pending.otpExpiresAt.getTime() < Date.now()) {
    await PendingSignup.deleteOne({ _id: pending._id });
    return res.status(400).json({ message: "OTP expired. Please signup again" });
  }

  const isOtpValid = await bcrypt.compare(String(otp).trim(), pending.otpHash);
  if (!isOtpValid) {
    pending.attempts += 1;
    await pending.save();
    return res.status(400).json({ message: "Invalid OTP" });
  }

  const existing = await User.findOne({
    $or: [{ email: normalizedEmail }, { empID: pending.empID }],
  });

  if (existing) {
    await PendingSignup.deleteOne({ _id: pending._id });
    return res.status(409).json({ message: "User already exists with this email or empID" });
  }

  const user = await User.create({
    name: pending.name,
    email: pending.email,
    password: pending.passwordHash,
    role: pending.role,
    empID: pending.empID,
  });

  await PendingSignup.deleteOne({ _id: pending._id });

  const token = buildToken(user);

  return res.status(201).json({
    message: "OTP verified. Signup completed successfully",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      empID: user.empID,
    },
  });
}

async function login(req, res) {
  const { email, password } = req.body;
  const role = normalizeRole(req.body.role || req.params.role);

  if (!email || !password || !role) {
    return res.status(400).json({ message: "email, password and role are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim(), role });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = buildToken(user);

  return res.status(200).json({
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      empID: user.empID
    },
  });
}

module.exports = { signup, verifySignupOtp, login };
