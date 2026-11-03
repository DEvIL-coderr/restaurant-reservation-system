const Table = require("../models/Table");
const Reservation = require("../models/Reservation");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const RestaurantSettings = require("../models/RestaurantSettings");
const SpecialDay = require("../models/SpecialDay");

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

const createReservation = async (req, res) => {
    try {
        const { table, date, guests } = req.body;
        const guestCount = Number(guests);
        const bookingDate = new Date(date);

        if (!table || !date || !Number.isInteger(guestCount) || guestCount < 1) {
            return res.status(400).json({
                message: "Please provide a valid table, date and guest count"
            });
        }

        if (Number.isNaN(bookingDate.getTime()) || bookingDate <= new Date()) {
            return res.status(400).json({
                message: "Reservation date and time must be in the future"
            });
        }

        const selectedTable = await Table.findById(table);
        if (!selectedTable) {
            return res.status(404).json({ message: "Table not found" });
        }

        if (guestCount > selectedTable.capacity) {
            return res.status(400).json({
                message: `This table can accommodate only ${selectedTable.capacity} guests`
            });
        }

        const settings = await RestaurantSettings.findOne({ key: "main" }) ||
            new RestaurantSettings({ key: "main" });

        const weekday = bookingDate.toLocaleDateString("en-US", { weekday: "long" });
        const weeklyHours = settings.weeklyHours.find((item) => item.day === weekday);
        const dateKey = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, "0")}-${String(bookingDate.getDate()).padStart(2, "0")}`;
        const specialDay = await SpecialDay.findOne({ date: dateKey });

        if (specialDay?.isClosed || (!specialDay && (!weeklyHours || !weeklyHours.isOpen))) {
            return res.status(400).json({
                message: specialDay?.note || "The restaurant is closed on this day"
            });
        }

        const hours = specialDay
            ? { openTime: specialDay.openTime, closeTime: specialDay.closeTime }
            : weeklyHours;
        const [openHour, openMinute] = hours.openTime.split(":").map(Number);
        const [closeHour, closeMinute] = hours.closeTime.split(":").map(Number);
        const bookingMinutes = bookingDate.getHours() * 60 + bookingDate.getMinutes();
        const openingMinutes = openHour * 60 + openMinute;
        const closingMinutes = closeHour * 60 + closeMinute;
        const durationMinutes = settings.reservationDurationMinutes;
        const bufferMinutes = settings.bufferMinutes;

        if (
            bookingMinutes < openingMinutes ||
            bookingMinutes + durationMinutes + bufferMinutes > closingMinutes ||
            bookingMinutes % settings.slotIntervalMinutes !== openingMinutes % settings.slotIntervalMinutes
        ) {
            return res.status(400).json({
                message: "Selected time is outside the available reservation slots"
            });
        }

        const dayStart = new Date(bookingDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(bookingDate);
        dayEnd.setHours(23, 59, 59, 999);

        const existingReservations = await Reservation.find({
            table,
            date: { $gte: dayStart, $lte: dayEnd },
            status: { $ne: "cancelled" }
        }).select("date durationMinutes bufferMinutes");

        const requestedEnd = bookingDate.getTime() + (durationMinutes + bufferMinutes) * 60000;
        const hasConflict = existingReservations.some((reservation) => {
            const existingStart = new Date(reservation.date).getTime();
            const existingDuration = reservation.durationMinutes || durationMinutes;
            const existingBuffer = reservation.bufferMinutes ?? bufferMinutes;
            const existingEnd = existingStart + (existingDuration + existingBuffer) * 60000;
            return bookingDate.getTime() < existingEnd && requestedEnd > existingStart;
        });

        if (hasConflict) {
            return res.status(409).json({
                message: "This table has just been booked for an overlapping time. Please choose another slot."
            });
        }

        const pricingMode = "full_table";
        const tablePrice = Number(selectedTable.fullTablePrice || 0);
        const totalBookingAmount = Math.round((tablePrice + Number(settings.bookingFee || 0)) * 100) / 100;

        const paymentMethod = req.body.paymentMethod === "pay_at_restaurant" ? "pay_at_restaurant" : "online";
        const reservationTime = bookingDate.toTimeString().slice(0, 5);
        const payAtRestaurantAllowed =
            settings.payAtRestaurantEnabled === true &&
            (settings.payAtRestaurantTables || []).some((tableId) => tableId.toString() === selectedTable._id.toString()) &&
            reservationTime >= (settings.payAtRestaurantStartTime || "00:00") &&
            reservationTime <= (settings.payAtRestaurantEndTime || "23:59");

        if (paymentMethod === "pay_at_restaurant" && !payAtRestaurantAllowed) {
            return res.status(400).json({
                message: "Pay at restaurant is not available for this table or reservation time."
            });
        }

        const reservation = await Reservation.create({
            user: req.userId,
            table,
            date: bookingDate,
            guests: guestCount,
            durationMinutes,
            bufferMinutes,
            pricingMode,
            tablePrice,
            bookingFee: totalBookingAmount,
            paymentMethod,
            paymentStatus: paymentMethod === "pay_at_restaurant" || totalBookingAmount > 0 ? "pending" : "not_required"
        });

        try {
            // Send notifications after the reservation is saved.
            const customer = await User.findById(req.userId).select("name email");
            const bookingDateText = formatReservationDate(bookingDate);
            const customerName = escapeHtml(customer?.name || "Customer");
            const tableName = escapeHtml(selectedTable.tableNumber || selectedTable.category || "Selected table");
    
            if (customer?.email) {
                await sendEmail({
                    to: customer.email,
                    subject: "Your restaurant reservation request",
                    text: `Hello ${customer.name || "Customer"}, your reservation request for ${bookingDateText} has been received. Guests: ${guestCount}. Table: ${selectedTable.tableNumber || selectedTable.category || "Selected table"}. Status: pending.`,
                    html: `<h2>Reservation request received</h2><p>Hello ${customerName},</p><p>Your reservation request has been received.</p><p><strong>Date and time:</strong> ${bookingDateText}<br><strong>Guests:</strong> ${guestCount}<br><strong>Table:</strong> ${tableName}<br><strong>Status:</strong> Pending admin approval</p><p>Thank you for choosing our restaurant.</p>`
                });
            }
    
            if (process.env.ADMIN_EMAIL) {
                await sendEmail({
                    to: process.env.ADMIN_EMAIL,
                    subject: "New restaurant reservation",
                    text: `A new reservation was made by ${customer?.name || "Customer"} (${customer?.email || "no email"}). Date: ${bookingDateText}. Guests: ${guestCount}. Table: ${selectedTable.tableNumber || selectedTable.category || "Selected table"}.`,
                    html: `<h2>New reservation received</h2><p><strong>Customer:</strong> ${customerName}<br><strong>Email:</strong> ${escapeHtml(customer?.email || "Not available")}<br><strong>Date and time:</strong> ${bookingDateText}<br><strong>Guests:</strong> ${guestCount}<br><strong>Table:</strong> ${tableName}</p>`
                });
            }
    
    
        } catch (emailError) {
            console.error("Booking notification error:", emailError.message);
        }

        res.status(201).json({
            message: "Reservation created successfully",
            reservation
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const getMyReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find({
            user: req.userId
        }).populate("table");

        res.json(reservations);

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const cancelReservation = async (req, res) => {
    try {
        const { id } = req.params;

        const reservation = await Reservation.findOne({
            _id: id,
            user: req.userId
        });

        if (!reservation) {
            return res.status(404).json({
                message: "Reservation not found"
            });
        }

        reservation.status = "cancelled";

        await reservation.save();

        try {
            const customer = await User.findById(req.userId).select("name email");
            const table = await Table.findById(reservation.table).select("tableNumber category");
            if (customer?.email) {
                const bookingDateText = formatReservationDate(reservation.date);
                await sendEmail({
                    to: customer.email,
                    subject: "Your restaurant reservation was cancelled",
                    text: `Hello ${customer.name || "Customer"}, your reservation for ${bookingDateText} has been cancelled.`,
                    html: `<h2>Reservation cancelled</h2><p>Hello ${escapeHtml(customer.name || "Customer")},</p><p>Your reservation has been cancelled.</p><p><strong>Date and time:</strong> ${bookingDateText}<br><strong>Table:</strong> ${escapeHtml(table?.tableNumber || table?.category || "Selected table")}</p>`
                });
            }
    
    
        } catch (emailError) {
            console.error("Cancellation notification error:", emailError.message);
        }

        res.json({
            message: "Reservation cancelled successfully",
            reservation
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const updateReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, guests, table: requestedTable } = req.body;
        const reservation = await Reservation.findById(id);

        if (!reservation) return res.status(404).json({ message: "Reservation not found" });
        if (reservation.user.toString() !== req.userId) {
            return res.status(403).json({ message: "You can only modify your own reservation" });
        }
        if (reservation.status === "cancelled") {
            return res.status(400).json({ message: "Cancelled reservation cannot be modified" });
        }
        if (reservation.paymentStatus === "paid") {
            return res.status(400).json({
                message: "This reservation is already paid. Please contact the restaurant to modify it."
            });
        }

        const updatedDate = new Date(date || reservation.date);
        const guestCount = guests === undefined ? reservation.guests : Number(guests);
        const selectedTable = await Table.findById(requestedTable || reservation.table);

        if (Number.isNaN(updatedDate.getTime()) || updatedDate <= new Date()) {
            return res.status(400).json({ message: "Reservation date and time must be in the future" });
        }
        if (!Number.isInteger(guestCount) || guestCount < 1) {
            return res.status(400).json({ message: "Please enter a valid number of guests" });
        }
        if (!selectedTable) return res.status(404).json({ message: "Selected table not found" });
        if (guestCount > selectedTable.capacity) {
            return res.status(400).json({ message: `This table can accommodate only ${selectedTable.capacity} guests` });
        }

        const settings = await RestaurantSettings.findOne({ key: "main" }) ||
            new RestaurantSettings({ key: "main" });

        if (reservation.paymentMethod === "pay_at_restaurant") {
            const reservationTime = updatedDate.toTimeString().slice(0, 5);
            const allowedOnSitePayment = settings.payAtRestaurantEnabled === true &&
                (settings.payAtRestaurantTables || []).some((tableId) => tableId.toString() === selectedTable._id.toString()) &&
                reservationTime >= (settings.payAtRestaurantStartTime || "00:00") &&
                reservationTime <= (settings.payAtRestaurantEndTime || "23:59");
            if (!allowedOnSitePayment) {
                return res.status(400).json({ message: "Pay at restaurant is not available for the selected table or time. Please contact the restaurant or create a new booking." });
            }
        }

        const weekday = updatedDate.toLocaleDateString("en-US", { weekday: "long" });
        const weeklyHours = settings.weeklyHours.find((item) => item.day === weekday);
        const dateKey = `${updatedDate.getFullYear()}-${String(updatedDate.getMonth() + 1).padStart(2, "0")}-${String(updatedDate.getDate()).padStart(2, "0")}`;
        const specialDay = await SpecialDay.findOne({ date: dateKey });

        if (specialDay?.isClosed || (!specialDay && (!weeklyHours || !weeklyHours.isOpen))) {
            return res.status(400).json({ message: specialDay?.note || "The restaurant is closed on this day" });
        }

        const hours = specialDay
            ? { openTime: specialDay.openTime, closeTime: specialDay.closeTime }
            : weeklyHours;
        const [openHour, openMinute] = hours.openTime.split(":").map(Number);
        const [closeHour, closeMinute] = hours.closeTime.split(":").map(Number);
        const bookingMinutes = updatedDate.getHours() * 60 + updatedDate.getMinutes();
        const openingMinutes = openHour * 60 + openMinute;
        const closingMinutes = closeHour * 60 + closeMinute;
        const durationMinutes = settings.reservationDurationMinutes;
        const bufferMinutes = settings.bufferMinutes;

        if (
            bookingMinutes < openingMinutes ||
            bookingMinutes + durationMinutes + bufferMinutes > closingMinutes ||
            bookingMinutes % settings.slotIntervalMinutes !== openingMinutes % settings.slotIntervalMinutes
        ) {
            return res.status(400).json({ message: "Selected time is outside the available reservation slots" });
        }

        const dayStart = new Date(updatedDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(updatedDate);
        dayEnd.setHours(23, 59, 59, 999);
        const existingReservations = await Reservation.find({
            _id: { $ne: id },
            table: selectedTable._id,
            date: { $gte: dayStart, $lte: dayEnd },
            status: { $ne: "cancelled" }
        }).select("date durationMinutes bufferMinutes");

        const requestedEnd = updatedDate.getTime() + (durationMinutes + bufferMinutes) * 60000;
        const hasConflict = existingReservations.some((item) => {
            const existingStart = new Date(item.date).getTime();
            const existingDuration = item.durationMinutes || durationMinutes;
            const existingBuffer = item.bufferMinutes ?? bufferMinutes;
            const existingEnd = existingStart + (existingDuration + existingBuffer) * 60000;
            return updatedDate.getTime() < existingEnd && requestedEnd > existingStart;
        });
        if (hasConflict) {
            return res.status(409).json({ message: "This table is no longer available at that time. Please choose another slot." });
        }

        const pricingMode = "full_table";
        const tablePrice = Number(selectedTable.fullTablePrice || 0);
        const totalBookingAmount = Math.round((tablePrice + Number(settings.bookingFee || 0)) * 100) / 100;

        reservation.table = selectedTable._id;
        reservation.date = updatedDate;
        reservation.guests = guestCount;
        reservation.durationMinutes = durationMinutes;
        reservation.bufferMinutes = bufferMinutes;
        reservation.pricingMode = pricingMode;
        reservation.tablePrice = tablePrice;
        reservation.bookingFee = totalBookingAmount;
        reservation.paymentStatus = reservation.paymentMethod === "pay_at_restaurant" || totalBookingAmount > 0
            ? "pending"
            : "not_required";
        if (reservation.status === "confirmed") reservation.status = "pending";

        await reservation.save();
        const updatedReservation = await Reservation.findById(id).populate("table");

        return res.json({ message: "Reservation updated successfully. It is pending restaurant approval.", reservation: updatedReservation });
    } catch (error) {
        console.error("Update reservation error:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getAllReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find()
            .populate("user", "name email phone")
            .populate("table", "tableNumber capacity category fullTablePrice");

        res.json({
            reservations
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const adminUpdateReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, guests, cancellationMessage } = req.body;

        const reservation = await Reservation.findById(id);

        if (!reservation) {
            return res.status(404).json({
                message: "Reservation not found"
            });
        }

        const previousStatus = reservation.status;

        if (status) {
            if (
                !["pending", "confirmed", "cancelled"].includes(
                    status
                )
            ) {
                return res.status(400).json({
                    message: "Invalid reservation status"
                });
            }

            reservation.status = status;
            if (status === "cancelled") {
                reservation.cancellationMessage = String(cancellationMessage || "").trim() ||
                    "Your reservation was cancelled by the restaurant.";
            }
        }

        if (guests !== undefined) {
            if (guests < 1) {
                return res.status(400).json({
                    message: "Guests must be at least 1"
                });
            }

            const table = await Table.findById(
                reservation.table
            );

            if (!table) {
                return res.status(404).json({
                    message: "Table not found"
                });
            }

            if (guests > table.capacity) {
                return res.status(400).json({
                    message: `Table capacity is ${table.capacity}`
                });
            }

            reservation.guests = guests;
        }

        await reservation.save();

        const updatedReservation =
            await Reservation.findById(id)
                .populate("user", "name email phone")
                .populate(
                    "table",
                    "tableNumber capacity category"
                );

        try {
            if (
                previousStatus !== updatedReservation.status &&
                ["confirmed", "cancelled"].includes(updatedReservation.status) &&
                updatedReservation.user?.email
            ) {
                const isConfirmed = updatedReservation.status === "confirmed";
                const bookingDateText = formatReservationDate(updatedReservation.date);
                const tableName = escapeHtml(
                    updatedReservation.table?.tableNumber ||
                    updatedReservation.table?.category ||
                    "Selected table"
                );
                const customerName = escapeHtml(updatedReservation.user.name || "Customer");
    
                await sendEmail({
                    to: updatedReservation.user.email,
                    subject: isConfirmed
                        ? "Your restaurant reservation is confirmed"
                        : "Your restaurant reservation was cancelled",
                    text: isConfirmed
                        ? `Hello ${updatedReservation.user.name || "Customer"}, your reservation for ${bookingDateText} is confirmed.`
                        : `Hello ${updatedReservation.user.name || "Customer"}, your reservation for ${bookingDateText} has been cancelled by the restaurant. Message: ${updatedReservation.cancellationMessage || "Your reservation was cancelled by the restaurant."}`,
                    html: isConfirmed
                        ? `<h2>Reservation confirmed</h2><p>Hello ${customerName},</p><p>Your reservation is confirmed. We look forward to seeing you!</p><p><strong>Date and time:</strong> ${bookingDateText}<br><strong>Guests:</strong> ${updatedReservation.guests}<br><strong>Table:</strong> ${tableName}</p>`
                        : `<h2>Reservation cancelled</h2><p>Hello ${customerName},</p><p>Your reservation has been cancelled by the restaurant.</p><p><strong>Message from the restaurant:</strong> ${escapeHtml(updatedReservation.cancellationMessage || "Your reservation was cancelled by the restaurant.")}</p><p><strong>Date and time:</strong> ${bookingDateText}<br><strong>Table:</strong> ${tableName}</p>`
                });
            }
    
    
        } catch (emailError) {
            console.error("Admin status notification error:", emailError.message);
        }

        res.json({
            message: "Reservation updated successfully",
            reservation: updatedReservation
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const adminDeleteReservation = async (req, res) => {
    try {
        const { id } = req.params;

        const reservation = await Reservation.findById(id);

        if (!reservation) {
            return res.status(404).json({
                message: "Reservation not found"
            });
        }

        if (reservation.status !== "cancelled") {
            return res.status(400).json({
                message: "Only cancelled reservations can be deleted"
            });
        }

        await Reservation.findByIdAndDelete(id);

        res.json({
            message: "Cancelled reservation deleted successfully"
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


const getPaymentReceipt = async (req, res) => {
    try {
        const reservation = await Reservation.findOne({
            _id: req.params.id,
            user: req.userId
        })
            .populate("user", "name email")
            .populate("table", "tableNumber capacity category");

        if (!reservation) {
            return res.status(404).json({ message: "Reservation not found" });
        }

        if (reservation.paymentStatus !== "paid") {
            return res.status(400).json({ message: "A receipt is available only after payment is marked as paid." });
        }

        return res.json({
            receipt: {
                receiptNumber: `RS-${reservation._id.toString().slice(-8).toUpperCase()}`,
                reservationId: reservation._id,
                customerName: reservation.user?.name || "Customer",
                customerEmail: reservation.user?.email || "",
                tableNumber: reservation.table?.tableNumber || reservation.table?.category || "N/A",
                guests: reservation.guests,
                reservationDate: reservation.date,
                tablePrice: Number(reservation.tablePrice || 0),
                amountPaid: Number(reservation.bookingFee || 0),
                paymentMethod: reservation.paymentMethod === "pay_at_restaurant" ? "Pay at restaurant" : "Online payment (Razorpay)",
                paymentReference: reservation.razorpayPaymentId || "Paid at restaurant",
                paidAt: reservation.paidAt || reservation.updatedAt,
                paymentStatus: reservation.paymentStatus
            }
        });
    } catch (error) {
        console.error("Payment receipt error:", error.message);
        return res.status(500).json({ message: "Unable to generate payment receipt." });
    }
};

//exports
module.exports = {
    createReservation,
    getMyReservations,
    getPaymentReceipt,
    getAllReservations,
    cancelReservation,
    updateReservation,
    adminUpdateReservation,
    adminDeleteReservation
};
