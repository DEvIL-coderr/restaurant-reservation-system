import { Link, useNavigate } from "react-router-dom";

function AdminDashboard() {
    const navigate = useNavigate();

    const user = JSON.parse(
        localStorage.getItem("user")
    );

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    };

    return (
        <div className="page">

            <header className="navbar">

                <div className="logo">
                    Restaurant Admin
                </div>

                <nav className="nav-links">

                    <Link to="/admin">
                        Dashboard
                    </Link>

                    <Link to="/admin/tables">
                        Tables
                    </Link>

                    <Link to="/admin/bookings">
                        Bookings
                    </Link>

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </nav>

            </header>


            <main className="admin-page">

                <div className="admin-container">

                    <p className="home-tagline">
                        RESTAURANT MANAGEMENT
                    </p>

                    <h1>
                        Admin Dashboard
                    </h1>

                    <p className="admin-subtitle">
                        Welcome, {user?.name || "Admin"}.
                        Manage your restaurant from here.
                    </p>


                    <div className="admin-cards">

                        <Link
                            to="/admin/tables"
                            className="admin-card"
                        >
                            <div className="admin-card-icon">
                                🪑
                            </div>

                            <h2>
                                Table Management
                            </h2>

                            <p>
                                Add, edit, delete and manage
                                restaurant tables.
                            </p>
                        </Link>


                        <Link
                            to="/admin/bookings"
                            className="admin-card"
                        >
                            <div className="admin-card-icon">
                                📅
                            </div>

                            <h2>
                                Booking Management
                            </h2>

                            <p>
                                View and manage customer
                                reservations.
                            </p>
                        </Link>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default AdminDashboard;