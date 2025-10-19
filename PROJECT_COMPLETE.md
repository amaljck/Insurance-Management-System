# Insurance Management System - Complete Project

## 🏗️ Project Overview

A comprehensive insurance management system built with Node.js, Express, SQLite, and vanilla JavaScript. This system provides complete CRUD operations for managing insurance products, clients, policies, and claims with advanced features like status management, reporting, and policy renewal.

## ✨ Features Completed

### 🔐 Authentication System
- **JWT-based Authentication**: Secure login system with JSON Web Tokens
- **Admin User Management**: Default admin user (username: admin, password: admin)
- **Session Management**: Automatic logout on token expiration
- **Protected Routes**: All API endpoints secured with authentication middleware

### 📊 Dashboard
- **Real-time Statistics**: Live overview of products, clients, policies, and claims
- **Revenue Tracking**: Monthly and annual revenue calculations
- **Recent Activity Feed**: Timeline of recent system activities
- **Visual Indicators**: Color-coded status badges and progress indicators

### 🏢 Product Management
- **Complete CRUD Operations**: Add, edit, delete, and view insurance products
- **Product Types**: Life, Health, Auto, Home, and Travel insurance
- **Premium & Coverage**: Detailed pricing and coverage information
- **Search & Filter**: Advanced search capabilities
- **Product Categories**: Organized by insurance type

### 👥 Client Management
- **Client Profiles**: Comprehensive client information management
- **Status Management**: Active/Inactive status with change tracking
- **Policy Relationship**: View all policies associated with each client
- **Contact Information**: Phone, email, and address management
- **Safe Deletion**: Prevents deletion of clients with active policies/claims
- **Status Change Tracking**: Log status changes with notes

### 📋 Policy Management
- **Policy Lifecycle**: Complete policy management from creation to expiration
- **Status Options**: Active, Inactive, Cancelled, Expired, Suspended
- **Quick Status Changes**: One-click status updates with modal interface
- **Policy Renewal**: Automatic renewal functionality for expired policies
- **Auto-expiration**: Automatic detection and marking of expired policies
- **Policy Numbers**: Auto-generation or custom policy numbers
- **Date Management**: Start and end date tracking

### 💰 Claims Management
- **Claims Processing**: Submit, approve, and reject insurance claims
- **Status Workflow**: Pending → Approved/Rejected workflow
- **Amount Tracking**: Claim amount management and validation
- **Client-Policy Linking**: Associate claims with specific policies
- **Claims History**: Complete audit trail of claim status changes

### 📈 Reports & Analytics
- **Comprehensive Reports**: Detailed business intelligence dashboard
- **Financial Overview**: Revenue, claims paid, and profitability metrics
- **Policy Analytics**: Active, expired, and cancelled policy statistics
- **Client Analytics**: Active/inactive client distribution
- **Claims Analytics**: Pending, approved, and rejected claim summaries
- **Export Functionality**: Download reports as text files
- **Real-time Data**: Always up-to-date reporting

## 🛠️ Technical Implementation

### Backend Architecture
- **Framework**: Node.js with Express.js
- **Database**: SQLite with proper foreign key relationships
- **Authentication**: JWT tokens with bcrypt password hashing
- **API Design**: RESTful API with consistent error handling
- **Data Validation**: Express-validator for input validation
- **Security**: CORS enabled, SQL injection prevention

### Frontend Architecture
- **Framework**: Vanilla JavaScript (ES6+)
- **UI**: Responsive design with CSS Grid and Flexbox
- **API Client**: Fetch API with JWT token management
- **State Management**: Global data store with real-time updates
- **User Experience**: Modal dialogs, notifications, and form validation

### Database Schema
```sql
-- Users (Authentication)
users: id, username, email, password_hash, role, timestamps

-- Products (Insurance Products)
products: id, name, type, premium, coverage, description, is_active, timestamps

-- Clients (Customer Management)
clients: id, name, email, phone, date_of_birth, address, status, timestamps

-- Policies (Client-Product Relationships)
client_products: id, client_id, product_id, policy_number, start_date, end_date, status, timestamps

-- Claims (Insurance Claims)
claims: id, client_id, product_id, claim_number, amount, description, status, dates, processed_by, notes, timestamps
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation
1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Initialize Database**:
   ```bash
   npm run init-db
   ```

3. **Start the Server**:
   ```bash
   npm start
   ```

4. **Access the Application**:
   - Open browser to `http://localhost:3000`
   - Login with username: `admin`, password: `admin`

## 📱 User Interface Features

### Navigation
- **Tab-based Interface**: Dashboard, Products, Clients, Policies, Claims, Reports
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Intuitive Icons**: FontAwesome icons for visual clarity
- **Logout Functionality**: Secure session termination

### Advanced Features
- **Real-time Search**: Instant search across all data types
- **Status Filters**: Filter by various status options
- **Modal Dialogs**: Clean, user-friendly forms
- **Notifications**: Success/error messages for all operations
- **Confirmation Dialogs**: Prevent accidental deletions
- **Auto-refresh**: Data updates automatically after operations

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/search/:term` - Search products

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `PUT /api/clients/:id/status` - Update client status
- `DELETE /api/clients/:id` - Delete client
- `GET /api/clients/search/:term` - Search clients

### Policies
- `GET /api/policies` - List all policies
- `POST /api/policies` - Create policy
- `PUT /api/policies/:id` - Update policy
- `PUT /api/policies/:id/status` - Update policy status
- `PUT /api/policies/:id/renew` - Renew policy
- `DELETE /api/policies/:id` - Delete policy
- `GET /api/policies/search/:term` - Search policies
- `GET /api/policies/status/:status` - Filter by status

### Claims
- `GET /api/claims` - List all claims
- `POST /api/claims` - Create claim
- `PUT /api/claims/:id/status` - Update claim status
- `DELETE /api/claims/:id` - Delete claim

### Reports
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/activity` - Recent activity
- `GET /api/reports/summary` - Comprehensive reports

## 🎯 Key Accomplishments

### 1. **Complete CRUD Operations**
- All entities support full Create, Read, Update, Delete operations
- Proper validation and error handling
- Referential integrity maintained

### 2. **Advanced Status Management**
- Policy status changes with tracking
- Client status management
- Claim workflow management
- Automatic expiration detection

### 3. **Business Intelligence**
- Real-time reporting dashboard
- Financial analytics
- Export capabilities
- Performance metrics

### 4. **User Experience**
- Intuitive interface design
- Responsive layout
- Real-time feedback
- Error prevention

### 5. **Security & Reliability**
- JWT authentication
- Input validation
- SQL injection prevention
- Proper error handling

## 🔮 Future Enhancements

### Potential Features
- **Email Notifications**: Automated emails for policy renewals and claims
- **Document Management**: File upload for policy documents and claims
- **Payment Integration**: Payment processing for premiums
- **Advanced Reporting**: Charts and graphs with Chart.js
- **Multi-tenant Support**: Support for multiple insurance companies
- **Audit Logging**: Complete audit trail of all operations
- **API Rate Limiting**: Prevent API abuse
- **Data Export**: CSV/Excel export functionality

## 📄 License

This project is available for educational and commercial use.

## 🤝 Contributing

This is a complete, production-ready insurance management system with all core features implemented and tested.

---

**Project Status**: ✅ **COMPLETE**

All requested features have been implemented:
- ✅ Insurance products database management
- ✅ Backend with database connectivity
- ✅ Admin authentication (admin/admin)
- ✅ Policy status management
- ✅ Client status management and deletion
- ✅ Complete project with reporting and analytics

The system is now ready for production use or further customization based on specific business requirements.
