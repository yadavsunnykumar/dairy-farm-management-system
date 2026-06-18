# Dairy Farm Management System - POC (Proof of Concept)

## Project Overview

The Dairy Farm Management System is designed to manage milk collection, milkman payments, branch operations, and reporting. The system will support multiple branches while maintaining proper access control and data visibility.

---

# Objectives

- Manage milkmen (milk suppliers)
- Record daily milk collection
- Automatically calculate payment amounts based on milk rate
- Track payments made to milkmen
- Maintain milkman ledger and balance
- Provide branch-wise and global reporting
- Support multiple branches with role-based access control

---

# User Roles

## 1. Admin

### Permissions

- Create and manage branches
- Create and manage users
- Set global milk rate
- View all branches
- View all milkmen
- View all reports
- View payment summaries
- Generate reports

---

## 2. Branch User

### Permissions

- Login to assigned branch
- Add milkmen
- Edit milkmen belonging to their branch
- Record daily milk collection
- Record payments made to milkmen
- View reports
- View milkman details

### Restrictions

- Can view all records
- Can edit only milkmen belonging to their branch
- Cannot modify records of another branch

---

# Core Modules

## Authentication Module

### Features

- User Login
- JWT Authentication
- Role-Based Authorization
- Branch-Based Access Control

---

## Branch Management

### Fields

| Field       | Type            |
| ----------- | --------------- |
| Branch Name | String          |
| Address     | String          |
| Status      | Active/Inactive |

### Example

- Patna Branch
- Gaya Branch
- Delhi Branch

---

## User Management

### Fields

| Field    | Type       |
| -------- | ---------- |
| Name     | String     |
| Email    | String     |
| Password | String     |
| Role     | Admin/User |
| Branch   | Reference  |

---

## Milkman Management

### Features

- Add Milkman
- Edit Milkman
- View Milkman
- Search Milkman
- Generate Unique Milkman Code

### Fields

| Field         | Type           |
| ------------- | -------------- |
| Milkman Code  | Auto Generated |
| Name          | String         |
| Mobile Number | String         |
| Village       | String         |
| Address       | String         |
| Branch        | Reference      |

### Unique ID Format

PAT-001

PAT-002

PAT-003

Where:

PAT = Branch Code

001 = Running Sequence Number

---

# Milk Collection Module

## Purpose

Record daily milk collection from milkmen.

### Fields

| Field            | Type       |
| ---------------- | ---------- |
| Milkman          | Reference  |
| Date             | Date       |
| Quantity (Liter) | Number     |
| Rate Per Liter   | Number     |
| Total Amount     | Calculated |

### Formula

Total Amount = Quantity × Rate

### Example

Date: 17-Jun-2026

Milkman: Ram

Milk Collected: 10 Liter

Rate: ₹60

Total Amount: ₹600

---

# Milk Rate Management

## Admin Controlled

Admin can set:

- Global Milk Rate

### Example

Milk Rate = ₹60 per Liter

All collection entries automatically use this rate.

Future Enhancement:

- Date-wise Rate History
- Fat-Based Pricing
- SNF-Based Pricing

---

# Payment Management

## Purpose

Record payments made to milkmen.

### Fields

| Field        | Type      |
| ------------ | --------- |
| Milkman      | Reference |
| Amount       | Number    |
| Payment Date | Date      |
| Remarks      | Text      |

### Example

Milkman: Ram

Payment: ₹1000

Date: 17-Jun-2026

---

# Milkman Ledger

## Purpose

Provide complete financial information for each milkman.

### Calculations

Total Milk Given

Total Earned Amount

Total Amount Paid

Pending Amount

### Formula

Pending Amount = Total Earned - Total Paid

### Example

Total Milk = 100 Liter

Rate = ₹60

Total Earned = ₹6000

Total Paid = ₹4000

Pending = ₹2000

---

# Milkman Detail Page

## Summary Section

Display:

- Milkman Information
- Milkman Code
- Branch
- Mobile Number

### Financial Summary

- Total Milk Given
- Total Earned
- Total Paid
- Pending Amount

---

## Collection History

| Date   | Liter | Rate | Amount |
| ------ | ----- | ---- | ------ |
| 01-Jun | 10    | 60   | 600    |
| 02-Jun | 12    | 60   | 720    |
| 03-Jun | 8     | 60   | 480    |

---

## Payment History

| Date   | Amount |
| ------ | ------ |
| 05-Jun | 1000   |
| 10-Jun | 500    |

---

# Dashboard Module

## Daily Dashboard

Display:

- Total Milk Collected Today
- Total Collection Amount
- Total Payments Made
- Pending Balance

### Example

| Metric       | Value     |
| ------------ | --------- |
| Total Milk   | 500 Liter |
| Total Amount | ₹30,000   |
| Total Paid   | ₹15,000   |
| Pending      | ₹15,000   |

---

## Monthly Dashboard

Display:

- Monthly Milk Collection
- Monthly Collection Amount
- Monthly Payments
- Monthly Pending Balance

### Filters

- Today
- This Week
- This Month
- Custom Date Range

---

# Reports Module

## Reports

### Daily Report

- Total Milk Collected
- Total Amount
- Total Paid
- Pending Balance

### Branch Report

- Branch-wise Collection
- Branch-wise Payments
- Branch-wise Pending

### Milkman Report

- Individual Ledger
- Collection History
- Payment History

---

# Access Control Rules

## Admin

- Full Access

## Branch User

### Allowed

- Create Milkmen
- Edit Own Branch Milkmen
- Add Collections
- Add Payments

### Restricted

- Edit Other Branch Milkmen
- Delete Other Branch Records

---

# Suggested Technology Stack

## Frontend

- React
- Vite
- Tailwind CSS
- Shadcn UI
- TanStack Query

## Backend

- Node.js
- Express.js

## Database

- MongoDB

## Authentication

- JWT

---

# POC Development Timeline

## Week 1

### Setup

- Project Setup
- Authentication
- Branch Module
- User Module
- Milkman Module

Deliverable:

Milkman CRUD Working

---

## Week 2

### Collection Management

- Daily Milk Collection
- Milk Rate Management
- Automatic Amount Calculation

Deliverable:

Collection Module Working

---

## Week 3

### Payments & Ledger

- Payment Module
- Ledger Calculation
- Milkman Details Page

Deliverable:

Complete Milkman Financial Tracking

---

## Week 4

### Dashboard & Reports

- Daily Dashboard
- Monthly Dashboard
- Reports
- Testing

Deliverable:

Client Demo Ready POC

---

# Future Production Enhancements

## Phase 2

- SMS Notifications
- WhatsApp Notifications
- PDF Report Export
- Excel Export
- Mobile App
- Multi-Language Support
- Fat Percentage Tracking
- SNF Percentage Tracking
- Date-wise Milk Rate
- Audit Logs
- Backup & Restore

---

# Estimated Timeline

| Phase              | Duration  |
| ------------------ | --------- |
| POC Development    | 7–10 Days |
| Production Version | 3–4 Weeks |

---

# Success Criteria

The POC will be considered successful when:

- Users can login successfully
- Milkmen can be managed
- Daily milk collection can be recorded
- Payments can be tracked
- Milkman balances are calculated automatically
- Dashboard shows branch and global summaries
- Role-based access control works correctly
- Reports provide accurate financial information
