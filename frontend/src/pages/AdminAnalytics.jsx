import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const StatCard = ({ label, value, detail }) => (
    <div className="admin-card" style={{ cursor: "default" }}>
        <p style={{ color: "#777", margin: "0 0 8px" }}>{label}</p>
        <h2 style={{ fontSize: "2rem", margin: "0 0 6px" }}>{value ?? 0}</h2>
        <p style={{ color: "#888", margin: 0, fontSize: "0.9rem" }}>{detail}</p>
    </div>
);

const BarChart = ({ title, items }) => {
    const max = Math.max(...items.map((item) => item.count), 1);

    return (
        <section className="admin-card" style={{ cursor: "default", minWidth: 0 }}>
            <h2 style={{ marginTop: 0 }}>{title}</h2>
            <div style={{ display: "flex", alignItems: "end", gap: "12px", height: "190px", paddingTop: "16px" }}>
                {items.map((item) => (
                    <div key={item.date || item.label} style={{ flex: 1, minWidth: 0, textAlign: "center", height: "100%", display: "flex", flexDirection: "column", justifyContent: "end", alignItems: "center", gap: "7px" }}>
                        <strong style={{ fontSize: "0.85rem" }}>{item.count}</strong>
                        <div
                            title={`${item.count} reservations`}
                            style={{
                                width: "100%",
                                maxWidth: "42px",
                                height: `${Math.max((item.count / max) * 125, 4)}px`,
                                background: "linear-gradient(180deg, #e3a14b, #bd6c2c)",
                                borderRadius: "7px 7px 2px 2px"
                            }}
                        />
                        <span style={{ fontSize: "0.8rem", color: "#777" }}>{item.label}</span>
                    </div>
                ))}
            </div>
        </section>
    );
};

function AdminAnalytics() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/analytics/admin", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to load analytics");
                }

                setAnalytics(data);
            } catch (err) {
                setError(err.message || "Server connection failed");
            } finally {
                setLoading(false);
            }
        };

        if (!token) {
            navigate("/login");
        } else {
            fetchAnalytics();
        }
    }, [navigate, token]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const summary = analytics?.summary;

    return (
        <div className="page">
            <header className="navbar">
                <div className="logo">Restaurant Admin</div>
                <nav className="nav-links">
                    <Link to="/admin">Dashboard</Link>
                    <Link to="/admin/tables">Tables</Link>
                    <Link to="/admin/bookings">Bookings</Link>
                    <button className="logout-button" onClick={handleLogout}>Logout</button>
                </nav>
            </header>

            <main className="admin-page">
                <div className="admin-container">
                    <div className="admin-page-header">
                        <div>
                            <p className="home-tagline">RESTAURANT MANAGEMENT</p>
                            <h1>Analytics & Reports</h1>
                            <p className="admin-subtitle">Track reservation activity and restaurant usage.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="admin-loading">Loading analytics...</div>
                    ) : error ? (
                        <div className="admin-message">{error}</div>
                    ) : (
                        <>
                            <div className="admin-cards">
                                <StatCard label="Total Reservations" value={summary.totalReservations} detail="All reservations recorded" />
                                <StatCard label="Pending" value={summary.pendingReservations} detail="Awaiting admin action" />
                                <StatCard label="Confirmed" value={summary.confirmedReservations} detail="Approved reservations" />
                                <StatCard label="Cancelled" value={summary.cancelledReservations} detail="Cancelled reservations" />
                                <StatCard label="Upcoming" value={summary.upcomingReservations} detail="Future pending or confirmed" />
                                <StatCard label="Customers" value={summary.totalCustomers} detail="Registered customer accounts" />
                                <StatCard label="Restaurant Tables" value={summary.totalTables} detail="Tables currently in the system" />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginTop: "24px" }}>
                                <BarChart title="Reservations by Month (Last 6 Months)" items={analytics.monthlyData} />
                                <BarChart title="Reservations by Day (Last 7 Days)" items={analytics.dailyData} />
                            </div>

                            <p style={{ color: "#777", fontSize: "0.85rem", marginTop: "16px" }}>
                                Charts are based on reservation creation dates. Cancelled reservations are included in total activity.
                            </p>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

export default AdminAnalytics;
