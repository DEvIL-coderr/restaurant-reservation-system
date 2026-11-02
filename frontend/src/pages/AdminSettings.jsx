import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_HOURS = DAYS.map((day) => ({
    day,
    isOpen: true,
    openTime: day === "Sunday" ? "10:00" : "09:00",
    closeTime: ["Friday", "Saturday"].includes(day) ? "23:00" : "22:00"
}));

const styles = {
    field: { display: "flex", flexDirection: "column", gap: "7px" },
    input: { width: "100%", padding: "11px 12px", border: "1px solid #d8cfc5", borderRadius: "8px", fontSize: "15px", boxSizing: "border-box" },
    label: { fontWeight: 600, color: "#49372b" }
};

function AdminSettings() {
    const navigate = useNavigate();
    const [duration, setDuration] = useState(120);
    const [buffer, setBuffer] = useState(15);
    const [interval, setInterval] = useState(30);
    const [bookingFee, setBookingFee] = useState(0);
    const [hours, setHours] = useState(DEFAULT_HOURS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        const loadSettings = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/settings");
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Could not load settings");

                if (data.settings) {
                    setDuration(data.settings.reservationDurationMinutes ?? 120);
                    setBuffer(data.settings.bufferMinutes ?? 15);
                    setInterval(data.settings.slotIntervalMinutes ?? 30);
                    setBookingFee(data.settings.bookingFee ?? 0);
                    if (data.settings.weeklyHours?.length === 7) {
                        const byDay = new Map(data.settings.weeklyHours.map((item) => [item.day, item]));
                        setHours(DAYS.map((day) => byDay.get(day) || DEFAULT_HOURS.find((item) => item.day === day)));
                    }
                }
            } catch (error) {
                setMessage(error.message || "Server connection failed");
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [token, navigate]);

    const updateDay = (day, changes) => {
        setHours((current) => current.map((item) =>
            item.day === day ? { ...item, ...changes } : item
        ));
    };

    const saveSettings = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage("");

        try {
            const response = await fetch("http://localhost:5000/api/settings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    reservationDurationMinutes: Number(duration),
                    bufferMinutes: Number(buffer),
                    slotIntervalMinutes: Number(interval),
                    bookingFee: Number(bookingFee),
                    weeklyHours: hours
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Could not save settings");
            setMessage("Restaurant settings saved successfully.");
        } catch (error) {
            setMessage(error.message || "Server connection failed");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <div className="page">
            <header className="navbar">
                <div className="logo">Restaurant Admin</div>
                <nav className="nav-links">
                    <Link to="/admin">Dashboard</Link>
                    <Link to="/admin/tables">Tables</Link>
                    <Link to="/admin/bookings">Bookings</Link>
                    <Link to="/admin/settings">Settings</Link>
                    <button className="logout-button" onClick={handleLogout}>Logout</button>
                </nav>
            </header>

            <main className="admin-page">
                <div className="admin-container">
                    <p className="home-tagline">RESTAURANT CONFIGURATION</p>
                    <h1>Reservation Settings</h1>
                    <p className="admin-subtitle">Choose how long each reservation occupies a table and set your weekly opening hours.</p>

                    {message && <div className="admin-message" role="status">{message}</div>}
                    {loading ? <div className="admin-loading">Loading settings...</div> : (
                        <form onSubmit={saveSettings} style={{ display: "grid", gap: "24px" }}>
                            <section style={{ background: "#fff", padding: "24px", borderRadius: "14px", boxShadow: "0 4px 18px rgba(0,0,0,.05)" }}>
                                <h2>Booking time rules</h2>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "18px", marginTop: "18px" }}>
                                    <div style={styles.field}>
                                        <label style={styles.label} htmlFor="duration">Reservation duration (minutes)</label>
                                        <input id="duration" style={styles.input} type="number" min="30" max="360" step="15" value={duration} onChange={(e) => setDuration(e.target.value)} required />
                                        <small>How long a table is reserved. 120 minutes = 2 hours.</small>
                                    </div>
                                    <div style={styles.field}>
                                        <label style={styles.label} htmlFor="buffer">Buffer time (minutes)</label>
                                        <input id="buffer" style={styles.input} type="number" min="0" max="120" step="5" value={buffer} onChange={(e) => setBuffer(e.target.value)} required />
                                        <small>Cleaning/preparation time after a reservation.</small>
                                    </div>
                                    <div style={styles.field}>
                                        <label style={styles.label} htmlFor="interval">Booking slot interval (minutes)</label>
                                        <input id="interval" style={styles.input} type="number" min="15" max="120" step="15" value={interval} onChange={(e) => setInterval(e.target.value)} required />
                                        <small>How frequently customers can choose a start time.</small>
                                    </div>
                                </div>
                                <p style={{ marginTop: "18px", color: "#765c49" }}>
                                    Example: a 7:00 PM booking with a 2-hour duration and 15-minute buffer blocks the table until 9:15 PM.
                                </p>
                            </section>

                            <section style={{ background: "#fff", padding: "24px", borderRadius: "14px", boxShadow: "0 4px 18px rgba(0,0,0,.05)" }}>
                                <h2>Customer booking fee</h2>
                                <p style={{ color: "#76695f" }}>Set a fixed fee in Indian Rupees for each new reservation. Existing reservations keep the fee saved when they were created.</p>
                                <div style={{ ...styles.field, maxWidth: "320px", marginTop: "16px" }}>
                                    <label style={styles.label} htmlFor="bookingFee">Booking fee (₹ per reservation)</label>
                                    <input id="bookingFee" style={styles.input} type="number" min="0" max="100000" step="1" value={bookingFee} onChange={(e) => setBookingFee(e.target.value)} required />
                                </div>
                            </section>

                            <section style={{ background: "#fff", padding: "24px", borderRadius: "14px", boxShadow: "0 4px 18px rgba(0,0,0,.05)" }}>
                                <h2>Weekly opening hours</h2>
                                <p style={{ color: "#76695f" }}>Turn off days when the restaurant is closed. Opening and closing times use 24-hour format.</p>
                                <div style={{ display: "grid", gap: "12px", marginTop: "18px" }}>
                                    {hours.map((item) => (
                                        <div key={item.day} style={{ display: "grid", gridTemplateColumns: "minmax(110px, 1fr) minmax(90px, .7fr) minmax(120px, 1fr) minmax(120px, 1fr)", gap: "12px", alignItems: "center", padding: "12px", background: "#faf8f5", borderRadius: "9px" }}>
                                            <strong>{item.day}</strong>
                                            <label style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                                <input type="checkbox" checked={item.isOpen} onChange={(e) => updateDay(item.day, { isOpen: e.target.checked })} />
                                                {item.isOpen ? "Open" : "Closed"}
                                            </label>
                                            <input aria-label={item.day + " opening time"} style={styles.input} type="time" value={item.openTime} disabled={!item.isOpen} onChange={(e) => updateDay(item.day, { openTime: e.target.value })} />
                                            <input aria-label={item.day + " closing time"} style={styles.input} type="time" value={item.closeTime} disabled={!item.isOpen} onChange={(e) => updateDay(item.day, { closeTime: e.target.value })} />
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <div>
                                <button className="save-button" type="submit" disabled={saving}>
                                    {saving ? "Saving..." : "Save Restaurant Settings"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}

export default AdminSettings;
