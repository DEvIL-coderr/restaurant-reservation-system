const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        table: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Table",
            required: true
        },

        date: {
            type: Date,
            required: true
        },

        guests: {
            type: Number,
            required: true
        },

        durationMinutes: {
            type: Number,
            min: 30
        },

        bufferMinutes: {
            type: Number,
            min: 0
        },

        pricingMode: {
            type: String,
            enum: ["per_person", "full_table"],
            default: "full_table"
        },

        tablePrice: {
            type: Number,
            min: 0,
            default: 0
        },

        bookingFee: {
            type: Number,
            min: 0,
            default: 0
        },

        cancellationMessage: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },

        paymentMethod: {
            type: String,
            enum: ["online", "pay_at_restaurant"],
            default: "online"
        },
        paymentStatus: {
            type: String,
            enum: ["not_required", "pending", "paid", "failed"],
            default: "not_required"
        },
        razorpayOrderId: {
            type: String,
            default: ""
        },
        razorpayPaymentId: {
            type: String,
            default: ""
        },
        razorpaySignature: {
            type: String,
            default: ""
        },
        paidAt: {
            type: Date,
            default: null
        },

        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled"],
            default: "pending"
        },

        reminderSent: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Reservation", reservationSchema);
