# Insurance Products Management System

## Overview

The Insurance Products Management System is a full-stack web application designed to streamline the management of insurance products, clients, and claims. The system provides a modern and user-friendly interface for administrators to manage insurance operations efficiently while maintaining data integrity through a robust backend and database.

## Features

### Dashboard

* Real-time overview of products, clients, and claims
* Key performance metrics and statistics
* Recent activity monitoring

### Product Management

* Add, update, and delete insurance products
* Support for multiple insurance categories:

  * Life Insurance
  * Health Insurance
  * Auto Insurance
  * Home Insurance
  * Travel Insurance
* Search and filter products

### Client Management

* Maintain client records and contact information
* Search and manage client details
* Track client status and policies

### Claims Management

* Create and process insurance claims
* Approve or reject claims
* Track claim status and claim amounts
* Filter claims based on status

## Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript (ES6)

### Backend

* Node.js
* Express.js

### Database

* SQLite3

### Security

* JWT Authentication
* bcrypt Password Hashing
* Input Validation
* CORS Protection

## Database Design

The system consists of the following main entities:

* Users
* Products
* Clients
* Claims
* Client Products (Policy Mapping)

The database is designed with proper relationships, constraints, and indexing to ensure data consistency and performance.

## Screenshots

### Login Page

*Add screenshot here*

### Dashboard

*Add screenshot here*

### Products Management

*Add screenshot here*

### Clients Management

*Add screenshot here*

### Claims Management

*Add screenshot here*

## Installation

### Prerequisites

* Node.js (v14 or above)
* npm

### Setup

```bash
git clone <repository-url>
cd Insurance-Management-System
npm install
npm run init-db
npm start
```

The application will run at:

```text
http://localhost:3000
```

## Future Enhancements

* Role-Based Access Control (RBAC)
* Advanced Analytics Dashboard
* Email and SMS Notifications
* Payment Gateway Integration
* Document Upload and Management
* Cloud Deployment Support
* Automated Report Generation

## Learning Outcomes

Through this project, the following concepts were implemented and explored:

* Full-Stack Web Development
* REST API Design
* Database Management with SQLite
* Authentication and Authorization
* CRUD Operations
* Client-Server Architecture
* Secure Application Development

## Author

**Amal Johnson**
B.Tech Information Technology Student
Aspiring Cybersecurity Engineer

## License

This project is developed for educational and learning purposes.
