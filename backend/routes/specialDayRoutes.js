const express = require("express");
const {
    getSpecialDays,
    createSpecialDay,
    deleteSpecialDay
} = require("../controllers/specialDayController");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", getSpecialDays);
router.post("/", protect, adminOnly, createSpecialDay);
router.delete("/:id", protect, adminOnly, deleteSpecialDay);

module.exports = router;
