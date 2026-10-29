console.log("THIS IS MY RESTAURANT SERVER");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const tableRoutes = require("./routes/tableRoutes");
const reservationRoutes = require("./routes/reservationRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.post("/test", (req, res) => {
    res.send("POST is working");
});

app.use("/api/users", userRoutes);
// console.log("REGISTERING TABLE ROUTES");
// app.post("/test", (req, res) => {
//     res.json({
//         message: "Server POST is working"
//     });
// });
app.use("/api/tables", tableRoutes);
app.use("/api/reservations", reservationRoutes);

app.get("/", (req, res) => {
    res.send("Restaurant Reservation API is running");
});

// MongoDB connection...

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");

        app.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });
    })
    .catch((error) => {
        console.log("MongoDB connection failed:", error.message);
    });