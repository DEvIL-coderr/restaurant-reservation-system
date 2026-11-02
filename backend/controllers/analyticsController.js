const Reservation = require("../models/Reservation");
const Table = require("../models/Table");
const User = require("../models/User");

const getAdminAnalytics = async (req, res) => {
    try {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const [
            totalReservations,
            pendingReservations,
            confirmedReservations,
            cancelledReservations,
            totalTables,
            totalCustomers,
            upcomingReservations,
            monthlyReservations,
            recentReservations
        ] = await Promise.all([
            Reservation.countDocuments(),
            Reservation.countDocuments({ status: "pending" }),
            Reservation.countDocuments({ status: "confirmed" }),
            Reservation.countDocuments({ status: "cancelled" }),
            Table.countDocuments(),
            User.countDocuments({ role: "customer" }),
            Reservation.countDocuments({
                date: { $gte: now },
                status: { $in: ["pending", "confirmed"] }
            }),
            Reservation.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } }
            ]),
            Reservation.aggregate([
                { $match: { createdAt: { $gte: sevenDaysAgo } } },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" },
                            day: { $dayOfMonth: "$createdAt" }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
            ])
        ]);

        const monthlyData = Array.from({ length: 6 }, (_, index) => {
            const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const found = monthlyReservations.find(
                (item) => item._id.year === year && item._id.month === month
            );

            return {
                label: date.toLocaleString("en", { month: "short" }),
                year,
                count: found?.count || 0
            };
        });

        const dailyData = Array.from({ length: 7 }, (_, index) => {
            const date = new Date(sevenDaysAgo);
            date.setDate(sevenDaysAgo.getDate() + index);
            const found = recentReservations.find(
                (item) =>
                    item._id.year === date.getFullYear() &&
                    item._id.month === date.getMonth() + 1 &&
                    item._id.day === date.getDate()
            );

            return {
                label: date.toLocaleString("en", { weekday: "short" }),
                date: date.toISOString().slice(0, 10),
                count: found?.count || 0
            };
        });

        res.json({
            summary: {
                totalReservations,
                pendingReservations,
                confirmedReservations,
                cancelledReservations,
                totalTables,
                totalCustomers,
                upcomingReservations
            },
            monthlyData,
            dailyData
        });
    } catch (error) {
        console.error("Admin analytics error:", error);
        res.status(500).json({
            message: "Unable to load dashboard analytics"
        });
    }
};

module.exports = { getAdminAnalytics };
