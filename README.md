# 🏨 Raj Griha

### Hotel Management & Booking Platform

A full-stack hotel booking and management platform built for **Raj Griha** — covering room discovery, availability, bookings, payments, guest management, orders, and hotel administration.

🌐 **Live:** [rajgriha.com](https://www.rajgriha.com/)  
💻 **Repository:** [GitHub](https://github.com/Rishitosh-Panwar/raj-griha)

---

## ✨ What is Raj Griha?

Raj Griha started as a web development project and grew into a complete hotel management platform.

The idea was simple: build something closer to a real hotel website than a typical demo booking app.

Guests can browse rooms, check availability, make individual or group bookings, choose meal plans, make payments, manage bookings and orders, and receive transactional emails.

Hotel administrators have a dedicated dashboard for managing rooms, bookings, orders, menus, gallery content, and settings.

---

## 🚀 Features

### Guest Experience

- 🏨 Browse rooms and room types
- 📅 Check room availability
- 🛏️ Individual bookings
- 👥 Group bookings
- 🍽️ Meal plan selection
- 💳 Full and advance payment options
- 📋 Booking and order management
- 👤 User profiles
- 📧 Email verification
- 🔐 OTP-based password recovery
- 🔑 Google Sign-In
- 📱 Responsive interface

### Payments

Integrated **Razorpay** for real payment workflows.

- Create payment orders
- Full and partial / advance payments
- Group payments
- Payment verification
- Signed webhook verification
- Refund processing
- Payment status tracking

### Admin Dashboard

Dedicated management interfaces for:

- 📊 Dashboard
- 🏨 Rooms
- 📅 Bookings
- 🛒 Orders
- 🍽️ Menu
- 🖼️ Gallery
- ⚙️ Settings

### Security & Backend

- JWT-based authentication
- HTTP-only authentication cookies
- Protected routes
- Email verification
- OTP-based password recovery
- Rate limiting for sensitive authentication endpoints
- Razorpay signature verification
- Webhook signature verification
- Environment-based configuration

---

## 🧱 Tech Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- JavaScript

### Backend

- Node.js
- Express.js
- REST APIs
- JWT
- Cookie-based authentication

### Database

- MongoDB
- Mongoose

### Services & Integrations

- Razorpay — payments
- Cloudinary — image and media storage
- Resend — transactional email
- Google Sign-In — authentication

### Deployment

- Vercel — frontend
- Render — backend
- Cloudflare — domain / infrastructure services

---

## 🏗️ Project Structure

```text
raj-griha/
│
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       └── ...
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── ...
│
└── README.md
```

The project is split into separate frontend and backend applications, with the React client communicating with the Express REST API.

---

## 🔄 Booking & Payment Flow

```text
Guest
  │
  ▼
Select Room
  │
  ▼
Check Availability
  │
  ▼
Enter Guest Details
  │
  ▼
Choose Meal Plan
  │
  ▼
Create Booking
  │
  ▼
Create Razorpay Order
  │
  ▼
Razorpay Checkout
  │
  ▼
Verify Payment
  │
  ▼
Confirm Booking
  │
  ▼
Transactional Email
```

Group bookings can manage multiple room reservations and support group-level payment processing.

---

## 🔐 Authentication Flow

```text
Email / Password ──► Email Verification ──► Login
                                           │
                                           ▼
                                  HTTP-only Auth Cookie

Google Sign-In ───────────────────────────► Authentication

Forgot Password ──► OTP Check ──► Reset Password
```

---

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Rishitosh-Panwar/raj-griha.git
cd raj-griha
```

### 2. Install dependencies

Install dependencies for both applications:

```bash
cd client
npm install

cd ../server
npm install
```

### 3. Configure environment variables

Create the required `.env` files for the client and server.

The application uses environment variables for service configuration such as:

- MongoDB
- JWT authentication
- Google authentication
- Razorpay
- Cloudinary
- Resend
- Frontend / backend URLs
- Razorpay webhook secret

**Never commit real credentials or secrets to GitHub.**

### 4. Run the backend

```bash
cd server
npm run dev
```

### 5. Run the frontend

In another terminal:

```bash
cd client
npm run dev
```

---

## 🌍 Deployment

The production application is deployed as separate frontend and backend services.

**Frontend:** Vercel  
**Backend:** Render

### [🌐 Visit rajgriha.com](https://www.rajgriha.com/)

---

## 💡 What I Learned Building This

This project went beyond building pages and connecting a database.

Some of the more interesting engineering problems were:

- Designing REST APIs around real booking workflows
- Preventing conflicting room bookings
- Handling partial and group payments
- Verifying Razorpay payments and webhooks
- Building authentication and recovery flows
- Managing transactional email
- Connecting third-party services
- Separating frontend and backend deployments
- Debugging issues that appeared only after deployment

A lot of the learning came from fixing things that worked locally but behaved differently once the application was actually deployed.

---

## 📌 Project Status

**Live and actively maintained.**

The project continues to evolve as features, fixes, and improvements are added.

---

## 👨‍💻 Author

### Rishitosh Panwar

Computer Science Engineer focused on full-stack and backend development.

- 💼 [LinkedIn](https://www.linkedin.com/in/rishitoshpanwar)
- 🐙 [GitHub](https://github.com/Rishitosh-Panwar)
- 🌐 [Raj Griha](https://www.rajgriha.com/)

---

> Built to be more than a demo — a real application with real booking, payment, authentication, and deployment workflows.
