const SpecialDay = require("../models/SpecialDay");

const validTime = (value) => typeof value === "string" && /^([01]\\d|2[0-3]):[0-5]\\d$/.test(value);

const getSpecialDays = async (req, res) => {
    try {
        const specialDays = await SpecialDay.find({
            date: { $gte: new Date().toISOString().slice(0, 10) }
        }).sort({ date: 1 });
        res.json({ specialDays });
    } catch (error) {
        res.status(500).json({ message: "Unable to load special dates", error: error.message });
    }
};

const createSpecialDay = async (req, res) => {
    try {
        const { date, isClosed, openTime, closeTime, note } = req.body;
        if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(date || "") || typeof isClosed !== "boolean") {
            return res.status(400).json({ message: "Select a valid date and opening status" });
        }
        if (!isClosed && (!validTime(openTime) || !validTime(closeTime) || openTime >= closeTime)) {
            return res.status(400).json({ message: "Enter valid opening and closing times" });
        }

        const specialDay = await SpecialDay.findOneAndUpdate(
            { date },
            {
                $set: {
                    date,
                    isClosed,
                    openTime: isClosed ? "09:00" : openTime,
                    closeTime: isClosed ? "22:00" : closeTime,
                    note: String(note || "").trim().slice(0, 120)
                }
            },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );
        res.status(200).json({ message: "Special date saved successfully", specialDay });
    } catch (error) {
        res.status(500).json({ message: "Unable to save special date", error: error.message });
    }
};

const deleteSpecialDay = async (req, res) => {
    try {
        const specialDay = await SpecialDay.findByIdAndDelete(req.params.id);
        if (!specialDay) return res.status(404).json({ message: "Special date not found" });
        res.json({ message: "Special date removed. Weekly hours will apply again." });
    } catch (error) {
        res.status(500).json({ message: "Unable to remove special date", error: error.message });
    }
};

module.exports = { getSpecialDays, createSpecialDay, deleteSpecialDay };
