# Restaurant Reservation & Booking System

A web-based application that allows customers to view table availability, make restaurant reservations, and manage their bookings. It also provides an administrator interface to manage restaurant tables and customer reservations.

## Project Information

- **Project Title:** Restaurant Reservation & Booking System
- **Project Type:** Project-Based Learning (PBL)
- **Supervisor:** Mr. Sourish Dutta
- **Institution:** Brainware University
- **Team Size:** 4 Members

## Features

### Customer Features
- Customer registration and login
- Secure password handling and token-based authentication
- Customer profile management
- Search for available tables by date, time, guest count, and category
- Create restaurant reservations
- View personal booking history
- Modify or cancel reservations
- Modified confirmed reservations return to pending status for administrator approval
- Email notifications for new bookings, customer cancellations, and admin booking confirmations/cancellations
- Automatic email reminders approximately 24 hours before confirmed reservations

### Administrator Features
- Administrator login and role-based access
- Admin dashboard
- Add, view, update, and delete restaurant tables
- View customer reservations
- Confirm or cancel reservations
- Delete cancelled reservations
- Review booking modifications that require approval
- Analytics dashboard with reservation totals, status summaries, upcoming reservations, customer/table counts, and six-month/seven-day booking trends

## Technologies Used

### Frontend
- React.js
- Vite
- JavaScript
- HTML5
- CSS3

### Backend
- Node.js
- Express.js
- REST API architecture
- JSON Web Token (JWT) authentication
- bcryptjs for password hashing
- Nodemailer for SMTP email notifications

### Database
- MongoDB
- Mongoose

### Development and Testing Tools
- Visual Studio Code
- Postman
- Git and GitHub

## Project Structure

```text
restaurant/
├── API.txt
├── README.md
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   │   ├── sendEmail.js
│   │   └── reminderScheduler.js
│   ├── createAdmin.js
│   ├── server.js
│   ├── package.json
│   └── .gitignore
└── frontend/
    ├── public/
    ├── src/
    ├── App.jsx
    ├── main.jsx
    └── index.css
```

## System Requirements

- Node.js and npm
- MongoDB local installation or a MongoDB Atlas database
- Visual Studio Code or another code editor
- A modern web browser
- Postman (optional, for API testing)

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/DEvIL-coderr/restaurant-reservation-system.git
cd restaurant-reservation-system
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder. Add your own configuration values:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret

# Email notifications (example: Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_character_gmail_app_password
EMAIL_FROM="Restaurant Reservations <your_email@gmail.com>"
ADMIN_EMAIL=admin_email@example.com
```

Do not commit the actual `.env` file or share your secrets publicly.

Email notifications use Nodemailer and SMTP. For Gmail, enable 2-Step Verification on your Google account and create a Google **App Password**. Use that 16-character App Password as `SMTP_PASS` (not your normal Gmail password). Set `ADMIN_EMAIL` to the address that should receive new-booking alerts. If SMTP settings are missing or the mail provider is unavailable, reservations will still be saved; the backend logs the email issue.

The backend also checks for upcoming **confirmed** reservations every 60 seconds. When a reservation is within the next 24 hours and its reminder has not been sent, the customer receives one reminder email. The reminder is marked as sent only after the SMTP helper reports a successful send. The scheduler runs while the backend server is running; it does not send reminders while the server is stopped.

### 3. Start the backend

From the `backend` directory, run:

```bash
npm install
npm run dev
```

For production, use:

```bash
npm start
```

The API is expected to run at:

```text
http://localhost:5000
```

### 4. Configure and start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, typically:

```text
http://localhost:5173
```

Ensure the frontend API requests point to the running backend.

## API Overview

The backend provides REST APIs for user authentication, table management, reservation management, and administrator analytics.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Check API status |
| POST | `/api/users/register` | Register a customer |
| POST | `/api/users/login` | Authenticate a user |
| GET | `/api/users/profile` | Retrieve the authenticated profile |
| GET | `/api/tables/available` | Search available tables |
| GET | `/api/tables` | View tables (admin) |
| POST | `/api/tables` | Add a table (admin) |
| PUT | `/api/tables/:id` | Update a table (admin) |
| DELETE | `/api/tables/:id` | Delete a table (admin) |
| POST | `/api/reservations` | Create a reservation |
| GET | `/api/reservations` | View the customer's reservations |
| PUT | `/api/reservations/:id` | Modify a reservation |
| PUT | `/api/reservations/:id/cancel` | Cancel a reservation |
| GET | `/api/reservations/all` | View all reservations (admin) |
| PUT | `/api/reservations/admin/:id` | Update a reservation (admin) |
| DELETE | `/api/reservations/admin/:id` | Delete a cancelled reservation (admin) |
| GET | `/api/analytics/admin` | Retrieve admin analytics and reservation trends |

Protected endpoints require a valid JWT bearer token. Administrative endpoints additionally require administrator privileges.

## Testing

The APIs can be tested using Postman. Test cases should cover registration, login, table availability, reservation creation, modification, cancellation, administrator approval, table management, analytics access, and reminder emails. To test a 24-hour reminder without waiting a full day, create a confirmed test reservation for a time within the next 24 hours. The scheduler will send the reminder on its next check (within about 60 seconds). Delete or cancel the test reservation afterward if needed.

For analytics, sign in with an administrator account and open **Admin Dashboard → Analytics & Reports**. The page should show summary cards and reservation trends. The analytics API is protected and should reject non-admin accounts.

## Future Scope

- Online payment integration
- Enhanced accessibility and mobile responsiveness
- Deployment to a cloud hosting platform

## Repository

GitHub: https://github.com/DEvIL-coderr/restaurant-reservation-system

---

Developed as a Project-Based Learning project at Brainware University.
