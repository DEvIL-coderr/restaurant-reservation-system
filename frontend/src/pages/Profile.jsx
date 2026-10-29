
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Profile() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        fetchProfile();
    }, [navigate, token]);

    // =========================
    // FETCH PROFILE
    // =========================

const fetchProfile = async () => {
    try {
        const response = await fetch(
            "http://localhost:5000/api/users/profile",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        console.log("Profile API response:", data);

        if (response.ok) {
            setUser(data.user || data);
        } else {
            setMessage(
                data.message || "Failed to load profile"
            );
        }

    } catch (error) {
        console.error("Profile error:", error);
        setMessage("Server connection failed");

    } finally {
        setLoading(false);
    }
};

    // =========================
    // LOGOUT
    // =========================

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    };

    // =========================
    // LOADING
    // =========================

    if (loading) {
        return (
            <div className="page">

                <header className="navbar">

                    <div className="logo">
                        Restaurant
                    </div>

                    <nav className="nav-links">
                        <Link to="/">Home</Link>

                        <Link to="/reservation">
                            Reserve
                        </Link>

                        <Link to="/reservations">
                            My Bookings
                        </Link>

                        <Link to="/profile">
                            Profile
                        </Link>

                        <button
                            className="logout-button"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </nav>

                </header>

                <main className="profile-container">

                    <div className="loading">
                        Loading profile...
                    </div>

                </main>

            </div>
        );
    }

    // =========================
    // PROFILE PAGE
    // =========================

    return (
        <div className="page">

            {/* =========================
                NAVBAR
            ========================= */}

            <header className="navbar">

                <div className="logo">
                    Restaurant
                </div>

                <nav className="nav-links">

                    <Link to="/">
                        Home
                    </Link>

                    <Link to="/reservation">
                        Reserve
                    </Link>

                    <Link to="/reservations">
                        My Bookings
                    </Link>

                    <Link to="/profile">
                        Profile
                    </Link>

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </nav>

            </header>


            {/* =========================
                PROFILE CONTENT
            ========================= */}

            <main className="profile-container">

                <div className="profile-card">

                    <div className="profile-icon">
                        👤
                    </div>

                    <h1>
                        My Profile
                    </h1>

                    <p className="profile-subtitle">
                        Manage your account information
                    </p>


                    {message && (
                        <p className="error-message">
                            {message}
                        </p>
                    )}


                    {user && (
                        <div className="profile-details">

                            <div className="profile-item">
                                <span className="profile-label">
                                    Name
                                </span>

                                <span className="profile-value">
                                    {user.name}
                                </span>
                            </div>


                            <div className="profile-item">
                                <span className="profile-label">
                                    Email
                                </span>

                                <span className="profile-value">
                                    {user.email}
                                </span>
                            </div>


                            <div className="profile-item">
                                <span className="profile-label">
                                    Phone
                                </span>

                                <span className="profile-value">
                                    {user.phone || "Not provided"}
                                </span>
                            </div>

                        </div>
                    )}


                    <div className="profile-actions">

                        <Link
                            to="/reservation"
                            className="primary-button"
                        >
                            Reserve a Table
                        </Link>

                        <Link
                            to="/reservations"
                            className="secondary-button"
                        >
                            My Bookings
                        </Link>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default Profile;
