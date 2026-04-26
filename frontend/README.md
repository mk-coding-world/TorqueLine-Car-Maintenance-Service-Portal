# ServiceTrack Pro

ServiceTrack Pro is a full-stack service center management system inspired by official brand service workflows.

It includes:

- Customer registration and login
- My Cars dashboard
- Service booking
- Live service status tracker
- Service details and billing
- Car health score
- Service history
- Admin garage panel for operations

## Tech Stack

- Frontend: React (Create React App)
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: JWT + bcrypt

## Features Implemented

### 1. Customer Login System

- Register and login flows
- JWT-based protected routes
- Each customer can only access their own cars and bookings

### 2. My Cars Dashboard

- Add car with model, number, year, mileage
- View all owned cars

### 3. Service Booking

- Select a registered car
- Choose service type: General Service, Oil Change, Battery Service, Alignment & balancing, Engine Repair, Brake Service, AC Service, Electrical Service, Full Inspection
- Book appointment date

### 4. Live Service Status Tracker

Status stages:

- Pending
- In Inspection
- Under Repair
- Completed

Displays:

- Car number
- Current status
- Mechanic name
- Estimated completion text

### 5. Service Details and Billing

- Issues list
- Parts changed and cost
- Labor cost
- Total bill

### 6. Car Health Score

Scoring bands:

- 90-100: Excellent
- 70-89: Good
- 50-69: Needs Service
- <50: Critical

Score is calculated from:

- Time since last service
- Number of service issues
- Car mileage

### 7. Service History

- Completed service entries by car
- Date, type, cost, notes

### 8. Admin Panel (Garage Side)

Admin can:

- View all bookings
- Update live status, mechanic, ETA
- Add issues and repair details
- Add parts and labor cost
- Auto-generate total bill

## Project Structure

```text
service_track/
	server/
		middleware/
		models/
		routes/
		utils/
		db.js
		server.js
	src/
		App.js
		App.css
```

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
copy .env.example .env
```

3. Update `.env` values if needed:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/service_track
JWT_SECRET=change_this_secret
ADMIN_EMAIL=admin@service-track.com
ADMIN_PASSWORD=Admin@123
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start frontend and backend together:

```bash
npm run dev
```

5. Open app:

- Frontend: http://localhost:3000
- Backend health check: http://localhost:5000/api/health

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Customer

- `GET /api/customer/cars`
- `POST /api/customer/cars`
- `POST /api/customer/bookings`
- `GET /api/customer/bookings`
- `GET /api/customer/history/:carId`

### Admin

- `GET /api/admin/bookings`
- `PATCH /api/admin/bookings/:id/status`
- `PATCH /api/admin/bookings/:id/details`

## Default Admin Credentials

When server starts first time, a default admin is auto-created:

- Email: `admin@service-track.com`
- Password: `Admin@123`

Change these values in `.env` for production usage.
