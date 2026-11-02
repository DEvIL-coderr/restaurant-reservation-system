const express = require("express");

const {
  createReservation,
  getMyReservations,
  updateReservation,
  cancelReservation,
  getAllReservations,
  adminUpdateReservation,
  adminDeleteReservation
} = require("../controllers/reservationController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const { createPaymentOrder, verifyPayment } = require("../controllers/paymentController");
const { markPayAtRestaurantReceived } = require("../controllers/onSitePaymentController");

const router = express.Router();

router.post("/", protect, createReservation);

router.get("/", protect, getMyReservations);

router.get("/all", protect, adminOnly, getAllReservations);

router.post("/:id/payment/order", protect, createPaymentOrder);
router.post("/:id/payment/verify", protect, verifyPayment);
router.put("/admin/:id/onsite-payment", protect, adminOnly, markPayAtRestaurantReceived);

router.put("/:id", protect, updateReservation);

router.put("/:id/cancel", protect, cancelReservation);

router.put("/admin/:id", protect, adminOnly, adminUpdateReservation);

router.delete("/admin/:id", protect, adminOnly, adminDeleteReservation);

module.exports = router;
