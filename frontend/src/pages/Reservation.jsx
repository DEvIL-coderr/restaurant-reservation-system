import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Reservation() {
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [guests, setGuests] = useState("");
    const [category, setCategory] = useState("");

    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState("");

    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [message, setMessage] = useState("");

    // =========================
    // LOGOUT
    // =========================

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    };

    // =========================
    // SEARCH TABLES
    // =========================

    const searchTables = async (e) => {
        e.preventDefault();

        setMessage("");
        setTables([]);
        setSelectedTable("");
        setSearched(false);

        if (!date || !time || !guests) {
            setMessage(
                "Please select date, time and number of guests"
            );
            return;
        }

        setLoading(true);

        try {
            let url =
                `http://localhost:5000/api/tables/available` +
                `?date=${date}` +
                `&time=${time}` +
                `&guests=${guests}`;

            if (category) {
                url += `&category=${category}`;
            }

            console.log("Searching:", url);

            const response = await fetch(url);
            const data = await response.json();

            console.log("API response:", data);

            setSearched(true);

            if (response.ok) {
                const availableTables =
                    Array.isArray(data.tables)
                        ? data.tables
                        : [];

                setTables(availableTables);

                if (availableTables.length === 0) {
                    setMessage(
                        "No tables are available for the selected date and time."
                    );
                }
            } else {
                setMessage(
                    data.message ||
                        "Failed to search tables"
                );
            }

        } catch (error) {
            console.error(error);
            setMessage("Server connection failed");
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // CONFIRM RESERVATION
    // =========================

    const handleReservation = async () => {

        if (!selectedTable) {
            setMessage("Please select a table first");
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/reservations",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        table: selectedTable,
                        date: `${date}T${time}`,
                        guests: Number(guests)
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                navigate("/reservations");
            } else {
                setMessage(
                    data.message ||
                        "Failed to create reservation"
                );
            }

        } catch (error) {
            console.error(error);
            setMessage("Server connection failed");
        }
    };

    // =========================
    // LOGIN CHECK
    // =========================

    if (!token) {
        navigate("/login");
        return null;
    }

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
                MAIN
            ========================= */}

            <main className="reservation-page">

                <div className="reservation-container">

                    <h1>
                        Reserve Your Table
                    </h1>

                    <p className="reservations-subtitle">
                        Find the perfect table for your
                        dining experience.
                    </p>


                    {/* =========================
                        SEARCH FORM
                    ========================= */}

                    <div className="reservation-card">

                        <form onSubmit={searchTables}>

                            <label>
                                Date
                            </label>

                            <input
                                type="date"
                                value={date}
                                min={
                                    new Date()
                                        .toISOString()
                                        .split("T")[0]
                                }
                                onChange={(e) =>
                                    setDate(e.target.value)
                                }
                                required
                            />


                            <label>
                                Time
                            </label>

                            <input
                                type="time"
                                value={time}
                                onChange={(e) =>
                                    setTime(e.target.value)
                                }
                                required
                            />


                            <label>
                                Number of Guests
                            </label>

                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={guests}
                                placeholder="Enter number of guests"
                                onChange={(e) =>
                                    setGuests(e.target.value)
                                }
                                required
                            />


                            <label>
                                Table Category
                            </label>

                            <select
                                value={category}
                                onChange={(e) =>
                                    setCategory(e.target.value)
                                }
                            >
                                <option value="">
                                    All Categories
                                </option>

                                <option value="Indoor">
                                    Indoor
                                </option>

                                <option value="Outdoor">
                                    Outdoor
                                </option>

                                <option value="Family">
                                    Family
                                </option>

                                <option value="Window">
                                    Window
                                </option>
                            </select>


                            <button
                                type="submit"
                                className="primary-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Searching..."
                                    : "Search Available Tables"}
                            </button>

                        </form>

                    </div>


                    {/* =========================
                        SEARCH RESULT
                    ========================= */}

                    {searched && (

                        <section className="available-tables">

                            <h2>
                                Available Tables
                            </h2>


                            {tables.length > 0 ? (

                                <div className="table-list">

                                    {tables.map((item) => (

                                        <div
                                            key={item._id}
                                            className={`table-option ${
                                                selectedTable ===
                                                item._id
                                                    ? "selected"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                setSelectedTable(
                                                    item._id
                                                )
                                            }
                                        >

                                            <h3>
                                                Table{" "}
                                                {item.tableNumber}
                                            </h3>

                                            <p>
                                                Capacity:{" "}
                                                {item.capacity}{" "}
                                                guests
                                            </p>

                                            <p>
                                                Category:{" "}
                                                {item.category}
                                            </p>

                                            <span className="table-status">
                                                Available
                                            </span>

                                        </div>

                                    ))}

                                </div>

                            ) : (

                                <div className="no-tables">

                                    <h3>
                                        No Tables Available
                                    </h3>

                                    <p>
                                        There are no tables
                                        available for your
                                        selected date, time
                                        and number of guests.
                                    </p>

                                </div>

                            )}


                            {/* =========================
                                CONFIRM BUTTON
                            ========================= */}

                            {selectedTable && (

                                <button
                                    className="primary-button confirm-booking-button"
                                    onClick={
                                        handleReservation
                                    }
                                >
                                    Confirm Reservation
                                </button>

                            )}

                        </section>

                    )}

                </div>

            </main>

        </div>
    );
}

export default Reservation;
