const Reservation = require("../models/Reservation");
const sendEmail = require("./sendEmail");

const formatReservationDate = (date) =>
    new Date(date).toLocaleString("en-IN", {
        dateStyle: "full",
        timeStyle: "short"
    });

const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);

let checkInProgress = false;

const checkUpcomingReservations = async () => {
    if (checkInProgress) return;
    checkInProgress = true;

    try {
        const now = new Date();
        const reminderWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const reservations = await Reservation.find({
            status: "confirmed",
            reminderSent: { $ne: true },
            date: {
                $gt: now,
                $lte: reminderWindow
            }
        })
            .populate("user", "name email")
            .populate("table", "tableNumber category");

        for (const reservation of reservations) {
            if (!reservation.user?.email) {
                console.warn(
                    `Reminder skipped for reservation ${reservation._id}: customer email not found.`
                );
                continue;
            }

            const bookingDateText = formatReservationDate(reservation.date);
            const customerName = escapeHtml(reservation.user.name || "Customer");
            const tableName = escapeHtml(
                reservation.table?.tableNumber ||
                reservation.table?.category ||
                "Your reserved table"
            );

            const sent = await sendEmail({
                to: reservation.user.email,
                subject: "Reminder: Your restaurant reservation is tomorrow",
                text: `Hello ${reservation.user.name || "Customer"}, this is a reminder that your restaurant reservation is scheduled for ${bookingDateText}. Guests: ${reservation.guests}. Table: ${reservation.table?.tableNumber || reservation.table?.category || "Your reserved table"}. We look forward to seeing you!`,
                html: `<h2>Your reservation reminder</h2><p>Hello ${customerName},</p><p>This is a friendly reminder that your restaurant reservation is coming up in approximately 24 hours.</p><p><strong>Date and time:</strong> ${bookingDateText}<br><strong>Guests:</strong> ${reservation.guests}<br><strong>Table:</strong> ${tableName}</p><p>We look forward to seeing you!</p>`
            });

            if (sent) {
                reservation.reminderSent = true;
                await reservation.save();
                console.log(`Reservation reminder sent to ${reservation.user.email}`);
            }
        }
    } catch (error) {
        console.error("Reservation reminder check failed:", error.message);
    } finally {
        checkInProgress = false;
    }
};

const startReminderScheduler = () => {
    console.log("Reservation reminder scheduler started (checks every 60 seconds).");
    checkUpcomingReservations();
    setInterval(checkUpcomingReservations, 60 * 1000);
};

module.exports = startReminderScheduler;
