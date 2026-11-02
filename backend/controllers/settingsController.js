const RestaurantSettings = require("../models/RestaurantSettings");

const DEFAULT_DAYS = [
    "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday", "Sunday"
];

const getRestaurantSettings = async (req, res) => {
    try {
        let settings = await RestaurantSettings.findOne({ key: "main" });

        if (!settings) {
            settings = new RestaurantSettings({ key: "main" });
        }

        res.json({ settings });
    } catch (error) {
        res.status(500).json({
            message: "Unable to load restaurant settings",
            error: error.message
        });
    }
};

const updateRestaurantSettings = async (req, res) => {
    try {
        const {
            reservationDurationMinutes,
            bufferMinutes,
            slotIntervalMinutes,
            weeklyHours
        } = req.body;

        const duration = Number(reservationDurationMinutes);
        const buffer = Number(bufferMinutes);
        const interval = Number(slotIntervalMinutes);

        if (!Number.isInteger(duration) || duration < 30 || duration > 360) {
            return res.status(400).json({
                message: "Reservation duration must be between 30 and 360 minutes"
            });
        }

        if (!Number.isInteger(buffer) || buffer < 0 || buffer > 120) {
            return res.status(400).json({
                message: "Buffer time must be between 0 and 120 minutes"
            });
        }

        if (!Number.isInteger(interval) || interval < 15 || interval > 120) {
            return res.status(400).json({
                message: "Slot interval must be between 15 and 120 minutes"
            });
        }

        if (!Array.isArray(weeklyHours) || weeklyHours.length !== 7) {
            return res.status(400).json({
                message: "Please provide opening hours for all seven days"
            });
        }

        const seenDays = new Set();

        for (const dayHours of weeklyHours) {
            if (!dayHours || !DEFAULT_DAYS.includes(dayHours.day) || seenDays.has(dayHours.day)) {
                return res.status(400).json({
                    message: "Weekly hours must contain each day exactly once"
                });
            }

            seenDays.add(dayHours.day);

            if (typeof dayHours.isOpen !== "boolean") {
                return res.status(400).json({
                    message: "Select whether each day is open or closed"
                });
            }

            if (dayHours.isOpen) {
                const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

                if (
                    !timePattern.test(dayHours.openTime || "") ||
                    !timePattern.test(dayHours.closeTime || "") ||
                    dayHours.openTime >= dayHours.closeTime
                ) {
                    return res.status(400).json({
                        message: `Enter valid opening and closing times for ${dayHours.day}`
                    });
                }
            }
        }

        const settings = await RestaurantSettings.findOneAndUpdate(
            { key: "main" },
            {
                $set: {
                    reservationDurationMinutes: duration,
                    bufferMinutes: buffer,
                    slotIntervalMinutes: interval,
                    weeklyHours: weeklyHours.map((item) => ({
                        day: item.day,
                        isOpen: item.isOpen,
                        openTime: item.isOpen ? item.openTime : "09:00",
                        closeTime: item.isOpen ? item.closeTime : "22:00"
                    }))
                },
                $setOnInsert: { key: "main" }
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        res.json({
            message: "Restaurant settings saved successfully",
            settings
        });
    } catch (error) {
        res.status(500).json({
            message: "Unable to save restaurant settings",
            error: error.message
        });
    }
};

module.exports = {
    getRestaurantSettings,
    updateRestaurantSettings
};
