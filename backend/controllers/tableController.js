const mongoose = require("mongoose");
const Table = require("../models/Table");
const Reservation = require("../models/Reservation");
const SpecialDay = require("../models/SpecialDay");

const addTable = async (req, res) => {
    try {
        const { tableNumber, capacity, category, fullTablePrice = 0 } = req.body;

        if (!Number.isFinite(Number(fullTablePrice)) || Number(fullTablePrice) < 0) {
            return res.status(400).json({ message: "Table prices must be valid non-negative amounts." });
        }

        const existingTable = await Table.findOne({ tableNumber });

        if (existingTable) {
            return res.status(400).json({
                message: "Table already exists"
            });
        }

        const table = await Table.create({
            tableNumber,
            capacity,
            category,
            fullTablePrice: Number(fullTablePrice)
        });

        res.status(201).json({
            message: "Table added successfully",
            table
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const getTables = async (req, res) => {
    try {
        const tables = await Table.find();

        res.json(tables);

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};
const updateTable = async (req, res) => {
    try {
        const { id } = req.params;

        const { tableNumber, capacity, category, status, fullTablePrice } = req.body;
        const update = {};
        if (tableNumber !== undefined) update.tableNumber = Number(tableNumber);
        if (capacity !== undefined) update.capacity = Number(capacity);
        if (category !== undefined) update.category = category;
        if (status !== undefined) update.status = status;
        if (fullTablePrice !== undefined) update.fullTablePrice = Number(fullTablePrice);

        if (update.fullTablePrice !== undefined &&
            (!Number.isFinite(update.fullTablePrice) || update.fullTablePrice < 0)) {
            return res.status(400).json({ message: "Table prices must be valid non-negative amounts." });
        }

        const table = await Table.findByIdAndUpdate(
            id,
            update,
            { new: true, runValidators: true }
        );

        if (!table) {
            return res.status(404).json({
                message: "Table not found"
            });
        }

        res.json({
            message: "Table updated successfully",
            table
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};
const deleteTable = async (req, res) => {
    try {
        const { id } = req.params;

        const table = await Table.findByIdAndDelete(id);

        if (!table) {
            return res.status(404).json({
                message: "Table not found"
            });
        }

        res.json({
            message: "Table deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const RestaurantSettings = require("../models/RestaurantSettings");

const getAvailableTables = async (req, res) => {
    try {
        const { date, guests, category, excludeReservationId } = req.query;

        if (!date || !guests || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                message: "A valid date and number of guests are required"
            });
        }

        const guestCount = Number(guests);
        if (!Number.isInteger(guestCount) || guestCount < 1) {
            return res.status(400).json({ message: "Guest count must be at least 1" });
        }

        const settings = await RestaurantSettings.findOne({ key: "main" }) ||
            new RestaurantSettings({ key: "main" });

        const dayDate = new Date(`${date}T12:00:00`);
        if (Number.isNaN(dayDate.getTime())) {
            return res.status(400).json({ message: "Invalid date" });
        }

        const weekday = dayDate.toLocaleDateString("en-US", { weekday: "long" });
        const weeklyHours = settings.weeklyHours.find((item) => item.day === weekday);
        const specialDay = await SpecialDay.findOne({ date });

        if (specialDay?.isClosed || (!specialDay && (!weeklyHours || !weeklyHours.isOpen))) {
            return res.json({
                date,
                closed: true,
                message: specialDay?.note || "The restaurant is closed on this day",
                slots: []
            });
        }

        const hours = specialDay
            ? { openTime: specialDay.openTime, closeTime: specialDay.closeTime }
            : weeklyHours;
        const [openHour, openMinute] = hours.openTime.split(":").map(Number);
        const [closeHour, closeMinute] = hours.closeTime.split(":").map(Number);
        const openingMinutes = openHour * 60 + openMinute;
        const closingMinutes = closeHour * 60 + closeMinute;
        const duration = settings.reservationDurationMinutes;
        const buffer = settings.bufferMinutes;
        const interval = settings.slotIntervalMinutes;

        const dayStart = new Date(`${date}T00:00:00`);
        const dayEnd = new Date(`${date}T23:59:59.999`);

        const reservationQuery = {
            date: { $gte: dayStart, $lte: dayEnd },
            status: { $ne: "cancelled" }
        };
        if (excludeReservationId && mongoose.isValidObjectId(excludeReservationId)) {
            reservationQuery._id = { $ne: excludeReservationId };
        }
        const reservationList = await Reservation.find(reservationQuery)
            .select("table date durationMinutes bufferMinutes");

        const tableFilter = { capacity: { $gte: guestCount } };
        if (category) tableFilter.category = category;

        const tables = await Table.find(tableFilter).sort({ tableNumber: 1 });
        const now = new Date();
        const slots = [];

        for (
            let minutes = openingMinutes;
            minutes + duration + buffer <= closingMinutes;
            minutes += interval
        ) {
            const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
            const minute = String(minutes % 60).padStart(2, "0");
            const time = `${hour}:${minute}`;
            const slotStart = new Date(`${date}T${time}:00`);

            if (slotStart <= now) continue;

            const availableTables = tables.filter((table) => {
                return !reservationList.some((reservation) => {
                    if (reservation.table.toString() !== table._id.toString()) return false;

                    const existingStart = new Date(reservation.date);
                    const existingDuration = reservation.durationMinutes || duration;
                    const existingBuffer = reservation.bufferMinutes ?? buffer;
                    const existingEnd = new Date(
                        existingStart.getTime() + (existingDuration + existingBuffer) * 60000
                    );
                    const requestedEnd = new Date(
                        slotStart.getTime() + (duration + buffer) * 60000
                    );

                    return slotStart < existingEnd && requestedEnd > existingStart;
                });
            });

            slots.push({
                time,
                tables: availableTables
            });
        }

        res.json({
            date,
            settings: {
                reservationDurationMinutes: duration,
                bufferMinutes: buffer,
                slotIntervalMinutes: interval,
                specialDay: Boolean(specialDay),
                specialDayNote: specialDay?.note || ""
            },
            slots
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Unable to find available tables",
            error: error.message
        });
    }
};

module.exports = {
    addTable,
    getTables,
    updateTable,
    deleteTable,
    getAvailableTables
};