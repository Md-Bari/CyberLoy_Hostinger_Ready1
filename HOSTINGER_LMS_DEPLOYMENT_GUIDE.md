# CyberLoy LMS Platform - Hostinger Deployment Guide

This guide details the complete deployment process for the **CyberLoy Learning Management System (LMS)** on Hostinger shared or VPS hosting using **Laravel Backend**, **MySQL (phpMyAdmin)**, and **React Frontend**.

---

## Architecture Overview

```
CyberLoy_Hostinger_Ready/
├── backend/                       # Laravel 11/12 REST API Backend
│   ├── app/                       # Controllers, Models, Middleware
│   ├── database/lms_database.sql  # Complete MySQL Dump for phpMyAdmin
│   ├── routes/api.php             # API Endpoints (Auth, Tasks, Admin, Certificates)
│   ├── .env                       # Database & Application Configuration
│   ├── .htaccess                  # Root Apache redirect to public/
│   └── public/.htaccess           # Laravel Front Controller SPA Rewrite
│
├── frontend/                      # React + Vite + Tailwind CSS Frontend
│   └── dist/                      # Hostinger Ready Build Output
│       ├── index.html
│       ├── assets/
│       └── .htaccess              # Frontend SPA Fallback Rules
```

---

## Step 1: Set Up MySQL Database in Hostinger phpMyAdmin

1. Log in to **Hostinger hPanel**.
2. Go to **Databases** > **Management** > **Create a New MySQL Database and User**:
   - Database Name: `u123456789_lms`
   - Database Username: `u123456789_admin`
   - Password: `YourStrongPassword123!`
3. Click **Enter phpMyAdmin**.
4. Select your database from the left sidebar and click the **Import** tab.
5. Choose the file `backend/database/lms_database.sql` and click **Go**.
   *(This creates all tables for users, courses, modules, tasks, enrollments, certificates, and notifications, along with demo admin and student accounts).*

---

## Step 2: Deploy Laravel Backend

1. Upload the contents of the `backend/` folder into your domain/subdomain directory (e.g., `public_html/api` or `api.yourdomain.com`).
2. Open `backend/.env` on Hostinger File Manager and update database credentials:
   ```ini
   APP_NAME="CyberLoy LMS"
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://api.yourdomain.com

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=u123456789_lms
   DB_USERNAME=u123456789_admin
   DB_PASSWORD=YourStrongPassword123!

   FRONTEND_URL=https://yourdomain.com
   ```

3. Ensure permissions for `storage/` and `bootstrap/cache/` are set to `775` or writable.

---

## Step 3: Deploy React Frontend

1. On your local machine inside `frontend/`, run:
   ```bash
   npm run build
   ```
2. Open `frontend/dist/`.
3. Upload **ALL CONTENTS** of `frontend/dist/` (`index.html`, `assets/`, `.htaccess`) directly into your main domain's `public_html/` folder.

---

## Default Accounts for Testing

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@cyberloy.com` | `password123` | Monitor student task completion %, issue certificates, send notifications |
| **General Student** | `student@cyberloy.com` | `password123` | Browse courses, complete module tasks, view percentage %, download certificates |

---

## Core System Features

1. **User Authentication & Role Control**:
   - Registration and Login with JWT Sanctum token authentication.
   - Guarded routes for `admin` and `user`.

2. **Module Task Progress & Percentages**:
   - Interactive task checklists for course modules.
   - Real-time recalculation of task progress percentage (`0%` to `100%`).

3. **Admin Monitoring & Activity Dashboard**:
   - Admin view of all registered users and course progress percentages.
   - One-click certificate issuance.

4. **Certificates & Notifications**:
   - Instant in-app notification when an admin issues a certificate.
   - Printable / downloadable Certificate modal with verification code.
