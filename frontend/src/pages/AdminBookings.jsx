import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AdminBookings() {
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [cancellationReasons, setCancellationReasons] = useState({});

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/reservations/all",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setBookings(
                    Array.isArray(data.reservations)
                        ? data.reservations
                        : []
                );
            } else {
                setMessage(
                    data.message || "Failed to load bookings"
                );
            }
        } catch (error) {
            console.error(error);
            setMessage("Server connection failed");
        } finally {
            setLoading(false);
        }
    };

    const updateBookingStatus = async (id, status, reason = "") => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/reservations/admin/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        status,
                        cancellationMessage: reason
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                setMessage(
                    status === "confirmed"
                        ? "Booking confirmed successfully"
                        : "Booking cancelled successfully"
                );

                fetchBookings();
            } else {
                setMessage(
                    data.message ||
                        "Failed to update booking"
                );
            }
        } catch (error) {
            console.error(error);
            setMessage("Server connection failed");
        }
    };

    const markOnSitePaymentReceived = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/reservations/admin/${id}/onsite-payment`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Could not update payment status");
            setMessage("Pay-at-restaurant payment marked as received.");
            fetchBookings();
        } catch (error) {
            setMessage(error.message || "Server connection failed");
        }
    };

    const deleteCancelledBooking = async (id) => {
        const confirmDelete = window.confirm(
            "Delete this cancelled booking permanently?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:5000/api/reservations/admin/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setMessage(
                    "Cancelled booking deleted successfully"
                );

                fetchBookings();
            } else {
                setMessage(
                    data.message ||
                        "Failed to delete booking"
                );
            }
        } catch (error) {
            console.error(error);
            setMessage("Server connection failed");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    };

    if (!token) {
        navigate("/login");
        return null;
    }

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

                    {/* <Link to="/">
                        View Restaurant
                    </Link> */}

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

                    <div className="admin-page-header">

                        <div>
                            <p className="home-tagline">
                                RESTAURANT MANAGEMENT
                            </p>

                            <h1>
                                Booking Management
                            </h1>

                            <p className="admin-subtitle">
                                Manage customer reservations
                                and booking status.
                            </p>
                        </div>

                        <div className="booking-count">

                            <span>
                                Total Bookings
                            </span>

                            <strong>
                                {bookings.length}
                            </strong>

                        </div>

                    </div>

                    {message && (
                        <div className="admin-message">
                            {message}
                        </div>
                    )}

                    {loading ? (

                        <div className="admin-loading">
                            Loading bookings...
                        </div>

                    ) : bookings.length === 0 ? (

                        <div className="no-tables">

                            <h3>
                                No Bookings Found
                            </h3>

                            <p>
                                There are currently no
                                customer reservations.
                            </p>

                        </div>

                    ) : (

                        <div className="admin-booking-list">

                            {bookings.map((booking) => {

                                const bookingDate =
                                    new Date(booking.date);

                                return (
                                    <div
                                        className="admin-booking-card"
                                        key={booking._id}
                                    >

                                        <div className="booking-card-header">

                                            <div>

                                                <span className="booking-label">
                                                    BOOKING
                                                </span>

                                                <h2>
                                                    Table{" "}
                                                    {booking.table
                                                        ?.tableNumber ||
                                                        "N/A"}
                                                </h2>

                                            </div>

                                            <span
                                                className={
                                                    booking.status ===
                                                    "confirmed"
                                                        ? "status-confirmed"
                                                        : booking.status ===
                                                          "cancelled"
                                                        ? "status-cancelled"
                                                        : "status-pending"
                                                }
                                            >
                                                {booking.status}
                                            </span>

                                        </div>

                                        <div className="booking-details">

                                            <div className="booking-detail-group">

                                                <h4>
                                                    Customer
                                                </h4>

                                                <p className="booking-primary">
                                                    {booking.user?.name ||
                                                        "N/A"}
                                                </p>

                                                <p>
                                                    {booking.user?.email ||
                                                        "N/A"}
                                                </p>

                                                <p>
                                                    {booking.user?.phone ||
                                                        "No phone"}
                                                </p>

                                            </div>

                                            <div className="booking-detail-group">

                                                <h4>
                                                    Reservation
                                                </h4>

                                                <p>
                                                    <strong>
                                                        Date:
                                                    </strong>{" "}
                                                    {bookingDate.toLocaleDateString()}
                                                </p>

                                                <p>
                                                    <strong>
                                                        Time:
                                                    </strong>{" "}
                                                    {bookingDate.toLocaleTimeString(
                                                        [],
                                                        {
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        }
                                                    )}
                                                </p>

                                                <p>
                                                    <strong>
                                                        Guests:
                                                    </strong>{" "}
                                                    {booking.guests}
                                                </p>
                                                <p><strong>Payment:</strong> {booking.paymentMethod === "pay_at_restaurant" ? "Pay at restaurant" : "Online"}</p>
                                                <p><strong>Pricing:</strong> {booking.pricingMode === "full_table" ? "Full table" : "Per person"}</p>
                                                <p><strong>Table price:</strong> ₹{Number(booking.tablePrice || 0).toLocaleString("en-IN")}</p>
                                                <p><strong>Total booking amount:</strong> ₹{Number(booking.bookingFee || 0).toLocaleString("en-IN")}</p>
                                                <p><strong>Payment status:</strong> {booking.paymentStatus || "not_required"}</p>
                                                {booking.paymentMethod === "pay_at_restaurant" && booking.paymentStatus !== "paid" && booking.status === "confirmed" && (
                                                    <button type="button" className="save-button" onClick={() => markOnSitePaymentReceived(booking._id)}>
                                                        Mark restaurant payment received
                                                    </button>
                                                )}

                                            </div>

                                            <div className="booking-detail-group">

                                                <h4>
                                                    Table Details
                                                </h4>

                                                <p>
                                                    <strong>
                                                        Category:
                                                    </strong>{" "}
                                                    {booking.table
                                                        ?.category ||
                                                        "N/A"}
                                                </p>

                                                <p>
                                                    <strong>
                                                        Capacity:
                                                    </strong>{" "}
                                                    {booking.table
                                                        ?.capacity ||
                                                        "N/A"}{" "}
                                                    guests
                                                </p>

                                            </div>

                                        </div>

                                        {booking.status ===
                                        "cancelled" ? (

                                            <div className="admin-booking-actions">

                                                <button
                                                    type="button"
                                                    className="cancel-button"
                                                    onClick={() =>
                                                        deleteCancelledBooking(
                                                            booking._id
                                                        )
                                                    }
                                                >
                                                    Delete Cancelled Booking
                                                </button>

                                            </div>

                                        ) : (

                                            <div className="admin-booking-actions">

                                                {booking.status !==
                                                    "confirmed" && (

                                                    <button
                                                        type="button"
                                                        className="save-button"
                                                        onClick={() =>
                                                            updateBookingStatus(
                                                                booking._id,
                                                                "confirmed"
                                                            )
                                                        }
                                                    >
                                                        Confirm Booking
                                                    </button>

                                                )}

                                                <div style={{ display: "grid", gap: "8px", width: "100%", maxWidth: "520px" }}>
                                                    <label htmlFor={`cancel-reason-${booking._id}`} style={{ fontWeight: 600, color: "#49372b" }}>Message to customer (shown in My Bookings and sent by email)</label>
                                                    <textarea
                                                        id={`cancel-reason-${booking._id}`}
                                                        rows="2"
                                                        maxLength="1000"
                                                        placeholder="Explain why this reservation is being cancelled..."
                                                        value={cancellationReasons[booking._id] || ""}
                                                        onChange={(event) => setCancellationReasons((current) => ({ ...current, [booking._id]: event.target.value }))}
                                                        style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px", font: "inherit", boxSizing: "border-box" }}
                                                    />
                                                    <button type="button" className="cancel-button" onClick={() => updateBookingStatus(booking._id, "cancelled", cancellationReasons[booking._id] || "")}>
                                                        Cancel Booking & Notify Customer
                                                    </button>
                                                </div>

                                            </div>

                                        )}

                                    </div>
                                );
                            })}

                        </div>

                    )}

                </div>

            </main>

        </div>
    );
}

export default AdminBookings;