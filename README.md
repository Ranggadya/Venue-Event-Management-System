# 🎟 Event & Venue Management System

Production-style Event & Venue Management System built with **NestJS (SSR)**, **Prisma ORM**, and **MySQL**.

This project demonstrates a modular MVC architecture with a dedicated business logic layer, financial calculation system, validation strategy, and analytical reporting.

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

- 1 Venue → Many Events
- Event memiliki foreign key ke Venue


Event references Venue using foreign key constraint with `onDelete: Restrict`.

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

## Future Improvements

- REST API layer
- Role-based access control
- Transaction handling
- Unit & integration testing
- CI/CD pipeline
- Docker containerization
- Caching layer

---