const mongoose = require("mongoose");

const specialDaySchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
        unique: true,
        match: /^\\d{4}-\\d{2}-\\d{2}$/
    },
    isClosed: {
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
    },
    note: {
        type: String,
        trim: true,
        maxlength: 120,
        default: ""
    }
}, { timestamps: true });

module.exports = mongoose.model("SpecialDay", specialDaySchema);
