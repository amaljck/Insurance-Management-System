# Insurance Products Management System

A full-stack web application for managing insurance products, clients, and claims. This system provides a modern, user-friendly interface with a robust backend API and database integration.

## Features

### 🏠 Dashboard
- Overview of key metrics (products, clients, claims, revenue)
- Recent activity feed
- Real-time statistics from database

### 📦 Products Management
- Add, edit, and delete insurance products
- Multiple insurance types (Life, Health, Auto, Home, Travel)
- Search functionality
- Product details including premiums and coverage amounts

### 👥 Client Management
- Complete client database with SQLite backend
- Client information including contact details and policies
- Search and filter capabilities
- Client status tracking

### 📋 Claims Management
- Claims processing and status tracking
- Approve/reject claims workflow
- Filter by status and date
- Claim amount tracking with validation

## Technology Stack

### Backend
- **Runtime**: Node.js with Express.js framework
- **Database**: SQLite3 with proper schema design
- **Authentication**: JWT tokens with bcrypt password hashing
- **Validation**: Express-validator for API input validation
- **Security**: CORS enabled, environment variables

### Frontend
- **Core**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Modern CSS with Flexbox and Grid
- **Icons**: Font Awesome 6
- **API**: Fetch API with error handling
- **Responsive**: Mobile-first design

### Database Schema
- **Products**: Insurance products with types, premiums, coverage
- **Clients**: Customer information and status tracking
- **Claims**: Claims with status workflow and validation
- **Client_Products**: Many-to-many relationship for policies
- **Users**: Authentication and authorization

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. **Navigate to project directory**
   ```bash
   cd c:\Users\Admin\Documents\Insurance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize database**
   ```bash
   npm run init-db
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access the application**
   Open your browser and go to: `http://localhost:3000`

### Development Mode
For development with auto-restart:
```bash
npm run dev
```

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/search/:term` - Search products

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client
- `GET /api/clients/search/:term` - Search clients

### Claims
- `GET /api/claims` - Get all claims
- `POST /api/claims` - Create new claim
- `PUT /api/claims/:id/status` - Update claim status
- `DELETE /api/claims/:id` - Delete claim

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/activity` - Get recent activity

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/setup` - Create default admin user

## File Structure

```
Insurance/
├── server.js              # Main server file
├── package.json           # Node.js dependencies and scripts
├── .env                   # Environment variables
├── README.md             # This file
├── database/
│   ├── connection.js     # Database connection setup
│   └── init.js          # Database initialization and sample data
├── routes/
│   ├── products.js      # Product API routes
│   ├── clients.js       # Client API routes
│   ├── claims.js        # Claims API routes
│   └── auth.js          # Authentication routes
└── public/
    ├── index.html       # Main application file
    ├── styles.css       # Application styling
    └── script.js        # Frontend JavaScript with API integration
```

## Database Features

### SQLite Database
- **File**: `database/insurance.db`
- **Foreign Keys**: Enabled for data integrity
- **Indexes**: Optimized for common queries
- **Constraints**: Proper validation and relationships

### Sample Data
The system comes pre-loaded with:
- 5 insurance products (Life, Health, Auto, Home, Travel)
- 4 sample clients
- 4 sample claims with different statuses
- Proper relationships between clients, products, and claims

## Usage

### Adding Products
1. Navigate to the **Products** tab
2. Click **Add Product**
3. Fill in product details (name, type, premium, coverage)
4. Save the product

### Managing Clients
1. Go to the **Clients** tab
2. Click **Add Client** to register new clients
3. Use the search bar to find specific clients
4. Edit or delete client records as needed

### Processing Claims
1. Access the **Claims** tab
2. Click **New Claim** to submit a claim
3. Select client and product from dropdowns
4. Approve or reject pending claims
5. Use filters to view specific claim types

## Environment Variables

Create or modify `.env` file for configuration:

```env
PORT=3000
NODE_ENV=development
DB_PATH=./database/insurance.db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000
BCRYPT_SALT_ROUNDS=10
```

## Security Features

- **Password Hashing**: bcrypt with configurable salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Configurable cross-origin requests
- **Environment Variables**: Sensitive data in .env file

## Error Handling

- **API Errors**: Comprehensive error responses with proper HTTP status codes
- **Frontend Notifications**: User-friendly success/error messages
- **Database Errors**: Proper error handling and logging
- **Validation Errors**: Clear validation feedback

## Browser Compatibility

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Future Enhancements

### Planned Features
- User role-based access control
- Advanced reporting and analytics
- Email/SMS notifications
- Payment processing integration
- Document management system
- Multi-language support
- Real-time updates with WebSockets
- Data export/import functionality

### Technical Improvements
- Database migrations system
- API rate limiting
- Comprehensive logging
- Unit and integration tests
- Docker containerization
- Cloud deployment configurations

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run init-db` - Initialize database

### Adding New Features
1. Backend: Add routes in `routes/` directory
2. Database: Update schema in `database/init.js`
3. Frontend: Update `public/script.js` for API calls
4. Styling: Update `public/styles.css`

## Troubleshooting

### Common Issues

1. **Database not found**
   ```bash
   npm run init-db
   ```

2. **Port already in use**
   - Change PORT in `.env` file
   - Or kill process: `netstat -ano | findstr :3000`

3. **Dependencies issues**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Create Pull Request

## License

This project is open source and available under the MIT License.

## Support

For questions or support:
- Check the troubleshooting section
- Create an issue in the repository
- Contact the development team

---

**Note**: This is a full-stack demonstration application. For production use, implement additional security measures, comprehensive testing, and proper deployment practices.
