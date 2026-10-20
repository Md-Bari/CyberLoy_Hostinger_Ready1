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
4. After importing an existing database, run the new schema migrations from the backend directory:
   ```bash
   php artisan migrate --force
   ```
   Deploy the matching application code and migration files together. Do not skip
   this step; the instructor, assessment, password-reset, discussion, and Stripe
   workflows depend on the new columns and tables.
5. Configure transactional email and Stripe on the server (never in frontend
   environment variables or committed files):
   ```ini
   FRONTEND_URL=https://yourdomain.com
   AUTH_REQUIRE_EMAIL_VERIFICATION=true
   MAIL_MAILER=smtp
   MAIL_SCHEME=smtp
   MAIL_HOST=your-smtp-host
   MAIL_PORT=587
   MAIL_USERNAME=your-smtp-username
   MAIL_PASSWORD=your-smtp-password
   MAIL_FROM_ADDRESS=no-reply@yourdomain.com
   MAIL_FROM_NAME="CyberLoy LMS"
   STRIPE_SECRET=sk_live_replace_with_your_key
   STRIPE_WEBHOOK_SECRET=whsec_replace_with_your_signing_secret
   ```
   Configure a Stripe webhook at
   `https://api.yourdomain.com/api/stripe/webhook` for
   `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
   Start with Stripe test credentials and verify both successful and cancelled
   checkout before enabling live payments.
6. After changing environment values, run `php artisan config:cache`. Confirm
   `/up` returns a healthy status and that email/reset and signed verification
   links use the intended HTTPS domain.

---

## Step 3: Deploy React Frontend

1. On your local machine inside `frontend/`, run:
   ```bash
   npm run build
   ```
2. Open `frontend/dist/`.
3. Upload **ALL CONTENTS** of `frontend/dist/` (`index.html`, `assets/`, `.htaccess`) directly into your main domain's `public_html/` folder.

---

## Initial account security

The SQL dump and local seed data may contain demo users. Before exposing the
site, remove those users or replace their passwords with unique, strong
credentials. Create production accounts through the administrator workflow and
verify that each user receives an email-verification link. Never publish demo
credentials or use them on a public deployment.

---

## Core System Features

1. **Accounts and role control**:
   - JWT authentication, instructor and administrator roles, email verification,
     password-reset links, and role-scoped assessment reviews.
   - Administrators assign instructors to courses; learners submit work and
     instructors return scores and feedback.

2. **Module Task Progress & Percentages**:
   - Interactive task checklists for course modules.
   - Real-time recalculation of task progress percentage (`0%` to `100%`).

3. **Admin Monitoring & Activity Dashboard**:
   - Admin view of all registered users and course progress percentages.
   - One-click certificate issuance.

4. **Certificates & Notifications**:
   - Instant in-app notification when an admin issues a certificate.
   - Printable / downloadable Certificate modal with verification code.

5. **Course discussions and assessments**:
   - Enrolled learners and assigned instructors can discuss course topics.
   - MCQ answer keys are graded on the server and hidden from learners; written
     submissions remain pending until reviewed. Attempts and pass results are
     recorded.

6. **Payments and operational readiness**:
   - Stripe-hosted Checkout keeps card data out of the LMS. A signed webhook and
     server-side session confirmation unlock a course only after Stripe reports
     payment.
   - Schedule encrypted database and uploaded-file backups to storage outside
     the web host. Monitor `/up`, Laravel logs, Stripe webhook delivery, SMTP
     failures, and disk/database capacity. Perform and record periodic restore
     tests; the application does not configure an external backup or monitoring
     provider automatically.
