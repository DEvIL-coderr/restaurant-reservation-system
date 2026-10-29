const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        const existingAdmin = await User.findOne({
            email: "admin@gmail.com"
        });

        if (existingAdmin) {
            console.log("Admin already exists");
            process.exit();
        }

        const hashedPassword = await bcrypt.hash(
            "Admin@",
            10
        );

        const admin = await User.create({
            name: "Restaurant Admin",
            email: "admin@gmail.com",
            password: hashedPassword,
            phone: "9999999999",
            role: "admin"
        });

        console.log("Admin created successfully");
        console.log("Email:", admin.email);
        console.log("Password: Admin@");
        console.log("Role:", admin.role);

        process.exit();

    } catch (error) {
        console.log("Error creating admin:", error.message);
        process.exit(1);
    }
};

createAdmin();