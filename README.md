<img height="300" width="300" align-item="center" src="https://github.com/Beniyam-B/Cybersecurity-Log-Monitoring-Intrusion-Prevention-System-/blob/b45e18722aca380461e6fedfcbac1d0e8c9e38f9/photo_5816815917580012191_m.jpg"/>








# Project Description

   The Cybersecurity Log Monitoring & Intrusion Prevention System is a lightweight yet powerful web-based application designed to monitor, detect, and respond to suspicious activities on a web platform 
   in real-time.
   It combines a secure authentication system, activity logging, attack detection (including brute force, SQL injection, and XSS attempts), and an administrative dashboard to provide small and medium- 
   sized organizations with affordable, user-friendly security monitoring.

## Project Objectives
 1.	Secure Access Management – Provide a robust authentication system with signup, login, and session handling.
 2.	Comprehensive Logging – Record all login attempts (successful and failed) with timestamp, IP address, and user data.
 3.	Attack Detection – Identify and log suspicious activities like brute force attempts, SQL injection patterns, and XSS payloads.
 4.	Real-Time Alerts – Notify admins instantly of critical security events via dashboard alerts.
 5.	User Role Management – Differentiate between admin and normal user permissions.
 6.	Usable Interface – Deliver a modern, responsive dashboard for both users and admins.
 7.	Lightweight & Deployable – Run on a simple Node.js + MongoDB environment without complex configurations.
 8.	User Roles & Permissions
## Role	Permissions
### Admin	
          * Full access to the admin dashboard.
          * View all login attempts.
          * View and manage suspicious activity logs.
          * Create, update, or remove user accounts.
          * Set security thresholds (e.g., brute force attempt limit).
### Normal User	- Sign up and log in to personal account.
          * Access their own dashboard.
          * View their personal login history.
          * Cannot view other users’ logs or security alerts.

## Key Features
  ### 1.Secure Authentication
     * Signup & login with password hashing (bcrypt)
     * Session management with secure cookies
     * Input validation & sanitization
  ### 2.Suspicious Activity Detection
     * Brute force detection (too many failed logins)
     * SQL injection prevention middleware
     *	XSS prevention middleware
  ### 3.Activity Logging
     * Store every login attempt with IP, timestamp, and status
     * Record all suspicious activities
  ### 4.Admin Dashboard
     * View user activity logs
     * See attack statistics and charts
     * Manage user accounts
  ### 5.User Dashboard
     * See personal login history
     * Update personal account details
  ### 6.Modern UI
     * Responsive design for both desktop & mobile
     * Charts and data tables for clear visualization




  ## 7.	Project Structure
             CyberLogSystem/
                  │
                  ├── CyberLogSystem/
                  │   │
                  │   ├── frontend/
                  │   │   │
                  │   │   └── client/
                  │   │       │
                  │   │       ├── public/                     # Static assets (icons, images, manifest)
                  │   │       │
                  │   │       └── src/
                  │   │           ├── components/              # Reusable UI components (forms, tables, modals)
                  │   │           ├── context/                 # Global state management (AuthContext)
                  │   │           ├── hooks/                   # Custom React hooks (auth, API, theme)
                  │   │           ├── lib/                     # Shared libraries or helper modules
                  │   │           ├── pages/                   # App pages (Login, Signup, Dashboard, Admin)
                  │   │           ├── utils/                   # Utility functions (API handlers, validators)
                  │   │           │
                  │   │           ├── App.css                  # Global styling
                  │   │           ├── App.tsx                  # Root React component
                  │   │           ├── index.css                # Global CSS configuration
                  │   │           └── main.tsx                 # Entry point (ReactDOM rendering)
                  │   │
                  │   │           ├── index.html                   # HTML template
                  │   │           └── .gitignore                   # Ignore node_modules, dist, etc.
                  │   │
                  │   │
                  │   └── secure/
                  │       │
                  │       └── backend/
                  │           │
                  │           └── src/
                  │               ├── config/                  # Configuration (DB, environment)
                  │               ├── controllers/             # Business logic & API handlers
                  │               ├── middleware/              # Security middleware (Auth, Rate limiting)
                  │               ├── models/                  # MongoDB Schemas (Users, Logs, Alerts)
                  │               ├── routes/                  # REST API endpoints
                  │               ├── services/                # Core logic (logging, alerts, notifications)
                  │               └── server.js                # Entry point for backend server
                  │               │
                  │               └── .gitignore                   # Ignore environment and node_modules
                  │
                  └──                                

		 
## Technologies

 ### Frontend
   * React + Vite
   * TypeScript/javaScript
   * Tailwind CSS / Shadcn UI / Bootstrap
   * Chart.js For Analytics and Visualization
   * React Router For navigation
<div align="center">
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/bootstrap.png" alt="Bootstrap" title="Bootstrap"/></code>
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/tailwind_css.png" alt="Tailwind CSS" title="Tailwind CSS"/></code>
</div>
<div align="center">
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/shadcn_ui.png" alt="ShadCn UI" title="ShadCn UI"/></code>
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/react.png" alt="React" title="React"/></code>
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/typescript.png" alt="TypeScript" title="TypeScript"/></code>
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/vite.png" alt="Vite" title="Vite"/></code>
</div>
   * Chart.js (for data visualization)
   
### Backend
  * Node.js
  * Express.js
  * Helmet.js (security headers)
  * Express-session (session handling)
  * bcrypt.js (password hashing)
  * Body-parser (form handling)
<div align="center">
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/node_js.png" alt="Node.js" title="Node.js"/></code>
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/express.png" alt="Express" title="Express"/></code>
</div>

### Database
- *MongoDB – Schema-based storage for users, logs, and security events  
- Optimized for JSON-based data and cloud integration
<div align="center">
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/mongodb.png" alt="mongoDB" title="mongoDB"/></code>
</div>

 ## Pages & Components
 
 ### Public Pages
  #### 1.Login Page
    * Form with username & password
    * Error messages for failed attempts
  #### 2.Signup Page
    * Create new account
    * Password strength check
    	
### User Pages

#### 3.User Dashboard
     * Personal login history
     * Account update form
     * Generate Daily/Weekly/Montly account reports
     * Profile settings
     * Setting
     * Report page
	 
### Admin Pages

#### 4.Admin Dashboard
       * Total login attempts (success/fail)
       * List of suspicious activities
       * User management (create/update/delete)
       * Real-time charts (attack frequency, login locations)
       * Reset users password
       * Generate the System users Report

## Deployment & Usage
  ## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/demovg/CyberLog-System.git
cd CyberLog-System
```

### 2. Backend Setup
```bash
cd CyberLogSystem/secure/backend
npm install
```

**Backend Dependencies:**
- express
- mongoose
- jsonwebtoken
- bcryptjs
- express-validator
- cors
- helmet
- express-rate-limit
- http-status-codes
- cookie-parser

### 3. Frontend Setup
```bash
cd ../../frontend/client
npm install
```

**Frontend Dependencies:**
- react
- react-dom
- react-router-dom
- @tanstack/react-query
- lucide-react
- @radix-ui/react-dialog
- @radix-ui/react-select
- tailwindcss
- typescript
- vite

### 4. Environment Configuration

Create `.env` file in `CyberLogSystem/secure/backend/`:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/cyberlog

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_EXPIRES_IN=7d

# Admin Secrets
ADMIN_SIGNUP_SECRET=CYBER_ADMIN_SECRET_2024
ADMIN_SECRET_CODE=CYBER_ADMIN_2024

# Server Configuration
PORT=8080
NODE_ENV=development

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 5. Database Setup

Make sure MongoDB is running on your system:
```bash
# Start MongoDB service
mongod
```

### 6. Start the Application

**Start Backend Server:**
```bash
cd CyberLogSystem/secure/backend
npm start
```

**Start Frontend Development Server:**
```bash
cd CyberLogSystem/frontend/client
npm run dev
```

## Usage

1. **Access the application**: Open http://localhost:5173 in your browser
2. **Create Admin Account**: Sign up with admin secret code: `CYBER_ADMIN_SECRET_2024`
3. **Login**: Use your credentials to access the dashboard
4. **Admin Features**: Manage users, view system logs, generate reports
5. **User Features**: View personal dashboard, security alerts, download reports

## Default Accounts

After installation, you can create accounts:
- **Admin**: Use the admin secret `CYBER_ADMIN_SECRET_2024` during signup
- **User**: Regular signup without admin secret

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout

### Dashboard
- `GET /api/dashboard/user` - User dashboard data
- `GET /api/dashboard/admin` - Admin dashboard data

### Admin Management
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `PUT /api/admin/users/:id/suspend` - Suspend/unsuspend user
- `POST /api/admin/users/:id/reset-password` - Reset user password

### Reports
- `GET /api/reports` - Get user reports
- `POST /api/reports/generate` - Generate new report
- `GET /api/reports/:id/download` - Download report
   
## Final Deliverables
  #### 1.Fully functional web-based application with:
    * Login/signup system
    * Suspicious activity detection & alerts
    * Admin & user dashboards
  #### 2.Well-structured codebase with comments explaining every part
  #### 3.Database schema & sample data
  #### 4.Deployment and setup guide
  #### 5.Deployment instructions for running the project locally or on a server
  #### 6.Test cases for attack detection (brute force, SQL injection, XSS)

