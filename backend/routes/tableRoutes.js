const express = require("express");
const { addTable, getTables, updateTable, deleteTable, getAvailableTables} = require("../controllers/tableController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

router.post("/", protect, adminOnly, addTable);
router.get("/available", getAvailableTables);
router.get("/", protect, adminOnly, getTables);
router.put("/:id", protect, adminOnly, updateTable);
router.delete("/:id", protect, adminOnly, deleteTable);

module.exports = router;