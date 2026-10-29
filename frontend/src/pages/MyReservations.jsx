import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function MyReservations() {
    const navigate = useNavigate();

    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const [editingId, setEditingId] = useState(null);
    const [editDate, setEditDate] = useState("");
    const [editGuests, setEditGuests] = useState("");

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        fetchReservations();
    }, [navigate, token]);

    // =========================
    // FETCH RESERVATIONS
    // =========================

  const fetchReservations = async () => {
    try {
        const response = await fetch(
            "http://localhost:5000/api/reservations",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        console.log("Reservations API response:", data);

        if (response.ok) {
            const reservationList = Array.isArray(data)
                ? data
                : Array.isArray(data.reservations)
                ? data.reservations
                : [];

            setReservations(reservationList);
        } else {
            setReservations([]);
            setMessage(
                data.message || "Failed to load reservations"
            );
        }

    } catch (error) {
        console.error("Reservation error:", error);
        setReservations([]);
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
    // CANCEL RESERVATION
    // =========================

    const handleCancel = async (id) => {
        const confirmCancel = window.confirm(
            "Are you sure you want to cancel this reservation?"
        );

        if (!confirmCancel) {
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:5000/api/reservations/${id}/cancel`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setReservations(
                    reservations.map((reservation) =>
                        reservation._id === id
                            ? {
                                  ...reservation,
                                  status: "cancelled"
                              }
                            : reservation
                    )
                );

                setMessage("Reservation cancelled successfully");
            } else {
                setMessage(
                    data.message || "Failed to cancel reservation"
                );
            }
        } catch (error) {
            setMessage("Server connection failed");
        }
    };

    // =========================
    // START MODIFY
    // =========================

    const startModify = (reservation) => {
        const date = new Date(reservation.date);

        const formattedDate =
            date.getFullYear() +
            "-" +
            String(date.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(date.getDate()).padStart(2, "0") +
            "T" +
            String(date.getHours()).padStart(2, "0") +
            ":" +
            String(date.getMinutes()).padStart(2, "0");

        setEditingId(reservation._id);
        setEditDate(formattedDate);
        setEditGuests(reservation.guests);

        setMessage("");
    };

    // =========================
    // CANCEL EDIT
    // =========================

    const cancelEdit = () => {
        setEditingId(null);
        setEditDate("");
        setEditGuests("");
    };

    // =========================
    // MODIFY RESERVATION
    // =========================

    const handleModify = async () => {
        if (!editDate || !editGuests) {
            setMessage("Please enter date, time and number of guests");
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:5000/api/reservations/${editingId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        date: editDate,
                        guests: Number(editGuests)
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                setReservations(
                    reservations.map((reservation) =>
                        reservation._id === editingId
                            ? data.reservation
                            : reservation
                    )
                );

                setMessage("Reservation updated successfully");

                setEditingId(null);
                setEditDate("");
                setEditGuests("");
            } else {
                setMessage(
                    data.message || "Failed to update reservation"
                );
            }
        } catch (error) {
            setMessage("Server connection failed");
        }
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
                        <Link to="/reservation">Reserve</Link>
                        <Link to="/reservations">
                            My Bookings
                        </Link>
                        <Link to="/profile">Profile</Link>

                        <button
                            className="logout-button"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </nav>

                </header>

                <main className="reservations-page">
                    <div className="loading">
                        Loading reservations...
                    </div>
                </main>

            </div>
        );
    }

    // =========================
    // PAGE
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
                RESERVATIONS
            ========================= */}

            <main className="reservations-page">

                <div className="reservations-container">

                    <h1>
                        My Reservations
                    </h1>

                    <p className="reservations-subtitle">
                        Manage your upcoming and previous
                        restaurant bookings.
                    </p>


                    {/* MESSAGE */}

                    {message && (
                        <p className="error-message">
                            {message}
                        </p>
                    )}


                    {/* NO RESERVATIONS */}

                    {reservations.length === 0 ? (

                        <div className="reservation-card">

                            <h3>
                                No Reservations Yet
                            </h3>

                            <p>
                                You haven't made any restaurant
                                reservations yet.
                            </p>

                            <div className="reservation-actions">

                                <Link
                                    to="/reservation"
                                    className="primary-button"
                                >
                                    Reserve a Table
                                </Link>

                                <Link
                                    to="/"
                                    className="secondary-button"
                                >
                                    Back to Home
                                </Link>

                            </div>

                        </div>

                    ) : (

                        /* =========================
                           RESERVATION LIST
                        ========================= */

                        reservations.map((reservation) => (

                            <div
                                className="reservation-card"
                                key={reservation._id}
                            >

                                <h3>
                                    Table{" "}
                                    {reservation.table?.tableNumber}
                                </h3>

                                <p>
                                    <strong>
                                        Capacity:
                                    </strong>{" "}
                                    {reservation.table?.capacity}
                                    {" "}guests
                                </p>

                                <p>
                                    <strong>
                                        Your Guests:
                                    </strong>{" "}
                                    {reservation.guests}
                                </p>

                                <p>
                                    <strong>
                                        Date & Time:
                                    </strong>{" "}
                                    {new Date(
                                        reservation.date
                                    ).toLocaleString()}
                                </p>

                                <p>
                                    <strong>
                                        Status:
                                    </strong>{" "}

                                    <span
                                        className={`status status-${reservation.status}`}
                                    >
                                        {reservation.status}
                                    </span>
                                </p>


                                {/* =========================
                                    ACTION BUTTONS
                                ========================= */}

                                {reservation.status !==
                                    "cancelled" && (
                                    <div className="reservation-actions">

                                        <button
                                            className="modify-button"
                                            onClick={() =>
                                                startModify(
                                                    reservation
                                                )
                                            }
                                        >
                                            Modify Reservation
                                        </button>

                                        <button
                                            className="cancel-button"
                                            onClick={() =>
                                                handleCancel(
                                                    reservation._id
                                                )
                                            }
                                        >
                                            Cancel Reservation
                                        </button>

                                    </div>
                                )}


                                {/* =========================
                                    MODIFY FORM
                                ========================= */}

                                {editingId ===
                                    reservation._id && (
                                    <div className="modify-form">

                                        <h3>
                                            Modify Reservation
                                        </h3>

                                        <label>
                                            Date & Time
                                        </label>

                                        <br />

                                        <input
                                            type="datetime-local"
                                            value={editDate}
                                            min={
                                                new Date()
                                                    .toISOString()
                                                    .slice(0, 16)
                                            }
                                            onChange={(e) =>
                                                setEditDate(
                                                    e.target.value
                                                )
                                            }
                                        />

                                        <br />

                                        <label>
                                            Number of Guests
                                        </label>

                                        <br />

                                        <input
                                            type="number"
                                            min="1"
                                            value={editGuests}
                                            onChange={(e) =>
                                                setEditGuests(
                                                    e.target.value
                                                )
                                            }
                                        />

                                        <br />

                                        <button
                                            className="save-button"
                                            onClick={handleModify}
                                        >
                                            Save Changes
                                        </button>

                                        <button
                                            className="edit-cancel-button"
                                            onClick={cancelEdit}
                                        >
                                            Cancel Edit
                                        </button>

                                    </div>
                                )}

                            </div>

                        ))

                    )}

                </div>

            </main>

        </div>
    );
}

export default MyReservations;