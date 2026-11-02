import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const localDateKey = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
const formatTime = (time) => { const parts = time.split(":").map(Number); return `${parts[0] % 12 || 12}:${String(parts[1]).padStart(2, "0")} ${parts[0] >= 12 ? "PM" : "AM"}`; };

const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const existingScript = document.getElementById("razorpay-checkout-script");
    if (existingScript) {
        existingScript.addEventListener("load", () => resolve(Boolean(window.Razorpay)), { once: true });
        existingScript.addEventListener("error", () => resolve(false), { once: true });
        return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
});

function MyReservations() {
    const navigate = useNavigate();

    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [paymentProcessingId, setPaymentProcessingId] = useState(null);

    const [editingId, setEditingId] = useState(null);
    const [editDate, setEditDate] = useState("");
    const [editGuests, setEditGuests] = useState("");
    const [editMonth, setEditMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [editSlots, setEditSlots] = useState([]);
    const [editSelectedTime, setEditSelectedTime] = useState("");
    const [editSelectedTable, setEditSelectedTable] = useState("");
    const [editSearching, setEditSearching] = useState(false);
    const [editSearched, setEditSearched] = useState(false);
    const [editWeeklyHours, setEditWeeklyHours] = useState([]);
    const [editSpecialDays, setEditSpecialDays] = useState([]);

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        fetchReservations();
        fetch("http://localhost:5000/api/settings").then((r) => r.json()).then((d) => setEditWeeklyHours(d.settings?.weeklyHours || [])).catch(console.error);
        fetch("http://localhost:5000/api/special-days").then((r) => r.json()).then((d) => setEditSpecialDays(d.specialDays || [])).catch(console.error);
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
    // RAZORPAY PAYMENT
    // =========================

    const handlePayment = async (reservation) => {
        setPaymentProcessingId(reservation._id);
        setMessage("");

        try {
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                throw new Error("Unable to load Razorpay Checkout. Please check your internet connection.");
            }

            const orderResponse = await fetch(
                `http://localhost:5000/api/reservations/${reservation._id}/payment/order`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            const orderData = await orderResponse.json();
            if (!orderResponse.ok) throw new Error(orderData.message || orderData.error || "Could not create Razorpay order");
            if (!window.Razorpay) throw new Error("Razorpay Checkout did not load. Disable script blockers and try again.");
            if (!orderData.keyId || !orderData.orderId || Number(orderData.amount) <= 0) {
                throw new Error("Razorpay returned incomplete order details. Check backend test keys and booking amount.");
            }
            let user = {};
            try { user = JSON.parse(localStorage.getItem("user") || "{}"); } catch { user = {}; }
            const checkout = new window.Razorpay({
                key: String(orderData.keyId).trim(),
                amount: Number(orderData.amount),
                currency: orderData.currency,
                name: "Restaurant Reservation",
                description: `Booking fee for table ${reservation.table?.tableNumber || ""}`,
                order_id: orderData.orderId,
                prefill: {
                    name: user.name || "",
                    email: user.email || ""
                },
                theme: { color: "#8b4513" },
                handler: async (paymentResponse) => {
                    try {
                        const verifyResponse = await fetch(
                            `http://localhost:5000/api/reservations/${reservation._id}/payment/verify`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`
                                },
                                body: JSON.stringify(paymentResponse)
                            }
                        );
                        const verifyData = await verifyResponse.json();
                        if (!verifyResponse.ok) {
                            throw new Error(verifyData.message || "Payment verification failed");
                        }

                        setMessage("Payment completed and verified successfully.");
                        await fetchReservations();
                    } catch (verifyError) {
                        setMessage(verifyError.message || "Payment verification failed.");
                    } finally {
                        setPaymentProcessingId(null);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setPaymentProcessingId(null);
                        setMessage("Payment window closed. You can try again.");
                    }
                }
            });

            checkout.on("payment.failed", (event) => {
                setPaymentProcessingId(null);
                setMessage(event.error?.description || "Payment failed. Please try again.");
            });

            try { checkout.open(); } catch (openError) {
                throw new Error(openError.message || "Razorpay checkout could not be opened.");
            }
        } catch (error) {
            setMessage(error.message || "Unable to start payment.");
            setPaymentProcessingId(null);
        }
    };

    const editCalendarDays = useMemo(() => {
        const y = editMonth.getFullYear(); const m = editMonth.getMonth();
        return [...Array.from({ length: new Date(y, m, 1).getDay() }, () => null), ...Array.from({ length: new Date(y, m + 1, 0).getDate() }, (_, i) => i + 1)];
    }, [editMonth]);

    const isEditClosedDate = (day) => {
        if (!day) return true;
        const key = [editMonth.getFullYear(), String(editMonth.getMonth() + 1).padStart(2, "0"), String(day).padStart(2, "0")].join("-");
        const special = editSpecialDays.find((item) => item.date === key);
        if (special) return special.isClosed;
        const weekday = new Date(editMonth.getFullYear(), editMonth.getMonth(), day).toLocaleDateString("en-US", { weekday: "long" });
        const hours = editWeeklyHours.find((item) => item.day === weekday);
        return Boolean(hours && !hours.isOpen);
    };

    const searchEditAvailability = async () => {
        if (!editDate || !editGuests) { setMessage("Choose a date and guest count first."); return; }
        setEditSearching(true); setEditSlots([]); setEditSelectedTime(""); setEditSelectedTable(""); setEditSearched(false);
        try {
            const params = new URLSearchParams({ date: editDate, guests: String(editGuests), excludeReservationId: editingId });
            const response = await fetch("http://localhost:5000/api/tables/available?" + params.toString());
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Unable to check availability");
            setEditSlots(Array.isArray(data.slots) ? data.slots : []); setEditSearched(true);
            if (data.closed) setMessage(data.message || "Restaurant is closed on this date.");
            else if (!data.slots?.length) setMessage("No available times on this date.");
        } catch (error) { setMessage(error.message || "Unable to check availability."); }
        finally { setEditSearching(false); }
    };

    // =========================
    // START MODIFY
    // =========================

    const startModify = (reservation) => {
        const date = new Date(reservation.date);
        setEditingId(reservation._id);
        setEditDate(localDateKey(date));
        setEditMonth(new Date(date.getFullYear(), date.getMonth(), 1));
        setEditGuests(String(reservation.guests));
        setEditSelectedTime(String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0"));
        setEditSelectedTable(String(reservation.table?._id || reservation.table || ""));
        setEditSlots([]); setEditSearched(false); setMessage("");
    };
    // =========================
    // CANCEL EDIT
    // =========================

    const cancelEdit = () => {
        setEditingId(null);
        setEditDate("");
        setEditGuests("");
        setEditSlots([]); setEditSelectedTime(""); setEditSelectedTable(""); setEditSearched(false);
    };

    // =========================
    // MODIFY RESERVATION
    // =========================

    const handleModify = async () => {
        if (!editDate || !editSelectedTime || !editSelectedTable || !editGuests) { setMessage("Select a date, available time, table and guest count."); return; }
        try {
            const response = await fetch("http://localhost:5000/api/reservations/" + editingId, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
                body: JSON.stringify({ date: editDate + "T" + editSelectedTime, table: editSelectedTable, guests: Number(editGuests) })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to update reservation");
            setReservations((current) => current.map((item) => item._id === editingId ? data.reservation : item));
            setMessage(data.message || "Reservation updated successfully"); cancelEdit();
        } catch (error) { setMessage(error.message || "Server connection failed"); }
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

                                {reservation.pricingMode && <p><strong>Pricing:</strong> {reservation.pricingMode === "full_table" ? "Full table" : "Per person"}</p>}
                                {reservation.tablePrice !== undefined && <p><strong>Table price:</strong> ₹{Number(reservation.tablePrice || 0).toLocaleString("en-IN")}</p>}
                                {reservation.bookingFee !== undefined && <p><strong>Total booking amount:</strong> ₹{Number(reservation.bookingFee || 0).toLocaleString("en-IN")}</p>}

                                <p>
                                    <strong>Payment method:</strong>{" "}
                                    {reservation.paymentMethod === "pay_at_restaurant" ? "Pay at restaurant" : "Online payment"}
                                </p>

                                {(reservation.bookingFee > 0 || reservation.paymentMethod === "pay_at_restaurant") && (
                                    <p>
                                        <strong>Payment status:</strong>{" "}
                                        <span className={reservation.paymentStatus === "paid" ? "status status-confirmed" : "status status-pending"}>
                                            {reservation.paymentStatus || "pending"}
                                        </span>
                                    </p>
                                )}

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


                                {reservation.status === "cancelled" && reservation.cancellationMessage && (
                                    <div role="status" style={{ marginTop: "16px", padding: "16px", borderRadius: "10px", background: "#fff1ed", borderLeft: "4px solid #b23b3b" }}>
                                        <strong style={{ color: "#8f2929" }}>Message from the restaurant</strong>
                                        <p style={{ margin: "8px 0 0", color: "#65443b" }}>{reservation.cancellationMessage}</p>
                                    </div>
                                )}

                                {reservation.status === "confirmed" &&
                                    reservation.paymentMethod === "pay_at_restaurant" &&
                                    reservation.paymentStatus !== "paid" && (
                                    <div style={{ marginTop: "16px", padding: "16px", background: "#f2f8f2", borderRadius: "10px", borderLeft: "4px solid #4d8a59" }}>
                                        <strong>Pay at the restaurant</strong>
                                        <p style={{ margin: "7px 0 0" }}>{Number(reservation.bookingFee || 0) > 0 ? `Your booking fee is ₹${Number(reservation.bookingFee).toLocaleString("en-IN")}. Please pay at the restaurant counter when you arrive.` : "You selected to pay the restaurant bill when you arrive. The final bill will be calculated at the restaurant."} The team will update your payment status after receiving payment.</p>
                                    </div>
                                )}

                                {reservation.status === "confirmed" &&
                                    reservation.paymentMethod !== "pay_at_restaurant" &&
                                    Number(reservation.bookingFee || 0) > 0 &&
                                    reservation.paymentStatus !== "paid" && (
                                    <div style={{ marginTop: "16px", padding: "16px", background: "#fff8f0", borderRadius: "10px" }}>
                                        <p style={{ margin: "0 0 10px", color: "#76513a" }}>
                                            Your reservation is confirmed. Complete the booking fee payment of ₹{Number(reservation.bookingFee).toLocaleString("en-IN")}.
                                        </p>
                                        <button
                                            type="button"
                                            className="save-button"
                                            disabled={paymentProcessingId === reservation._id}
                                            onClick={() => handlePayment(reservation)}
                                        >
                                            {paymentProcessingId === reservation._id ? "Opening secure checkout..." : "Pay Booking Fee"}
                                        </button>
                                    </div>
                                )}

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

                                        <label>Choose a new date</label>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 0" }}>
                                            <button type="button" className="edit-cancel-button" onClick={() => setEditMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>‹</button>
                                            <strong>{editMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</strong>
                                            <button type="button" className="edit-cancel-button" onClick={() => setEditMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>›</button>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "5px" }}>
                                            {WEEKDAYS.map((day) => <small key={day} style={{ textAlign: "center" }}>{day}</small>)}
                                            {editCalendarDays.map((day, index) => {
                                                const value = day ? new Date(editMonth.getFullYear(), editMonth.getMonth(), day) : null;
                                                if (value) value.setHours(0, 0, 0, 0);
                                                const today = new Date(); today.setHours(0, 0, 0, 0);
                                                const disabled = !day || value < today || isEditClosedDate(day);
                                                const key = day ? localDateKey(value) : "empty-" + index;
                                                const selected = editDate === key;
                                                return <button key={key} type="button" disabled={disabled} onClick={() => { setEditDate(key); setEditSlots([]); setEditSearched(false); setEditSelectedTime(""); setEditSelectedTable(""); }} style={{ minHeight: "38px", borderRadius: "7px", border: selected ? "2px solid #76513a" : "1px solid #e8dfd6", background: selected ? "#76513a" : disabled ? "#f5f2ef" : "#fff", color: selected ? "#fff" : disabled ? "#bbb" : "#49372b" }}>{day || ""}</button>;
                                            })}
                                        </div>
                                        <label style={{ display: "block", marginTop: "15px" }}>Number of Guests</label>
                                        <input type="number" min="1" max="20" value={editGuests} onChange={(e) => { setEditGuests(e.target.value); setEditSlots([]); setEditSearched(false); setEditSelectedTime(""); setEditSelectedTable(""); }} />
                                        <button type="button" className="save-button" style={{ marginTop: "12px" }} onClick={searchEditAvailability} disabled={editSearching || !editDate}>{editSearching ? "Checking schedule..." : "Show Available Times"}</button>
                                        {editSearched && <div style={{ marginTop: "15px" }}>
                                            <strong>Available times</strong>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "8px", marginTop: "9px" }}>
                                                {editSlots.map((slot) => <button key={slot.time} type="button" disabled={!slot.tables?.length} onClick={() => { setEditSelectedTime(slot.time); setEditSelectedTable(""); }} style={{ padding: "9px 5px", borderRadius: "8px", border: editSelectedTime === slot.time ? "2px solid #76513a" : "1px solid #e5d9ce", background: editSelectedTime === slot.time ? "#76513a" : "#fff", color: editSelectedTime === slot.time ? "#fff" : "#49372b" }}>{formatTime(slot.time)}<small style={{ display: "block" }}>{slot.tables?.length || "No"} table(s)</small></button>)}
                                            </div>
                                        </div>}
                                        {editSelectedTime && <div style={{ marginTop: "15px" }}>
                                            <strong>Available tables at {formatTime(editSelectedTime)}</strong>
                                            <div style={{ display: "grid", gap: "8px", marginTop: "9px" }}>
                                                {(editSlots.find((slot) => slot.time === editSelectedTime)?.tables || []).map((table) => <button key={table._id} type="button" onClick={() => setEditSelectedTable(table._id)} style={{ textAlign: "left", padding: "10px", borderRadius: "8px", border: editSelectedTable === table._id ? "2px solid #76513a" : "1px solid #e5d9ce", background: editSelectedTable === table._id ? "#fff8f0" : "#fff" }}>Table {table.tableNumber} · {table.category} · Capacity {table.capacity}</button>)}
                                            </div>
                                        </div>}
                                        <button className="save-button" style={{ marginTop: "15px" }} onClick={handleModify} disabled={!editSelectedTable || !editSelectedTime}>Save Changes</button>

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