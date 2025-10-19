const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const { authenticateToken } = require('./auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all policies with client and product details
router.get('/', (req, res) => {
    const query = `
        SELECT 
            cp.id,
            cp.policy_number,
            cp.start_date,
            cp.end_date,
            CASE 
                WHEN cp.end_date IS NOT NULL AND cp.end_date < DATE('now') AND cp.status = 'active' 
                THEN 'expired'
                ELSE cp.status
            END as status,
            cp.created_at,
            c.name as client_name,
            c.email as client_email,
            c.phone as client_phone,
            p.name as product_name,
            p.type as product_type,
            p.premium as monthly_premium,
            p.coverage
        FROM client_products cp
        INNER JOIN clients c ON cp.client_id = c.id
        INNER JOIN products p ON cp.product_id = p.id
        ORDER BY cp.created_at DESC
    `;

    db.all(query, (err, rows) => {
        if (err) {
            console.error('Error fetching policies:', err);
            return res.status(500).json({ error: 'Failed to fetch policies' });
        }
        res.json(rows);
    });
});

// Get a specific policy by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    
    const query = `
        SELECT 
            cp.id,
            cp.policy_number,
            cp.start_date,
            cp.end_date,
            cp.status,
            cp.created_at,
            cp.client_id,
            cp.product_id,
            c.name as client_name,
            c.email as client_email,
            c.phone as client_phone,
            c.address as client_address,
            p.name as product_name,
            p.type as product_type,
            p.premium as monthly_premium,
            p.coverage,
            p.description as product_description
        FROM client_products cp
        INNER JOIN clients c ON cp.client_id = c.id
        INNER JOIN products p ON cp.product_id = p.id
        WHERE cp.id = ?
    `;

    db.get(query, [id], (err, row) => {
        if (err) {
            console.error('Error fetching policy:', err);
            return res.status(500).json({ error: 'Failed to fetch policy' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Policy not found' });
        }
        
        res.json(row);
    });
});

// Create a new policy
router.post('/', (req, res) => {
    const { client_id, product_id, policy_number, start_date, end_date } = req.body;

    // Validate required fields
    if (!client_id || !product_id) {
        return res.status(400).json({ error: 'Client ID and Product ID are required' });
    }

    // Generate policy number if not provided
    const generatedPolicyNumber = policy_number || `POL-${Date.now()}`;

    const query = `
        INSERT INTO client_products (client_id, product_id, policy_number, start_date, end_date)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(query, [client_id, product_id, generatedPolicyNumber, start_date || new Date().toISOString().split('T')[0], end_date], function(err) {
        if (err) {
            console.error('Error creating policy:', err);
            if (err.code === 'SQLITE_CONSTRAINT') {
                return res.status(400).json({ error: 'Policy number already exists or invalid client/product' });
            }
            return res.status(500).json({ error: 'Failed to create policy' });
        }

        // Fetch the created policy with details
        const fetchQuery = `
            SELECT 
                cp.id,
                cp.policy_number,
                cp.start_date,
                cp.end_date,
                cp.status,
                cp.created_at,
                c.name as client_name,
                c.email as client_email,
                p.name as product_name,
                p.type as product_type,
                p.premium as monthly_premium,
                p.coverage
            FROM client_products cp
            INNER JOIN clients c ON cp.client_id = c.id
            INNER JOIN products p ON cp.product_id = p.id
            WHERE cp.id = ?
        `;

        db.get(fetchQuery, [this.lastID], (err, row) => {
            if (err) {
                console.error('Error fetching created policy:', err);
                return res.status(500).json({ error: 'Policy created but failed to fetch details' });
            }
            res.status(201).json(row);
        });
    });
});

// Update policy status
router.put('/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['active', 'inactive', 'cancelled', 'expired', 'suspended'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
    }

    const query = 'UPDATE client_products SET status = ? WHERE id = ?';

    db.run(query, [status, id], function(err) {
        if (err) {
            console.error('Error updating policy status:', err);
            return res.status(500).json({ error: 'Failed to update policy status' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Policy not found' });
        }

        // Fetch updated policy
        const fetchQuery = `
            SELECT 
                cp.id,
                cp.policy_number,
                cp.start_date,
                cp.end_date,
                cp.status,
                cp.created_at,
                c.name as client_name,
                c.email as client_email,
                p.name as product_name,
                p.type as product_type,
                p.premium as monthly_premium,
                p.coverage
            FROM client_products cp
            INNER JOIN clients c ON cp.client_id = c.id
            INNER JOIN products p ON cp.product_id = p.id
            WHERE cp.id = ?
        `;

        db.get(fetchQuery, [id], (err, row) => {
            if (err) {
                console.error('Error fetching updated policy:', err);
                return res.status(500).json({ error: 'Status updated but failed to fetch details' });
            }
            res.json({ 
                message: 'Policy status updated successfully',
                policy: row
            });
        });
    });
});

// Update policy details
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { policy_number, start_date, end_date, status } = req.body;

    // Validate status if provided
    if (status) {
        const validStatuses = ['active', 'inactive', 'cancelled', 'expired', 'suspended'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
            });
        }
    }

    const query = `
        UPDATE client_products 
        SET policy_number = COALESCE(?, policy_number),
            start_date = COALESCE(?, start_date),
            end_date = COALESCE(?, end_date),
            status = COALESCE(?, status)
        WHERE id = ?
    `;

    db.run(query, [policy_number, start_date, end_date, status, id], function(err) {
        if (err) {
            console.error('Error updating policy:', err);
            if (err.code === 'SQLITE_CONSTRAINT') {
                return res.status(400).json({ error: 'Policy number already exists' });
            }
            return res.status(500).json({ error: 'Failed to update policy' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Policy not found' });
        }

        // Fetch updated policy
        const fetchQuery = `
            SELECT 
                cp.id,
                cp.policy_number,
                cp.start_date,
                cp.end_date,
                cp.status,
                cp.created_at,
                c.name as client_name,
                c.email as client_email,
                p.name as product_name,
                p.type as product_type,
                p.premium as monthly_premium,
                p.coverage
            FROM client_products cp
            INNER JOIN clients c ON cp.client_id = c.id
            INNER JOIN products p ON cp.product_id = p.id
            WHERE cp.id = ?
        `;

        db.get(fetchQuery, [id], (err, row) => {
            if (err) {
                console.error('Error fetching updated policy:', err);
                return res.status(500).json({ error: 'Policy updated but failed to fetch details' });
            }
            res.json(row);
        });
    });
});

// Delete a policy
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM client_products WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Error deleting policy:', err);
            return res.status(500).json({ error: 'Failed to delete policy' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Policy not found' });
        }

        res.json({ message: 'Policy deleted successfully' });
    });
});

// Search policies
router.get('/search/:term', (req, res) => {
    const { term } = req.params;
    const searchTerm = `%${term}%`;

    const query = `
        SELECT 
            cp.id,
            cp.policy_number,
            cp.start_date,
            cp.end_date,
            cp.status,
            cp.created_at,
            c.name as client_name,
            c.email as client_email,
            c.phone as client_phone,
            p.name as product_name,
            p.type as product_type,
            p.premium as monthly_premium,
            p.coverage
        FROM client_products cp
        INNER JOIN clients c ON cp.client_id = c.id
        INNER JOIN products p ON cp.product_id = p.id
        WHERE cp.policy_number LIKE ? 
           OR c.name LIKE ? 
           OR c.email LIKE ?
           OR p.name LIKE ?
           OR cp.status LIKE ?
        ORDER BY cp.created_at DESC
    `;

    db.all(query, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm], (err, rows) => {
        if (err) {
            console.error('Error searching policies:', err);
            return res.status(500).json({ error: 'Failed to search policies' });
        }
        res.json(rows);
    });
});

// Renew policy (extend end date)
router.put('/:id/renew', (req, res) => {
    const { id } = req.params;
    const { renewal_period_months = 12, new_end_date } = req.body;

    // Calculate new end date if not provided
    let endDate = new_end_date;
    if (!endDate) {
        const currentDate = new Date();
        currentDate.setMonth(currentDate.getMonth() + renewal_period_months);
        endDate = currentDate.toISOString().split('T')[0];
    }

    const query = `
        UPDATE client_products 
        SET end_date = ?, 
            status = 'active',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    db.run(query, [endDate, id], function(err) {
        if (err) {
            console.error('Error renewing policy:', err);
            return res.status(500).json({ error: 'Failed to renew policy' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Policy not found' });
        }

        // Fetch updated policy
        const fetchQuery = `
            SELECT 
                cp.id,
                cp.policy_number,
                cp.start_date,
                cp.end_date,
                cp.status,
                cp.created_at,
                c.name as client_name,
                c.email as client_email,
                p.name as product_name,
                p.type as product_type,
                p.premium as monthly_premium,
                p.coverage
            FROM client_products cp
            INNER JOIN clients c ON cp.client_id = c.id
            INNER JOIN products p ON cp.product_id = p.id
            WHERE cp.id = ?
        `;

        db.get(fetchQuery, [id], (err, row) => {
            if (err) {
                console.error('Error fetching renewed policy:', err);
                return res.status(500).json({ error: 'Policy renewed but failed to fetch details' });
            }
            res.json({ 
                message: 'Policy renewed successfully',
                policy: row
            });
        });
    });
});

// Get policies by status
router.get('/status/:status', (req, res) => {
    const { status } = req.params;

    const query = `
        SELECT 
            cp.id,
            cp.policy_number,
            cp.start_date,
            cp.end_date,
            cp.status,
            cp.created_at,
            c.name as client_name,
            c.email as client_email,
            c.phone as client_phone,
            p.name as product_name,
            p.type as product_type,
            p.premium as monthly_premium,
            p.coverage
        FROM client_products cp
        INNER JOIN clients c ON cp.client_id = c.id
        INNER JOIN products p ON cp.product_id = p.id
        WHERE cp.status = ?
        ORDER BY cp.created_at DESC
    `;

    db.all(query, [status], (err, rows) => {
        if (err) {
            console.error('Error fetching policies by status:', err);
            return res.status(500).json({ error: 'Failed to fetch policies' });
        }
        res.json(rows);
    });
});

module.exports = router;
