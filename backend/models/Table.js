const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
    {
        tableNumber: { type: Number, required: true, unique: true },
        capacity: { type: Number, required: true, min: 1 },
        category: { type: String, required: true },
        fullTablePrice: { type: Number, default: 0, min: 0 },
        status: {
            type: String,
            enum: ["available", "booked"],
            default: "available"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Table", tableSchema);
