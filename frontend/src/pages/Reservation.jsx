import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const localDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const formatTime = (time) => {
    const [hour, minute] = time.split(":").map(Number);
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
};

function Reservation() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [calendarMonth, setCalendarMonth] = useState(
        new Date(today.getFullYear(), today.getMonth(), 1)
    );
    const [date, setDate] = useState("");
    const [guests, setGuests] = useState("2");
    const [category, setCategory] = useState("");
    const [slots, setSlots] = useState([]);
    const [selectedTime, setSelectedTime] = useState("");
    const [selectedTable, setSelectedTable] = useState("");
    const [settings, setSettings] = useState(null);
    const [weeklyHours, setWeeklyHours] = useState([]);
    const [specialDays, setSpecialDays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [message, setMessage] = useState("");
    const [booking, setBooking] = useState(false);

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        fetch(`${API}/settings`)
            .then((response) => response.json())
            .then((data) => {
                if (data.settings) {
                    setSettings(data.settings);
                    setWeeklyHours(data.settings.weeklyHours || []);
                }
            })
            .catch((error) => console.error("Unable to load restaurant hours:", error));

        fetch(`${API}/special-days`)
            .then((response) => response.json())
            .then((data) => setSpecialDays(data.specialDays || []))
            .catch((error) => console.error("Unable to load special dates:", error));
    }, [token, navigate]);

    const calendarDays = useMemo(() => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const firstWeekday = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        return [
            ...Array.from({ length: firstWeekday }, () => null),
            ...Array.from({ length: daysInMonth }, (_, index) => index + 1)
        ];
    }, [calendarMonth]);

    const closedDays = useMemo(
        () => new Set(weeklyHours.filter((item) => !item.isOpen).map((item) => item.day)),
        [weeklyHours]
    );

    const getCalendarDateKey = (day) => `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const getSpecialDay = (day) => specialDays.find((item) => item.date === getCalendarDateKey(day));

    const isClosedDate = (day) => {
        if (!day) return false;
        const specialDay = getSpecialDay(day);
        if (specialDay) return specialDay.isClosed;
        if (!weeklyHours.length) return false;
        const value = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
        return closedDays.has(value.toLocaleDateString("en-US", { weekday: "long" }));
    };

    const changeMonth = (amount) => {
        setCalendarMonth((current) =>
            new Date(current.getFullYear(), current.getMonth() + amount, 1)
        );
    };

    const selectDate = (day) => {
        if (!day) return;
        const chosen = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
        chosen.setHours(0, 0, 0, 0);
        if (chosen < today || isClosedDate(day)) return;

        setDate(localDateKey(chosen));
        setSlots([]);
        setSelectedTime("");
        setSelectedTable("");
        setSearched(false);
        setMessage("");
    };

    const searchAvailability = async (event) => {
        event.preventDefault();
        setMessage("");
        setSlots([]);
        setSelectedTime("");
        setSelectedTable("");
        setSearched(false);

        if (!date || !guests) {
            setMessage("Please select a date and number of guests.");
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams({ date, guests });
            if (category) params.set("category", category);

            const response = await fetch(`${API}/tables/available?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Unable to search availability");

            setSearched(true);
            setSlots(Array.isArray(data.slots) ? data.slots : []);
            if (data.closed) {
                setMessage(data.message || "The restaurant is closed on this date.");
            } else if (!data.slots?.length) {
                setMessage("No future booking slots are available on this date.");
            }
        } catch (error) {
            setMessage(error.message || "Server connection failed.");
        } finally {
            setLoading(false);
        }
    };

    const chooseTime = (slot) => {
        setSelectedTime(slot.time);
        setSelectedTable("");
    };

    const availableTables = slots.find((slot) => slot.time === selectedTime)?.tables || [];

    const handleReservation = async () => {
        if (!selectedTime || !selectedTable) {
            setMessage("Choose an available time and table first.");
            return;
        }

        setBooking(true);
        setMessage("");
        try {
            const response = await fetch(`${API}/reservations`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    table: selectedTable,
                    date: `${date}T${selectedTime}`,
                    guests: Number(guests)
                })
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Failed to create reservation");
            navigate("/reservations");
        } catch (error) {
            setMessage(error.message || "Server connection failed.");
            // Availability may have changed since the search; refresh it.
            setSelectedTable("");
            setSelectedTime("");
            setSlots([]);
            setSearched(false);
        } finally {
            setBooking(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    if (!token) return null;

    return (
        <div className="page">
            <header className="navbar">
                <div className="logo">Restaurant</div>
                <nav className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/reservation">Reserve</Link>
                    <Link to="/reservations">My Bookings</Link>
                    <Link to="/profile">Profile</Link>
                    <button className="logout-button" onClick={handleLogout}>Logout</button>
                </nav>
            </header>

            <main className="reservation-page">
                <div className="reservation-container" style={{ maxWidth: "1050px" }}>
                    <p className="home-tagline">YOUR TABLE IS WAITING</p>
                    <h1>Reserve Your Table</h1>
                    <p className="reservations-subtitle">
                        Choose a date, explore available times and select the table that suits your group.
                    </p>

                    {message && <div className="admin-message" role="status">{message}</div>}

                    <form onSubmit={searchAvailability} style={{ display: "grid", gridTemplateColumns: "minmax(280px, 1.15fr) minmax(260px, .85fr)", gap: "22px", alignItems: "start" }}>
                        <section className="reservation-card" style={{ padding: "22px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "18px" }}>
                                <button type="button" className="logout-button" onClick={() => changeMonth(-1)} disabled={calendarMonth.getFullYear() === today.getFullYear() && calendarMonth.getMonth() <= today.getMonth()} aria-label="Previous month">‹</button>
                                <h2 style={{ margin: 0 }}>{calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
                                <button type="button" className="logout-button" onClick={() => changeMonth(1)} aria-label="Next month">›</button>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "6px" }}>
                                {WEEKDAYS.map((day) => (
                                    <div key={day} style={{ textAlign: "center", fontWeight: 700, color: "#806b5a", padding: "7px 0", fontSize: "13px" }}>{day}</div>
                                ))}
                                {calendarDays.map((day, index) => {
                                    const value = day ? new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day) : null;
                                    if (value) value.setHours(0, 0, 0, 0);
                                    const disabled = !day || value < today || isClosedDate(day);
                                    const key = day ? localDateKey(value) : `empty-${index}`;
                                    const selected = date === key;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => selectDate(day)}
                                            aria-pressed={selected}
                                            style={{
                                                minHeight: "43px",
                                                borderRadius: "9px",
                                                border: selected ? "2px solid #76513a" : "1px solid #e8dfd6",
                                                background: selected ? "#76513a" : disabled ? "#f5f2ef" : "#fff",
                                                color: selected ? "#fff" : disabled ? "#c3bbb4" : "#49372b",
                                                fontWeight: selected ? 700 : 500,
                                                cursor: disabled ? "not-allowed" : "pointer"
                                            }}
                                        >
                                            {day || ""}
                                        </button>
                                    );
                                })}
                            </div>
                            <div style={{ marginTop: "14px", padding: "12px", borderRadius: "9px", background: "#fff8f0", color: "#76513a" }}>
                                <strong>Booking fee: ₹{Number(settings?.bookingFee || 0).toLocaleString("en-IN")}</strong>
                                <div style={{ fontSize: "12px", marginTop: "3px" }}>Fixed fee per reservation, set by the restaurant.</div>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginTop: "17px", fontSize: "12px", color: "#76695f" }}>
                                <span>● Selectable date</span>
                                <span style={{ color: "#c3bbb4" }}>● Past / closed / holiday</span>
                                <span style={{ color: "#76513a" }}>● Selected</span>
                            </div>
                            <p style={{ marginTop: "16px", fontWeight: 600 }}>
                                {date ? new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "Select your reservation date"}
                            </p>
                        </section>

                        <section className="reservation-card" style={{ padding: "22px" }}>
                            <h2 style={{ marginTop: 0 }}>Your reservation</h2>
                            <label htmlFor="guestCount">Number of guests</label>
                            <input id="guestCount" type="number" min="1" max="20" value={guests} onChange={(event) => setGuests(event.target.value)} required />
                            <label htmlFor="tableCategory" style={{ marginTop: "14px" }}>Table category</label>
                            <select id="tableCategory" value={category} onChange={(event) => setCategory(event.target.value)}>
                                <option value="">All categories</option>
                                <option value="Indoor">Indoor</option>
                                <option value="Outdoor">Outdoor</option>
                                <option value="Family">Family</option>
                                <option value="Window">Window</option>
                            </select>

                            {settings && (
                                <div style={{ background: "#faf6f1", borderRadius: "9px", padding: "13px", marginTop: "18px", color: "#765c49", fontSize: "13px" }}>
                                    <strong>Reservation details</strong>
                                    <p style={{ margin: "7px 0 0" }}>Duration: {settings.reservationDurationMinutes} minutes</p>
                                    <p style={{ margin: "4px 0 0" }}>Preparation buffer: {settings.bufferMinutes} minutes</p>
                                    <p style={{ margin: "4px 0 0", fontWeight: 700 }}>Booking fee: ₹{Number(settings.bookingFee || 0).toLocaleString("en-IN")}</p>
                                </div>
                            )}

                            <button type="submit" className="primary-button" disabled={loading || !date} style={{ width: "100%", marginTop: "20px" }}>
                                {loading ? "Checking availability..." : "Show Available Times"}
                            </button>
                        </section>
                    </form>

                    {searched && (
                        <section className="available-tables" style={{ marginTop: "26px" }}>
                            <h2>Available Times</h2>
                            {slots.length > 0 ? (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(115px, 1fr))", gap: "10px" }}>
                                    {slots.map((slot) => (
                                        <button
                                            type="button"
                                            key={slot.time}
                                            disabled={!slot.tables?.length}
                                            onClick={() => chooseTime(slot)}
                                            style={{
                                                padding: "13px 9px",
                                                borderRadius: "10px",
                                                border: selectedTime === slot.time ? "2px solid #76513a" : "1px solid #e5d9ce",
                                                background: selectedTime === slot.time ? "#76513a" : slot.tables?.length ? "#fff" : "#f2efec",
                                                color: selectedTime === slot.time ? "#fff" : slot.tables?.length ? "#49372b" : "#aaa19a",
                                                cursor: slot.tables?.length ? "pointer" : "not-allowed"
                                            }}
                                        >
                                            <strong>{formatTime(slot.time)}</strong>
                                            <small style={{ display: "block", marginTop: "4px" }}>
                                                {slot.tables?.length ? `${slot.tables.length} table(s)` : "Fully booked"}
                                            </small>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-tables">
                                    <h3>No booking times available</h3>
                                    <p>Try another date or a different guest count.</p>
                                </div>
                            )}
                        </section>
                    )}

                    {selectedTime && (
                        <section className="available-tables" style={{ marginTop: "24px" }}>
                            <h2>Tables available at {formatTime(selectedTime)}</h2>
                            {availableTables.length ? (
                                <div className="table-list">
                                    {availableTables.map((table) => (
                                        <button
                                            type="button"
                                            key={table._id}
                                            className={`table-option ${selectedTable === table._id ? "selected" : ""}`}
                                            onClick={() => setSelectedTable(table._id)}
                                            style={{ textAlign: "left", cursor: "pointer" }}
                                        >
                                            <h3>Table {table.tableNumber}</h3>
                                            <p>Capacity: {table.capacity} guests</p>
                                            <p>Category: {table.category}</p>
                                            <span className="table-status">Available</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p>No tables are available for this time.</p>
                            )}

                            {selectedTable && (
                                <button className="primary-button confirm-booking-button" onClick={handleReservation} disabled={booking}>
                                    {booking ? "Confirming..." : "Confirm Reservation"}
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
