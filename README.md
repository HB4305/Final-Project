# Online Auction System

A comprehensive web-based platform for online auctions, allowing users to bid on products, manage auctions, and track their bidding history. This project demonstrates a full-stack implementation using the MERN stack with modern frontend technologies.

## 🚀 Technologies

### Frontend
*   **Framework:** React (Vite)
*   **Styling:** TailwindCSS, Shadcn UI (Radix UI + Class Variance Authority)
*   **State/Data Fetching:** Axios, React Query (implied/recommended)
*   **Forms:** React Hook Form, Zod
*   **Routing:** React Router DOM
*   **Editor:** React Quill, TinyMCE

### Backend
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB, Mongoose
*   **Authentication:** Passport.js, JWT, Google OAuth
*   **Utilities:** Multer (File Upload), Node-Cron (Scheduled Tasks), Nodemailer (Email), Bcrypt (Security)

## ✨ Features

This project implements various modules for different user roles:

### 👤 Guest (Anonymous)
*   View categories and products (with pagination).
*   Advanced full-text search and filtering options.
*   View Top 5 products (Ending Soon, Most Bids, Highest Price).
*   Product details with relative time display (e.g., "ends in 3 days").
*   Register for a Bidder account (with OTP verification).

### 🙋 Bidder
*   **Bidding:** Real-time bidding (requires >80% reputation).
*   **Auto-bidding:** Set a maximum price for automatic incremental bidding.
*   **Watchlist:** Add items to favorites.
*   **History:** View own bidding history and won auctions.
*   **Feedback:** Rate sellers after successful transactions.
*   **Seller Request:** Request upgrade to Seller status.

### 🏪 Seller
*   **Post Auctions:** Create listings with images, descriptions (Rich Text), and auto-extensions.
*   **Management:** Review bidder history, deny bids, and cancel transactions if necessary.
*   **Feedback:** Rate winning bidders.

### 🛡️ Administrator
*   Manage Categories (CRUD).
*   Manage Products (Remove listings).
*   Manage Users (Approve Seller upgrades, manage accounts).

## 🛠️ Installation & Setup

### Prerequisites
*   Node.js (v18+ recommended)
*   MongoDB (Local or Atlas URI)

### Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `backend` root and configure your environment variables (DB URI, Email credentials, Auth secrets).
4.  Start the server:
    ```bash
    npm start
    # OR for development
    npm run dev
    ```

### Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

## 📂 Project Structure

*   `backend/`: Express.js API server, database models, and business logic.
*   `frontend/`: React application, components, and pages.

## 🤝 Contribution
This is a final project for the "Web Application Development" course.
