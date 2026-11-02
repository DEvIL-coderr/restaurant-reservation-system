console.log("THIS IS MY RESTAURANT SERVER");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const tableRoutes = require("./routes/tableRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const specialDayRoutes = require("./routes/specialDayRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const startReminderScheduler = require("./utils/reminderScheduler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/special-days", specialDayRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/", (req, res) => {
    res.send("Restaurant Reservation API is running");
});

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");

        startReminderScheduler();

        const port = process.env.PORT || 5000;
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    })
    .catch((error) => {
        console.log("MongoDB connection failed:", error.message);
    });
