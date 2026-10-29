const Table = require("../models/Table");
const Reservation = require("../models/Reservation");

const addTable = async (req, res) => {
    try {
        const { tableNumber, capacity, category } = req.body;

        const existingTable = await Table.findOne({ tableNumber });

        if (existingTable) {
            return res.status(400).json({
                message: "Table already exists"
            });
        }

        const table = await Table.create({
            tableNumber,
            capacity,
            category
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

        const table = await Table.findByIdAndUpdate(
            id,
            req.body,
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

const getAvailableTables = async (req, res) => {
    try {
        const { date, time, guests, category } = req.query;

        if (!date || !time || !guests) {
            return res.status(400).json({
                message: "Date, time and guests are required"
            });
        }

        const selectedDate = new Date(`${date}T${time}`);

        if (isNaN(selectedDate.getTime())) {
            return res.status(400).json({
                message: "Invalid date or time"
            });
        }

        const tableFilter = {
            capacity: { $gte: Number(guests) }
        };

        if (category) {
            tableFilter.category = category;
        }

        const tables = await Table.find(tableFilter);

        const reservations = await Reservation.find({
            date: selectedDate,
            status: { $ne: "cancelled" }
        });

        const bookedTableIds = reservations.map(
            (reservation) =>
                reservation.table.toString()
        );

        const availableTables = tables.filter(
            (table) =>
                !bookedTableIds.includes(
                    table._id.toString()
                )
        );

        res.json({
            tables: availableTables
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server error"
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