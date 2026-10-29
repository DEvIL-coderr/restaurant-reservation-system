const Table = require("../models/Table");
const Reservation = require("../models/Reservation");

const createReservation = async (req, res) => {
    try {
        const { table, date, guests } = req.body;
        const selectedTable = await Table.findById(table);

if (!selectedTable) {
    return res.status(404).json({
        message: "Table not found"
    });
}

if (guests > selectedTable.capacity) {
    return res.status(400).json({
        message: `This table can accommodate only ${selectedTable.capacity} guests`
    });
}


        const bookingDate = new Date(date);

if (bookingDate <= new Date()) {
    return res.status(400).json({
        message: "Reservation date and time must be in the future"
    });
}

        const existingReservation = await Reservation.findOne({
            table,
            date,
            status: { $ne: "cancelled" }
        });

        if (existingReservation) {
            return res.status(400).json({
                message: "Table is already booked for this time"
            });
        }

        const reservation = await Reservation.create({
            user: req.userId,
            table,
            date: bookingDate,
            guests
        });

        res.status(201).json({
            message: "Reservation created successfully",
            reservation
        });

    } catch (error) {
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
