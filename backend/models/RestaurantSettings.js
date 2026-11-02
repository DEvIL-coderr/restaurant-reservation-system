const mongoose = require("mongoose");

const weeklyHourSchema = new mongoose.Schema(
    {
        day: {
            type: String,
            enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            required: true
        },
        isOpen: {
            type: Boolean,
            default: true
        },
        openTime: {
            type: String,
            default: "09:00"
        },
        closeTime: {
            type: String,
            default: "22:00"
        }
    },
    { _id: false }
);

const restaurantSettingsSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            default: "main",
            unique: true
        },
        reservationDurationMinutes: {
            type: Number,
            default: 120,
            min: 30,
            max: 360
        },
        bufferMinutes: {
            type: Number,
            default: 15,
            min: 0,
            max: 120
        },
        slotIntervalMinutes: {
            type: Number,
            default: 30,
            min: 15,
            max: 120
        },
        bookingFee: {
            type: Number,
            default: 0,
            min: 0,
            max: 100000
        },
        payAtRestaurantEnabled: {
            type: Boolean,
            default: false
        },
        payAtRestaurantTables: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Table"
        }],
        payAtRestaurantStartTime: {
            type: String,
            default: "00:00"
        },
        payAtRestaurantEndTime: {
            type: String,
            default: "23:59"
        },
        weeklyHours: {
            type: [weeklyHourSchema],
            default: [
                { day: "Monday", isOpen: true, openTime: "09:00", closeTime: "22:00" },
                { day: "Tuesday", isOpen: true, openTime: "09:00", closeTime: "22:00" },
                { day: "Wednesday", isOpen: true, openTime: "09:00", closeTime: "22:00" },
                { day: "Thursday", isOpen: true, openTime: "09:00", closeTime: "22:00" },
                { day: "Friday", isOpen: true, openTime: "09:00", closeTime: "23:00" },
                { day: "Saturday", isOpen: true, openTime: "09:00", closeTime: "23:00" },
                { day: "Sunday", isOpen: true, openTime: "10:00", closeTime: "22:00" }
            ]
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("RestaurantSettings", restaurantSettingsSchema);
