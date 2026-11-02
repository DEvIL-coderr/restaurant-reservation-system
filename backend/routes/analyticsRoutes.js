const express = require("express");
const { getAdminAnalytics } = require("../controllers/analyticsController");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/admin", protect, adminOnly, getAdminAnalytics);

module.exports = router;
