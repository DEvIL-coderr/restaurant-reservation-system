const crypto = require("crypto");
const Razorpay = require("razorpay");
const Reservation = require("../models/Reservation");

const getOwnedReservation = async (id, userId) => {
    const reservation = await Reservation.findOne({ _id: id, user: userId });
    return reservation;
};

const createPaymentOrder = async (req, res) => {
    try {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(503).json({
                message: "Online payments are not configured yet. Add Razorpay test keys to the backend .env file."
            });
        }

        const reservation = await getOwnedReservation(req.params.id, req.userId);
        if (!reservation) {
            return res.status(404).json({ message: "Reservation not found" });
        }

        if (reservation.status !== "confirmed") {
            return res.status(400).json({
                message: "Payment is available only after the restaurant confirms your reservation."
            });
        }

        if (reservation.paymentMethod === "pay_at_restaurant") {
            return res.status(400).json({ message: "This reservation is set to pay at the restaurant, not online." });
        }

        if (reservation.paymentStatus === "paid") {
            return res.status(400).json({ message: "This reservation has already been paid." });
        }

        const amountInPaise = Math.round(Number(reservation.bookingFee || 0) * 100);
        if (amountInPaise <= 0) {
            return res.status(400).json({ message: "No payment is due for this reservation." });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: `reservation_${reservation._id}`,
            notes: {
                reservationId: reservation._id.toString(),
                customerId: req.userId.toString()
            }
        });

        reservation.razorpayOrderId = order.id;
        reservation.paymentStatus = "pending";
        await reservation.save();

        return res.status(201).json({
            message: "Payment order created",
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error("Razorpay order creation error:", error.message);
        return res.status(500).json({
            message: "Unable to create payment order",
            error: error.message
        });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: "Payment verification details are incomplete." });
        }

        const reservation = await getOwnedReservation(req.params.id, req.userId);
        if (!reservation) {
            return res.status(404).json({ message: "Reservation not found" });
        }

        if (reservation.paymentStatus === "paid") {
            return res.json({ message: "Payment has already been verified.", reservation });
        }

        if (!reservation.razorpayOrderId || reservation.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({ message: "Payment order does not match this reservation." });
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        const expectedBuffer = Buffer.from(expectedSignature, "hex");
        const receivedBuffer = Buffer.from(razorpay_signature, "hex");

        if (
            !process.env.RAZORPAY_KEY_SECRET ||
            expectedBuffer.length !== receivedBuffer.length ||
            !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
        ) {
            reservation.paymentStatus = "failed";
            await reservation.save();
            return res.status(400).json({ message: "Payment signature verification failed." });
        }

        reservation.paymentStatus = "paid";
        reservation.razorpayPaymentId = razorpay_payment_id;
        reservation.razorpaySignature = razorpay_signature;
        reservation.paidAt = new Date();
        await reservation.save();

        return res.json({
            message: "Payment verified successfully",
            reservation
        });
    } catch (error) {
        console.error("Razorpay verification error:", error.message);
        return res.status(500).json({
            message: "Unable to verify payment",
            error: error.message
        });
    }
};

module.exports = { createPaymentOrder, verifyPayment };
