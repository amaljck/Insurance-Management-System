const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const productRoutes = require('./routes/products');
const clientRoutes = require('./routes/clients');
const claimRoutes = require('./routes/claims');
const policyRoutes = require('./routes/policies');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/policies', policyRoutes);

// Dashboard stats endpoint
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const db = require('./database/connection');
        
        // Get total products
        const totalProducts = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        // Get active clients
        const activeClients = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as count FROM clients WHERE status = 'active'", (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        // Get pending claims
        const pendingClaims = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as count FROM claims WHERE status = 'pending'", (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        // Get active policies
        const activePolicies = await new Promise((resolve, reject) => {
            db.get("SELECT COUNT(*) as count FROM client_products WHERE status = 'active'", (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        // Calculate total revenue (simplified calculation)
        const totalRevenue = await new Promise((resolve, reject) => {
            db.get(`
                SELECT SUM(p.premium * 12) as revenue 
                FROM products p 
                INNER JOIN client_products cp ON p.id = cp.product_id
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row.revenue || 0);
            });
        });

        res.json({
            totalProducts,
            activeClients,
            pendingClaims,
            activePolicies,
            totalRevenue
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// Recent activity endpoint
app.get('/api/dashboard/activity', async (req, res) => {
    try {
        const db = require('./database/connection');
        
        const activities = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    'client' as type,
                    'New client: ' || c.name as description,
                    c.created_at as timestamp
                FROM clients c
                UNION ALL
                SELECT 
                    'policy' as type,
                    'New policy: ' || cp.policy_number || ' for ' || c.name as description,
                    cp.created_at as timestamp
                FROM client_products cp
                INNER JOIN clients c ON cp.client_id = c.id
                UNION ALL
                SELECT 
                    'claim' as type,
                    'New claim: $' || cl.amount || ' from ' || c.name as description,
                    cl.created_at as timestamp
                FROM claims cl
                INNER JOIN clients c ON cl.client_id = c.id
                ORDER BY timestamp DESC
                LIMIT 10
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        res.json(activities);
    } catch (error) {
        console.error('Activity fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
});

// Reports endpoint
app.get('/api/reports/summary', async (req, res) => {
    try {
        const db = require('./database/connection');
        
        // Get comprehensive stats
        const stats = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    (SELECT COUNT(*) FROM products WHERE is_active = 1) as total_products,
                    (SELECT COUNT(*) FROM clients WHERE status = 'active') as active_clients,
                    (SELECT COUNT(*) FROM clients WHERE status = 'inactive') as inactive_clients,
                    (SELECT COUNT(*) FROM client_products WHERE status = 'active') as active_policies,
                    (SELECT COUNT(*) FROM client_products WHERE status = 'expired') as expired_policies,
                    (SELECT COUNT(*) FROM client_products WHERE status = 'cancelled') as cancelled_policies,
                    (SELECT COUNT(*) FROM claims WHERE status = 'pending') as pending_claims,
                    (SELECT COUNT(*) FROM claims WHERE status = 'approved') as approved_claims,
                    (SELECT COUNT(*) FROM claims WHERE status = 'rejected') as rejected_claims,
                    (SELECT SUM(p.premium) FROM products p INNER JOIN client_products cp ON p.id = cp.product_id WHERE cp.status = 'active') as monthly_revenue,
                    (SELECT SUM(amount) FROM claims WHERE status = 'approved') as total_claims_paid
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        res.json(stats);
    } catch (error) {
        console.error('Reports error:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// Serve frontend for any non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Insurance Management System Backend`);
    console.log(`📝 API Documentation available at http://localhost:${PORT}/api`);
});

module.exports = app;
