# Time Tracker Backend API

A comprehensive backend service for the Time Tracker application that helps teams monitor and manage work hours with automatic time tracking, screenshots, and detailed reports.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [Employees](#employees)
  - [Projects](#projects)
  - [Tasks](#tasks)
  - [Time Tracking](#time-tracking)
  - [Screenshots](#screenshots)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)

## Features

- User authentication and authorization
- Email verification
- Projects and tasks management
- Time tracking with start/stop functionality
- Screenshot capturing and storage
- Detailed time reports and analytics
- Team management capabilities

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **Sequelize** - ORM for database interactions
- **JSON Web Tokens (JWT)** - Secure authentication
- **Bcrypt.js** - Password hashing
- **Nodemailer** - Email sending capabilities

## Getting Started

### Prerequisites

- Node.js (v14.x or higher)
- PostgreSQL (v12.x or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/time-tracker.git
cd time-tracker/backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see [Environment Variables](#environment-variables) section).

4. Create the database:
```bash
createdb time_tracker
```

5. Start the development server:
```bash
npm run dev
```

The server will start on the port defined in your environment variables (default: 3001).

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=time_tracker
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password

# Frontend URL (for verification links)
FRONTEND_URL=http://localhost:3000

# API Base URL
API_BASE_URL=http://localhost:3001
```

## API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register a new employee |
| POST | /api/auth/verify-email | Verify employee email address |
| POST | /api/auth/login | Login and get authentication token |
| PUT | /api/auth/update-password | Change password (requires auth) |

### Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/employees | Get all employees (admin) |
| GET | /api/employees/:id | Get employee by ID (admin) |
| POST | /api/employees | Create employee (admin) |
| PUT | /api/employees/:id | Update employee (admin) |
| DELETE | /api/employees/:id | Deactivate employee (admin) |
| GET | /api/employees/profile/me | Get own profile |
| PUT | /api/employees/profile/me | Update own profile |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | Get all projects (admin) |
| GET | /api/projects/:id | Get project by ID |
| POST | /api/projects | Create project (admin) |
| PUT | /api/projects/:id | Update project (admin) |
| DELETE | /api/projects/:id | Deactivate project (admin) |
| GET | /api/projects/employee/me | Get projects for authenticated employee |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks | Get all tasks (admin) |
| GET | /api/tasks/:id | Get task by ID |
| POST | /api/tasks | Create task (admin) |
| PUT | /api/tasks/:id | Update task (admin) |
| DELETE | /api/tasks/:id | Deactivate task (admin) |
| GET | /api/tasks/project/:projectId | Get tasks for a project |
| GET | /api/tasks/employee/me | Get tasks for authenticated employee |

### Time Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/time-tracking/start | Start time tracking |
| PUT | /api/time-tracking/stop/:timeLogId | Stop time tracking |
| GET | /api/time-tracking/current | Get current active time log |
| GET | /api/time-tracking/logs | Get own time logs |
| GET | /api/time-tracking/all | Get all time logs (admin) |
| PUT | /api/time-tracking/:id | Update time log (admin) |
| DELETE | /api/time-tracking/:id | Delete time log (admin) |

### Screenshots

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/screenshots | Store a screenshot |
| GET | /api/screenshots/timelog/:timeLogId | Get screenshots for a time log |
| GET | /api/screenshots/me | Get own screenshots |
| GET | /api/screenshots/employee/:employeeId | Get employee screenshots (admin) |
| DELETE | /api/screenshots/:id | Delete a screenshot (admin) |

## Project Structure

```
backend/
├── public/                 # Public assets and downloads
│   └── downloads/          # Desktop application binaries
├── src/                    # Source code
│   ├── config/             # Configuration files
│   │   └── database.js     # Database connection
│   ├── controllers/        # API controllers
│   ├── middleware/         # Middleware functions
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   └── index.js            # Application entry point
├── .env                    # Environment variables (not in repo)
├── package.json            # Project dependencies
└── README.md               # This file
```

## Database Schema

The database uses the following models with relationships:

- **Employee**: User accounts with authentication details
- **Project**: Work projects that contain tasks
- **Task**: Individual tasks within a project
- **TimeLog**: Time tracking records
- **Screenshot**: Screenshots captured during time tracking
- **EmployeeProject**: Many-to-many relationship between employees and projects
- **EmployeeTask**: Many-to-many relationship between employees and tasks

### Relationships

- Employees can be assigned to multiple Projects and Tasks
- Projects contain multiple Tasks
- TimeLogs are linked to an Employee, Task, and Project
- Screenshots are linked to a TimeLog and an Employee
