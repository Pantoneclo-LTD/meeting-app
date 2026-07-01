# Meeting App

A comprehensive meeting room booking and management system built with Next.js 15, React 19, Prisma, Tailwind CSS, and NextAuth.js.

## Features

- **Role-Based Access Control**: Three distinct roles: `USER`, `ADMIN`, and `SUPERADMIN`.
  - **User**: Can book meetings, view their own dashboard/history, and cancel their pending/approved bookings.
  - **Admin**: Can approve or reject bookings and view system-wide dashboard metrics.
  - **Superadmin**: Full system access. Can manage users, alter user roles/teams, and bulk delete/manage all bookings.
- **Interactive Calendar**: FullCalendar integration allowing users to click and drag to book timeslots visually.
- **Conflict Prevention**: Built-in logic prevents overlapping meetings and intelligently accounts for mandatory "preparation time" between meetings.
- **Off-Days & Holidays**: Automatically blocks bookings on Fridays (off-days) and predefined public holidays.
- **Email Notifications & Invites**: Automated SMTP emails via Nodemailer when a booking is requested, approved, or rejected. Approved bookings include a downloadable `.ics` calendar attachment.
- **Cron Reminders**: A secure API endpoint designed to be triggered via Cron to send automated 30-minute reminder emails before meetings start.
- **Dynamic Dashboard**: Beautiful UI featuring aggregated statistic cards, Tailwind CSS-based visual charts, a highlighted upcoming event hero widget, and a recent past events log.
- **Exporting**: Export booking logs easily to Excel or PDF.

## Prerequisites

- Node.js 18+ (20+ recommended)
- PostgreSQL Database
- PM2 (Optional, for production deployment)

## Getting Started

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd meeting-app
pnpm install
```
*(You can also use `npm install` or `yarn install`)*

### 2. Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/meeting_app?schema=public"

# NextAuth Secret (Generate one using: openssl rand -base64 32)
AUTH_SECRET="your-super-secret-key"

# Email Configuration (SMTP)
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your-email@example.com"
SMTP_PASS="your-email-password"
SMTP_FROM="your-email@example.com"

# Default SuperAdmin Credentials (used during DB Seed)
SUPERADMIN_EMAIL="admin@example.com"
SUPERADMIN_PASSWORD="superadminpassword"
SUPERADMIN_NAME="Super Admin"

# Application URL (Required for Email Links & NextAuth in Prod)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup & Data Seeding

Run the Prisma migrations to set up your database schema:

```bash
npx prisma migrate dev
```

Next, seed the database to create the default Superadmin account (using the credentials specified in your `.env`):

```bash
npx prisma db seed
```

### 4. Run Development Server

```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. You can log in with your Superadmin credentials.

## Production Deployment (PM2)

This project includes an `ecosystem.config.js` file for seamless deployment using PM2.

### 1. Build the Application

```bash
pnpm build
```

### 2. Start with PM2

Start the application in cluster mode (utilizing maximum CPU cores):

```bash
pm2 start ecosystem.config.js --env production
```

### 3. Setup PM2 Startup Script

To ensure the application restarts automatically on server reboots:

```bash
pm2 save
pm2 startup
```

## Running the Reminder Cron Job

The application exposes a secure endpoint at `/api/cron/reminders`.
To trigger the 30-minute reminder emails automatically, set up a server cron job (e.g., using `crontab -e`) to ping the URL every minute:

```bash
* * * * * curl -s -H "Authorization: Bearer <YOUR_CRON_SECRET>" http://localhost:3000/api/cron/reminders > /dev/null
```
*(Make sure to match the `CRON_SECRET` env variable if you implemented one, or adjust the script as needed).*
