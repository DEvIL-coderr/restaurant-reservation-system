import { Link } from "react-router-dom";

function Home() {
    const token = localStorage.getItem("token");
    let isLoggedIn = false;

    try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        const payload = token ? JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) : null;
        isLoggedIn = Boolean(token && user && payload && (!payload.exp || payload.exp * 1000 > Date.now()));
    } catch {
        isLoggedIn = false;
    }

    return (
        <div className="page">

            <header className="navbar">

                <div className="logo">
                    Restaurant
                </div>

                <nav className="nav-links">
                    <Link to="/">Home</Link>

                    {isLoggedIn ? (
    <>
        <Link to="/reservation">Reserve</Link>
        <Link to="/reservations">My Bookings</Link>
        <Link to="/profile">Profile</Link>

        <button
            className="logout-button"
            onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
            }}
        >
            Logout
        </button>
    </>
) : (
    <>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
    </>
)}
                </nav>

            </header>

            <main className="home">

                <div className="home-content">

                    <p className="home-tagline">
                        GOOD FOOD • GOOD TIMES • GOOD COMPANY
                    </p>

                    <h1>
                        Your Table<br />
                        Is Waiting.
                    </h1>

                    <p>
                        Reserve your table quickly and enjoy
                        a comfortable dining experience at our restaurant.
                    </p>

                    <div className="home-buttons">

                        {isLoggedIn ? (
                            <>
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
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="primary-button"
                            >
                                Get Started
                            </Link>
                        )}

                    </div>

                </div>

            </main>

        </div>
    );
}

export default Home;