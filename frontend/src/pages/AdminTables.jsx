import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AdminTables() {
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const [tableNumber, setTableNumber] = useState("");
    const [capacity, setCapacity] = useState("");
    const [category, setCategory] = useState("Indoor");
    const [status, setStatus] = useState("available");

    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
    try {
        const response = await fetch(
            "http://localhost:5000/api/tables",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        console.log("Tables API response:", data);

        if (response.ok) {

            const tableList = Array.isArray(data)
                ? data
                : Array.isArray(data.tables)
                ? data.tables
                : [];

            setTables(tableList);

        } else {
            setMessage(
                data.message || "Failed to load tables"
            );
        }

    } catch (error) {
        console.error(error);
        setMessage("Server connection failed");

    } finally {
        setLoading(false);
    }
};

    const resetForm = () => {
        setTableNumber("");
        setCapacity("");
        setCategory("Indoor");
        setStatus("available");
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");

        const tableData = {
            tableNumber: Number(tableNumber),
            capacity: Number(capacity),
            category,
            status
        };

        try {
            const url = editingId
                ? `http://localhost:5000/api/tables/${editingId}`
                : "http://localhost:5000/api/tables";

            const method = editingId ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(tableData)
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(
                    editingId
                        ? "Table updated successfully"
                        : "Table added successfully"
                );

                resetForm();
                fetchTables();
            } else {
                setMessage(
                    data.message || "Operation failed"
                );
            }
        } catch (error) {
            console.error(error);
            setMessage("Server connection failed");
        }
    };

    const handleEdit = (table) => {
        setEditingId(table._id);
        setTableNumber(table.tableNumber);
        setCapacity(table.capacity);
        setCategory(table.category);
        setStatus(table.status);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this table?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:5000/api/tables/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setMessage("Table deleted successfully");
                fetchTables();
            } else {
                setMessage(
                    data.message || "Failed to delete table"
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
                                Table Management
                            </h1>

                            <p className="admin-subtitle">
                                Add and manage restaurant tables.
                            </p>
                        </div>

                        <div className="booking-count">

                            <span>
                                Total Tables
                            </span>

                            <strong>
                                {tables.length}
                            </strong>

                        </div>

                    </div>

                    {message && (
                        <div className="admin-message">
                            {message}
                        </div>
                    )}

                    <div className="admin-form-card">

                        <div className="form-card-header">

                            <div>
                                <span className="booking-label">
                                    TABLE MANAGEMENT
                                </span>

                                <h2>
                                    {editingId
                                        ? "Edit Table"
                                        : "Add New Table"}
                                </h2>
                            </div>

                        </div>

                        <form onSubmit={handleSubmit}>

                            <div className="admin-form-grid">

                                <div>
                                    <label>
                                        Table Number
                                    </label>

                                    <input
                                        type="number"
                                        min="1"
                                        value={tableNumber}
                                        onChange={(e) =>
                                            setTableNumber(
                                                e.target.value
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div>
                                    <label>
                                        Capacity
                                    </label>

                                    <input
                                        type="number"
                                        min="1"
                                        value={capacity}
                                        onChange={(e) =>
                                            setCapacity(
                                                e.target.value
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div>
                                    <label>
                                        Category
                                    </label>

                                    <select
                                        value={category}
                                        onChange={(e) =>
                                            setCategory(
                                                e.target.value
                                            )
                                        }
                                    >
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
                                </div>

                                <div>
                                    <label>
                                        Status
                                    </label>

                                    <select
                                        value={status}
                                        onChange={(e) =>
                                            setStatus(
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="available">
                                            Available
                                        </option>

                                        <option value="booked">
                                            Booked
                                        </option>
                                    </select>
                                </div>

                            </div>

                            <div className="admin-form-actions">

                                <button
                                    type="submit"
                                    className="save-button"
                                >
                                    {editingId
                                        ? "Update Table"
                                        : "Add Table"}
                                </button>

                                {editingId && (
                                    <button
                                        type="button"
                                        className="edit-cancel-button"
                                        onClick={resetForm}
                                    >
                                        Cancel Edit
                                    </button>
                                )}

                            </div>

                        </form>

                    </div>

                    <section className="admin-table-section">

                        <div className="section-header">

                            <div>
                                <span className="booking-label">
                                    TABLE INVENTORY
                                </span>

                                <h2>
                                    All Tables
                                </h2>
                            </div>

                            <span className="table-count">
                                {tables.length} tables
                            </span>

                        </div>

                        {loading ? (

                            <div className="admin-loading">
                                Loading tables...
                            </div>

                        ) : tables.length === 0 ? (

                            <div className="no-tables">

                                <h3>
                                    No Tables Found
                                </h3>

                                <p>
                                    Add your first restaurant
                                    table using the form above.
                                </p>

                            </div>

                        ) : (

                            <div className="admin-table-list">

                                {tables.map((table) => (

                                    <div
                                        className="admin-table-card"
                                        key={table._id}
                                    >

                                        <div className="table-card-main">

                                            <div className="table-number-box">
                                                <span>
                                                    TABLE
                                                </span>

                                                <strong>
                                                    {table.tableNumber}
                                                </strong>
                                            </div>

                                            <div className="table-info">

                                                <h3>
                                                    Table{" "}
                                                    {table.tableNumber}
                                                </h3>

                                                <div className="table-meta">

                                                    <span>
                                                        👥{" "}
                                                        {table.capacity} guests
                                                    </span>

                                                    <span>
                                                        📍{" "}
                                                        {table.category}
                                                    </span>

                                                </div>

                                            </div>

                                            <span
                                                className={
                                                    table.status ===
                                                    "available"
                                                        ? "status-confirmed"
                                                        : "status-pending"
                                                }
                                            >
                                                {table.status}
                                            </span>

                                        </div>

                                        <div className="admin-table-actions">

                                            <button
                                                className="modify-button"
                                                onClick={() =>
                                                    handleEdit(table)
                                                }
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="cancel-button"
                                                onClick={() =>
                                                    handleDelete(
                                                        table._id
                                                    )
                                                }
                                            >
                                                Delete
                                            </button>

                                        </div>

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

export default AdminTables;