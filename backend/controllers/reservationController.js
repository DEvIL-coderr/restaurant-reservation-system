const Table = require("../models/Table");
const Reservation = require("../models/Reservation");

const RestaurantSettings = require("../models/RestaurantSettings");
const SpecialDay = require("../models/SpecialDay");

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

        const reservation = await Reservation.create({
            user: req.userId,
            table,
            date: bookingDate,
            guests: guestCount,
            durationMinutes,
            bufferMinutes
        });

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
        const { date, guests } = req.body;

        const reservation = await Reservation.findById(id);

if (!reservation) {
    return res.status(404).json({
        message: "Reservation not found"
    });
}

if (reservation.user.toString() !== req.userId) {
    return res.status(403).json({
        message: "You can only modify your own reservation"
    });
}

if (reservation.status === "cancelled") {
    return res.status(400).json({
        message: "Cancelled reservation cannot be modified"
    });
}

if (reservation.status === "confirmed") {
    reservation.status = "pending";
}

        if (!reservation) {
            return res.status(404).json({
                message: "Reservation not found"
            });
        }
        if (reservation.user.toString() !== req.userId) {
    return res.status(403).json({
        message: "You can only modify your own reservation"
    });
}

        if (reservation.status === "cancelled") {
            return res.status(400).json({
                message: "Cancelled reservation cannot be modified"
            });
        }

        const newDate = date || reservation.date;
        const updatedDate = new Date(newDate);

if (updatedDate <= new Date()) {
    return res.status(400).json({
        message: "Reservation date and time must be in the future"
    });
}

        const existingReservation = await Reservation.findOne({
            _id: { $ne: id },
            table: reservation.table,
            date: updatedDate,
            status: { $ne: "cancelled" }
        });

        if (existingReservation) {
            return res.status(400).json({
                message: "Table is already booked for this time"
            });
        }

        reservation.date = updatedDate;

        if (guests) {
            reservation.guests = guests;
        }

        await reservation.save();

        res.json({
            message: "Reservation updated successfully",
            reservation
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const getAllReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find()
            .populate("user", "name email phone")
            .populate("table", "tableNumber capacity category");

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
        const { status, guests } = req.body;

        const reservation = await Reservation.findById(id);

        if (!reservation) {
            return res.status(404).json({
                message: "Reservation not found"
            });
        }

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

//exports
module.exports = {
    createReservation,
    getMyReservations,
    getAllReservations,
    cancelReservation,
    updateReservation,
    adminUpdateReservation,
    adminDeleteReservation
};
