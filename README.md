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

### Administrator Features
- Administrator login and role-based access
- Admin dashboard
- Add, view, update, and delete restaurant tables
- View customer reservations
- Confirm or cancel reservations
- Delete cancelled reservations
- Review booking modifications that require approval

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
│   ├── createAdmin.js
│   ├── server.js
│   ├── package.json
│   └── .gitignore
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    └── .gitignore
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
```

Do not commit the actual `.env` file or share your secrets publicly.

### 3. Start the backend

From the `backend` directory, run the start command defined in `backend/package.json`. For a typical Node.js setup, this may be:

```bash
npm start
```

If the project uses a development script instead, run:

```bash
npm run dev
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

The backend provides REST APIs for user authentication, table management, and reservation management.

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

Protected endpoints require a valid JWT bearer token. Administrative endpoints additionally require administrator privileges.

## Testing

The APIs can be tested using Postman. Test cases should cover registration, login, table availability, reservation creation, modification, cancellation, administrator approval, and table management.

## Future Scope

- Email or SMS reservation notifications
- Online payment integration
- Reservation analytics and reporting
- Improved availability checks for overlapping reservation times
- Enhanced accessibility and mobile responsiveness
- Deployment to a cloud hosting platform

## Repository

GitHub: https://github.com/DEvIL-coderr/restaurant-reservation-system

---

Developed as a Project-Based Learning project at Brainware University.