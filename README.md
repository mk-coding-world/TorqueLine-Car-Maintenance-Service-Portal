# TorqueLine-Car-Maintenance-Service-Portal

## 🔧 Service Booking Backend API

A Node.js-based backend system for managing **vehicle service bookings**, including authentication, customer operations, and admin workflows.

---

## 📌 Project Overview

This backend provides a complete system for:

* 🔐 **User Authentication & Authorization**
* 📅 **Service Booking Management**
* 🛠️ **Admin Control Panel Operations**
* 💵 **Billing & Service Tracking**

---

## ⚙️ Tech Stack

* ⚡ **Node.js & Express.js**
* 🗄️ **MongoDB (Mongoose)**
* 🔑 **JWT (jsonwebtoken)**
* 🔒 **bcryptjs**
* 🌐 **cors**
* 🧪 **dotenv**

---

## ✨ Features

### 👤 Authentication

* User registration with hashed passwords
* Secure login system
* JWT token generation (7-day expiry)
* Protected routes

### 🚗 Customer Features

* Book vehicle services
* View booking details
* Track service status

### 🛠️ Admin Features

* View all bookings
* Update booking status
* Assign mechanics
* Add service details (issues, parts, labor)
* Generate final billing

---
## 📁 Project Structure

```bash
FET_PROJECT/
│
├── frontend/                  # React Frontend
│   ├── build/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   └── README.md
│
├── server/                    # Backend (Node.js + Express)
│   ├── middleware/
│   ├── models/
│   ├── node_modules/
│   ├── routes/
│   ├── utils/
│   ├── .env
│   ├── db.js
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── package.json              # Root config (optional)
└── package-lock.json
```

---


## 🔄 API Flow

1. **Register** – User signs up with details
2. **Login** – JWT token is generated
3. **Access** – Token used for protected routes
4. **Booking** – Customer creates booking
5. **Processing** – Admin manages booking
6. **Billing** – Final bill is calculated

---

## 🔒 Security

* Password hashing using **bcrypt**
* JWT-based authentication
* Role-based access (Admin / Customer)
* Input validation
* Environment variable protection

---
