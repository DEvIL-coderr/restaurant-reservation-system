import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api";

const todayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

function AdminSpecialDays() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [date, setDate] = useState(todayKey());
    const [isClosed, setIsClosed] = useState(true);
    const [openTime, setOpenTime] = useState("09:00");
    const [closeTime, setCloseTime] = useState("22:00");
    const [note, setNote] = useState("");
    const [specialDays, setSpecialDays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const loadSpecialDays = async () => {
        try {
            const response = await fetch(`${API}/special-days`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Unable to load special dates");
            setSpecialDays(data.specialDays || []);
        } catch (error) {
            setMessage(error.message || "Server connection failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        loadSpecialDays();
    }, [token, navigate]);

    const saveSpecialDay = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage("");
        try {
            const response = await fetch(`${API}/special-days`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ date, isClosed, openTime, closeTime, note })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Unable to save special date");
            setMessage(data.message || "Special date saved successfully");
            setNote("");
            await loadSpecialDays();
        } catch (error) {
            setMessage(error.message || "Server connection failed");
        } finally {
            setSaving(false);
        }
    };

    const removeSpecialDay = async (id) => {
        if (!window.confirm("Remove this special date? The normal weekly opening hours will apply again.")) return;
        setMessage("");
        try {
            const response = await fetch(`${API}/special-days/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Unable to remove special date");
            setMessage(data.message || "Special date removed");
            await loadSpecialDays();
        } catch (error) {
            setMessage(error.message || "Server connection failed");
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const fieldStyle = {
        width: "100%",
        padding: "11px 12px",
        border: "1px solid #d8cfc5",
        borderRadius: "8px",
        fontSize: "15px",
        boxSizing: "border-box"
    };

    if (!token) return null;

    return (
        <div className="page">
            <header className="navbar">
                <div className="logo">Restaurant Admin</div>
                <nav className="nav-links">
                    <Link to="/admin">Dashboard</Link>
                    <Link to="/admin/tables">Tables</Link>
                    <Link to="/admin/bookings">Bookings</Link>
                    <Link to="/admin/settings">Settings</Link>
                    <Link to="/admin/special-days">Special Days</Link>
                    <button className="logout-button" onClick={logout}>Logout</button>
                </nav>
            </header>

            <main className="admin-page">
                <div className="admin-container">
                    <p className="home-tagline">HOLIDAYS & EXCEPTIONS</p>
                    <h1>Special Days & Holidays</h1>
                    <p className="admin-subtitle">
                        Set one-time closures or different opening hours for festivals, holidays and private events.
                        These settings override your normal weekly schedule for the selected date.
                    </p>

                    {message && <div className="admin-message" role="status">{message}</div>}

                    <form onSubmit={saveSpecialDay} style={{ background: "#fff", padding: "24px", borderRadius: "14px", boxShadow: "0 4px 18px rgba(0,0,0,.05)", display: "grid", gap: "18px" }}>
                        <h2 style={{ margin: 0 }}>Add or update a special date</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "16px" }}>
                            <label style={{ display: "grid", gap: "7px", fontWeight: 600 }}>
                                Date
                                <input style={fieldStyle} type="date" min={todayKey()} value={date} onChange={(event) => setDate(event.target.value)} required />
                            </label>
                            <label style={{ display: "grid", gap: "7px", fontWeight: 600 }}>
                                Restaurant status
                                <select style={fieldStyle} value={isClosed ? "closed" : "open"} onChange={(event) => setIsClosed(event.target.value === "closed")}>
                                    <option value="closed">Closed for the whole day</option>
                                    <option value="open">Open with special hours</option>
                                </select>
                            </label>
                            <label style={{ display: "grid", gap: "7px", fontWeight: 600 }}>
                                Reason / event name (optional)
                                <input style={fieldStyle} type="text" maxLength="120" placeholder="Example: Diwali, private event" value={note} onChange={(event) => setNote(event.target.value)} />
                            </label>
                            {!isClosed && (
                                <>
                                    <label style={{ display: "grid", gap: "7px", fontWeight: 600 }}>
                                        Opening time
                                        <input style={fieldStyle} type="time" value={openTime} onChange={(event) => setOpenTime(event.target.value)} required />
                                    </label>
                                    <label style={{ display: "grid", gap: "7px", fontWeight: 600 }}>
                                        Closing time
                                        <input style={fieldStyle} type="time" value={closeTime} onChange={(event) => setCloseTime(event.target.value)} required />
                                    </label>
                                </>
                            )}
                        </div>
                        <div>
                            <button className="save-button" type="submit" disabled={saving}>
                                {saving ? "Saving..." : "Save Special Date"}
                            </button>
                        </div>
                        <small style={{ color: "#76695f" }}>
                            Saving a date that already exists will update its settings. Remove it to restore the regular weekly hours.
                        </small>
                    </form>

                    <section style={{ marginTop: "28px", background: "#fff", padding: "24px", borderRadius: "14px", boxShadow: "0 4px 18px rgba(0,0,0,.05)" }}>
                        <h2 style={{ marginTop: 0 }}>Upcoming special dates</h2>
                        {loading ? <p>Loading special dates...</p> : specialDays.length === 0 ? (
                            <p style={{ color: "#76695f" }}>No special dates have been added. Your weekly opening hours will apply.</p>
                        ) : (
                            <div style={{ display: "grid", gap: "12px" }}>
                                {specialDays.map((item) => (
                                    <div key={item._id} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "14px", background: "#faf8f5", borderRadius: "9px" }}>
                                        <div>
                                            <strong>{new Date(`${item.date}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", weekday: "long" })}</strong>
                                            <p style={{ margin: "5px 0 0", color: "#76695f" }}>
                                                {item.note || "Special schedule"} · {item.isClosed ? "Closed all day" : `Open ${item.openTime}–${item.closeTime}`}
                                            </p>
                                        </div>
                                        <button type="button" className="logout-button" onClick={() => removeSpecialDay(item._id)}>Remove</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}

export default AdminSpecialDays;
