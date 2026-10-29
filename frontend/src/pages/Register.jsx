import { useState } from "react";
import { Link } from "react-router-dom";

function Register() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        phone: ""
    });

    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(
                "http://localhost:5000/api/users/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(form)
                }
            );

            const data = await response.json();
            setMessage(data.message);

        } catch (error) {
            setMessage("Server connection failed");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">

                <h1>Create Account</h1>

                <p className="auth-subtitle">
                    Create your restaurant account
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>

                    <input
                        name="name"
                        placeholder="Full Name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />

                    <input
                        name="email"
                        type="email"
                        placeholder="Email Address"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />

                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />

                    <input
                        name="phone"
                        placeholder="Phone Number"
                        value={form.phone}
                        onChange={handleChange}
                    />

                    <button type="submit">
                        Create Account
                    </button>

                </form>

                {message && (
                    <p className="auth-message">
                        {message}
                    </p>
                )}

                <p className="auth-switch">
                    Already have an account?{" "}
                    <Link to="/login">Login</Link>
                </p>

            </div>
        </div>
    );
}

export default Register;