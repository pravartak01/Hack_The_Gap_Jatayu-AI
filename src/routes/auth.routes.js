const express = require("express");
const { signup, login, verifySignupOtp, logout } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifySignupOtp);
router.post("/login", login);
router.post("/logout", logout);

router.post("/admin/signup", (req, res, next) => {
  req.params.role = "ADMIN";
  return signup(req, res, next);
});
router.post("/admin/login", (req, res, next) => {
  req.params.role = "ADMIN";
  return login(req, res, next);
});
router.post("/admin/verify-otp", (req, res, next) => {
  req.params.role = "ADMIN";
  return verifySignupOtp(req, res, next);
});

router.post("/fire/signup", (req, res, next) => {
  req.params.role = "FIRE";
  return signup(req, res, next);
});
router.post("/fire/login", (req, res, next) => {
  req.params.role = "FIRE";
  return login(req, res, next);
});
router.post("/fire/verify-otp", (req, res, next) => {
  req.params.role = "FIRE";
  return verifySignupOtp(req, res, next);
});

router.post("/police/signup", (req, res, next) => {
  req.params.role = "POLICE";
  return signup(req, res, next);
});
router.post("/police/login", (req, res, next) => {
  req.params.role = "POLICE";
  return login(req, res, next);
});
router.post("/police/verify-otp", (req, res, next) => {
  req.params.role = "POLICE";
  return verifySignupOtp(req, res, next);
});

router.post("/traffic/signup", (req, res, next) => {
  req.params.role = "TRAFFIC";
  return signup(req, res, next);
});
router.post("/traffic/login", (req, res, next) => {
  req.params.role = "TRAFFIC";
  return login(req, res, next);
});
router.post("/traffic/verify-otp", (req, res, next) => {
  req.params.role = "TRAFFIC";
  return verifySignupOtp(req, res, next);
});

router.post("/citizen/signup", (req, res, next) => {
  req.params.role = "CITIZEN";
  return signup(req, res, next);
});
router.post("/citizen/login", (req, res, next) => {
  req.params.role = "CITIZEN";
  return login(req, res, next);
});
router.post("/citizen/verify-otp", (req, res, next) => {
  req.params.role = "CITIZEN";
  return verifySignupOtp(req, res, next);
});

module.exports = router;
