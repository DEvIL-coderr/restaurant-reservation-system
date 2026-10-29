import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Reservation from "./pages/Reservation";
import MyReservations from "./pages/MyReservations";

import AdminDashboard from "./pages/AdminDashboard";
import AdminTables from "./pages/AdminTables";
import AdminBookings from "./pages/AdminBookings";

import AdminRoute from "./components/AdminRoute";

function App() {
    return (
        <BrowserRouter>

            <Routes>

                {/* Customer Pages */}

                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/profile"
                    element={<Profile />}
                />

                <Route
                    path="/reservation"
                    element={<Reservation />}
                />

                <Route
                    path="/reservations"
                    element={<MyReservations />}
                />


                {/* Admin Pages */}

                <Route
                    path="/admin"
                    element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/admin/tables"
                    element={
                        <AdminRoute>
                            <AdminTables />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/admin/bookings"
                    element={
                        <AdminRoute>
                            <AdminBookings />
                        </AdminRoute>
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;