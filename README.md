![image_aLt](https://github.com/Beniyam-B/Cybersecurity-Log-Monitoring-Intrusion-Prevention-System-/blob/b45e18722aca380461e6fedfcbac1d0e8c9e38f9/photo_5816815917580012191_m.jpg)








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
 7.	Lightweight & Deployable – Run on a simple Node.js + SQLite environment without complex configurations.
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
       cybersec-log-monitor/
                   ├── public/               # Frontend files
                   │   ├── css/               # Stylesheets
                   │   ├── js/                # Client-side scripts
                   │   ├── login.html         # Login page
                   │   ├── signup.html        # Signup page
                   │   ├── dashboard.html     # User dashboard
                   │   └── admin.html         # Admin dashboard
                   ├── routes/                # Express routes
                   │   ├── auth.js            # Login/Signup routes
                   │   ├── admin.js           # Admin-only routes
                   │   └── monitor.js         # Attack detection routes
                   ├── middleware/            # Security middlewares
                   │   ├── bruteForce.js
                   │   ├── sqlInjection.js
                   │   └── xssProtection.js
                   ├── db.js                  # Database connection
                   ├── app.js                 # Main backend server
                   ├── package.json
                   └── README.md

  Technologies
 ### Frontend
   * HTML5, CSS3 (Bootstrap/Tailwind for styling)
<div align="center">
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/html.png" alt="HTML" title="HTML"/></code>
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/css.png" alt="CSS" title="CSS"/></code>
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/bootstrap.png" alt="Bootstrap" title="Bootstrap"/></code>
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/tailwind_css.png" alt="Tailwind CSS" title="Tailwind CSS"/></code>
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
  * SQLite (simple and portable, can later migrate to MySQL/PostgreSQL)
<div align="center">
	<code><img width="50" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/sqlite.png" alt="SQLite" title="SQLite"/></code>
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
  3.User Dashboard
     * Personal login history
     * Account update form
	 
### Admin Pages

#### 4.Admin Dashboard
       * Total login attempts (success/fail)
       * List of suspicious activities
       * User management (create/update/delete)
       * Real-time charts (attack frequency, login locations)
## Final Deliverables
  #### 1.Fully functional web-based application with:
    * Login/signup system
    * Suspicious activity detection & alerts
    * Admin & user dashboards
  #### 2.Well-structured codebase with comments explaining every part
  #### 3.Database schema & sample data
  #### 4.System documentation including:
     * Project description & objectives
     * Architecture diagram
     * User manual
     * Security measures explanation
  #### 5.Deployment instructions for running the project locally or on a server
  #### 6.Test cases for attack detection (brute force, SQL injection, XSS)

