const express = require("express");
const {
    getRestaurantSettings,
    updateRestaurantSettings
} = require("../controllers/settingsController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

// Public read access is used by the customer booking flow.
router.get("/", getRestaurantSettings);

// Only authenticated administrators can change restaurant settings.
router.put("/", protect, adminOnly, updateRestaurantSettings);

module.exports = router;
