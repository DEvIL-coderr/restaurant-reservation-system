const Reservation = require("../models/Reservation");

const markPayAtRestaurantReceived = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ message: "Reservation not found" });
        }
        if (reservation.paymentMethod !== "pay_at_restaurant") {
            return res.status(400).json({ message: "This reservation is not set to pay at restaurant." });
        }
        if (reservation.paymentStatus === "paid") {
            return res.json({ message: "This reservation is already marked as paid.", reservation });
        }
        if (reservation.status !== "confirmed") {
            return res.status(400).json({ message: "Only confirmed reservations can be marked as paid." });
        }

        reservation.paymentStatus = "paid";
        reservation.paidAt = new Date();
        await reservation.save();

        return res.json({ message: "On-site payment marked as received.", reservation });
    } catch (error) {
        console.error("On-site payment update error:", error.message);
        return res.status(500).json({ message: "Unable to update payment status." });
    }
};

module.exports = { markPayAtRestaurantReceived };
