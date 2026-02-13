# 🎟 Event & Venue Management System

Production-style Event & Venue Management System built with **NestJS (SSR)**, **Prisma ORM**, and **MySQL**.

This project demonstrates a modular MVC architecture with a dedicated business logic layer, financial calculation system, validation strategy, and analytical reporting.

---

## Project Description

This system manages the lifecycle of venues and events in a structured and scalable way. It is designed to demonstrate backend engineering principles such as modular architecture, validation strategy, financial computation, and reporting aggregation.

The application allows administrators to:

- Register and manage venues
- Schedule events with datetime validation
- Automatically calculate rental costs based on duration and rental type
- Apply discounts and additional fees
- Track payment status
- Generate dashboard statistics and revenue insights

Unlike basic CRUD applications, this system enforces business rules at the service layer, ensuring data consistency and proper domain validation before database interaction.

The project follows a layered MVC approach combined with a dedicated service layer to maintain clean separation between HTTP handling, business logic, and persistence logic.

This repository is structured to reflect how production-ready backend systems are typically organized.

---

## 🚀 Overview

This application is designed to manage:

- Venue lifecycle
- Event scheduling
- Rental pricing calculation
- Payment tracking
- Financial statistics dashboard

The system uses **Server-Side Rendering (EJS)** and follows a **layered MVC architecture** to ensure maintainability, scalability, and clean separation of concerns.

---

## 📷 Application Screenshots

### 🏠 Dashboard

Displays total events, revenue summary, and event status breakdown.

![Dashboard](screenshots/dashboard.png)

---

### 🏢 Venue List

Shows all registered venues including status and pricing configuration.

![Venue List](screenshots/venue-list.png)

### ➕ Venue Form

Form interface for creating or updating venue data including pricing and operational status.

![Venue Form](screenshots/venue-form.png)

### 📊 Venue Statistics

Displays venue-based analytics such as total events per venue and revenue contribution.

![Venue Statistics](screenshots/venue-statistics.png)

---

### 📅 Event List

Displays scheduled events with filtering by status and payment information.

![Event List](screenshots/event-list.png)

---

### ➕ Create Event Form

Form interface for scheduling events with datetime validation and pricing calculation.

![Create Event](screenshots/event-form.png)

---

### 📄 Event Detail

Detailed view showing financial breakdown, rental type, discount, and payment status.

![Event Detail](screenshots/event-detail.png)

### 📊 Event Statistics

Shows aggregated event data including upcoming, ongoing, completed events, and total revenue.

![Event Statistics](screenshots/event-statistics.png)

---

## 🏗 Architecture

The application follows a structured layered architecture:

Client (Browser)
↓
Controller (HTTP Layer)
↓
Service (Business Logic Layer)
↓
Prisma ORM (Data Access Layer)
↓
MySQL Database


### MVC Mapping

| Layer       |   Implementation              |
|-------------|-------------------------------|
| Model       | Prisma Schema & Prisma Client |
| View        | EJS Templates                 |
| Controller  | NestJS Controllers            |
| Service     | Business Logic Layer          |

### Architectural Principles

- Thin Controllers
- Centralized Business Logic
- Type-Safe Database Access
- Modular Domain-Based Structure
- Clear Separation of Concerns

---

## 🧠 Core Features

### 🎪 Venue Management
- Create, update, delete venues
- Capacity & pricing configuration
- Venue status management (ACTIVE, MAINTENANCE, INACTIVE)

### 📅 Event Management
- Event scheduling with datetime validation
- Automatic pricing calculation
- Rental type (Hourly / Daily)
- Payment tracking
- Event status tracking (UPCOMING, ONGOING, COMPLETED, CANCELLED)

### 💰 Pricing Logic
- Duration-based calculation
- Discount support
- Additional fees support
- Final price auto-calculated

### 📊 Dashboard & Analytics
- Total events
- Upcoming / Ongoing / Completed
- Paid vs Unpaid tracking
- Revenue aggregation
- Revenue per venue

---

## 🗄 Database Design

### Entities

#### 1. Admin
- id (UUID)
- name
- email (unique)
- password_hash
- is_active
- created_at
- updated_at

#### 2. Venue
- id (UUID)
- name
- description
- address
- city
- capacity
- price_per_hour
- price_per_day
- currency
- status (ACTIVE / MAINTENANCE / INACTIVE)

#### 3. Event
- id (UUID)
- venue_id (FK)
- name
- description
- start_datetime
- end_datetime
- status (UPCOMING / ONGOING / COMPLETED / CANCELLED)
- rental_type (HOURLY / DAILY)
- base_price
- discount
- additional_fees
- final_price
- is_paid
- payment_date

### Relationship

One Venue can have many Events.

Venue (1) → (N) Event

Foreign key constraint uses restricted deletion to preserve event integrity.

---

## Business Rules

- End datetime must be greater than start datetime.
- Venue must exist before event creation.
- UUID validation performed before database query.
- Pricing logic centralized in service layer.
- Partial update does not overwrite unchanged fields.
- Revenue calculated using aggregate queries.

---

## Tech Stack

Backend
- NestJS
- Prisma ORM
- MySQL
- EJS (Server-Side Rendering)

Validation & Utilities
- class-validator
- class-transformer

Development Tools
- TypeScript
- ESLint
- Prettier

---

## Installation

1. Clone repository

git clone <your-repo-url>  
cd <project-folder>

2. Install dependencies

npm install

3. Setup environment variables

Create a `.env` file:

DATABASE_URL="mysql://user:password@localhost:3306/database"

4. Generate Prisma Client

npx prisma generate

5. Run database migration

npx prisma migrate dev

6. Start development server

npm run start:dev

Application runs on:

http://localhost:3000

---

## Project Structure

src/
 ├── admin/
 ├── venue/
 ├── event/
 ├── prisma/
 ├── views/

Each module contains:
- Controller
- Service
- DTO
- View templates

---

## Error Handling Strategy

- DTO-based validation
- Structured logging via NestJS Logger
- Controlled try-catch blocks
- Redirect-based feedback messaging

---
## 📦 Dependencies

### Core Dependencies

- NestJS – Backend application framework
- Prisma ORM – Type-safe database client
- MySQL – Relational database
- EJS – Server-side rendering template engine
- class-validator – Input validation
- class-transformer – DTO transformation

### Development Dependencies

- TypeScript – Static typing
- ts-node – TypeScript execution
- ESLint – Code linting
- Prettier – Code formatting
- Prisma CLI – Database migration & schema management

---

### Environment Requirements

- Node.js (v18+ recommended)
- MySQL Server
- npm or yarn
