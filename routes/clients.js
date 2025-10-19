const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/connection');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all clients with their policy count
router.get('/', (req, res) => {
    const { status } = req.query;
    let query = `
        SELECT 
            c.*,
            COUNT(cp.id) as policies
        FROM clients c
        LEFT JOIN client_products cp ON c.id = cp.client_id AND cp.status = 'active'
        WHERE 1=1
    `;
    const params = [];

    if (status) {
        query += ' AND c.status = ?';
        params.push(status);
    }

    query += ' GROUP BY c.id ORDER BY c.created_at DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error fetching clients:', err);
            res.status(500).json({ error: 'Failed to fetch clients' });
        } else {
            res.json(rows);
        }
    });
});

// Get client by ID with their policies
router.get('/:id', (req, res) => {
    const { id } = req.params;

    const clientQuery = `
        SELECT 
            c.*,
            COUNT(cp.id) as policies
        FROM clients c
        LEFT JOIN client_products cp ON c.id = cp.client_id AND cp.status = 'active'
        WHERE c.id = ?
        GROUP BY c.id
    `;

    db.get(clientQuery, [id], (err, client) => {
        if (err) {
            console.error('Error fetching client:', err);
            res.status(500).json({ error: 'Failed to fetch client' });
        } else if (!client) {
            res.status(404).json({ error: 'Client not found' });
        } else {
            // Get client's policies
            const policiesQuery = `
                SELECT 
                    cp.*,
                    p.name as product_name,
                    p.type as product_type,
                    p.premium,
                    p.coverage
                FROM client_products cp
                INNER JOIN products p ON cp.product_id = p.id
                WHERE cp.client_id = ?
                ORDER BY cp.created_at DESC
            `;

            db.all(policiesQuery, [id], (err, policies) => {
                if (err) {
                    console.error('Error fetching client policies:', err);
                    res.status(500).json({ error: 'Failed to fetch client policies' });
                } else {
                    res.json({ ...client, clientPolicies: policies });
                }
            });
        }
    });
});

// Create new client
router.post('/', [
    body('name').notEmpty().trim().withMessage('Client name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').optional().trim(),
    body('date_of_birth').optional().isDate().withMessage('Valid date of birth required'),
    body('address').optional().trim()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, date_of_birth, address } = req.body;

    const query = `
        INSERT INTO clients (name, email, phone, date_of_birth, address)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(query, [name, email, phone, date_of_birth, address], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(409).json({ error: 'Email already exists' });
            } else {
                console.error('Error creating client:', err);
                res.status(500).json({ error: 'Failed to create client' });
            }
        } else {
            // Return the created client
            db.get('SELECT *, 0 as policies FROM clients WHERE id = ?', [this.lastID], (err, row) => {
                if (err) {
                    res.status(500).json({ error: 'Client created but failed to fetch' });
                } else {
                    res.status(201).json(row);
                }
            });
        }
    });
});

// Update client status
router.put('/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['active', 'inactive'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
    }

    const query = 'UPDATE clients SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';

    db.run(query, [status, id], function(err) {
        if (err) {
            console.error('Error updating client status:', err);
            return res.status(500).json({ error: 'Failed to update client status' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // Fetch updated client with policy count
        const fetchQuery = `
            SELECT 
                c.*,
                COUNT(cp.id) as policies
            FROM clients c
            LEFT JOIN client_products cp ON c.id = cp.client_id AND cp.status = 'active'
            WHERE c.id = ?
            GROUP BY c.id
        `;

        db.get(fetchQuery, [id], (err, row) => {
            if (err) {
                console.error('Error fetching updated client:', err);
                return res.status(500).json({ error: 'Status updated but failed to fetch details' });
            }
            res.json({ 
                message: 'Client status updated successfully',
                client: row
            });
        });
    });
});

// Update client
router.put('/:id', [
    body('name').optional().notEmpty().trim().withMessage('Client name cannot be empty'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
    body('phone').optional().trim(),
    body('date_of_birth').optional().isDate().withMessage('Valid date of birth required'),
    body('address').optional().trim(),
    body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const fields = Object.keys(updates).filter(key => updates[key] !== undefined);
    if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(id);

    const query = `UPDATE clients SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    db.run(query, values, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(409).json({ error: 'Email already exists' });
            } else {
                console.error('Error updating client:', err);
                res.status(500).json({ error: 'Failed to update client' });
            }
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Client not found' });
        } else {
            // Return updated client with policy count
            const clientQuery = `
                SELECT 
                    c.*,
                    COUNT(cp.id) as policies
                FROM clients c
                LEFT JOIN client_products cp ON c.id = cp.client_id AND cp.status = 'active'
                WHERE c.id = ?
                GROUP BY c.id
            `;
            
            db.get(clientQuery, [id], (err, row) => {
                if (err) {
                    res.status(500).json({ error: 'Client updated but failed to fetch' });
                } else {
                    res.json(row);
                }
            });
        }
    });
});

// Delete client
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    // Check if client has active policies or claims
    const checkQuery = `
        SELECT 
            (SELECT COUNT(*) FROM client_products WHERE client_id = ? AND status = 'active') as active_policies,
            (SELECT COUNT(*) FROM claims WHERE client_id = ? AND status = 'pending') as pending_claims
    `;

    db.get(checkQuery, [id, id], (err, row) => {
        if (err) {
            console.error('Error checking client dependencies:', err);
            return res.status(500).json({ error: 'Failed to check client dependencies' });
        }

        if (row.active_policies > 0 || row.pending_claims > 0) {
            return res.status(409).json({ 
                error: 'Cannot delete client with active policies or pending claims',
                activePolicies: row.active_policies,
                pendingClaims: row.pending_claims
            });
        }

        // Safe to delete
        db.run('DELETE FROM clients WHERE id = ?', [id], function(err) {
            if (err) {
                console.error('Error deleting client:', err);
                res.status(500).json({ error: 'Failed to delete client' });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Client not found' });
            } else {
                res.json({ message: 'Client deleted successfully' });
            }
        });
    });
});

// Search clients
router.get('/search/:term', (req, res) => {
    const { term } = req.params;
    const searchTerm = `%${term}%`;

    const query = `
        SELECT 
            c.*,
            COUNT(cp.id) as policies
        FROM clients c
        LEFT JOIN client_products cp ON c.id = cp.client_id AND cp.status = 'active'
        WHERE (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)
        GROUP BY c.id
        ORDER BY c.name
    `;

    db.all(query, [searchTerm, searchTerm, searchTerm], (err, rows) => {
        if (err) {
            console.error('Error searching clients:', err);
            res.status(500).json({ error: 'Failed to search clients' });
        } else {
            res.json(rows);
        }
    });
});

// Add policy to client
router.post('/:id/policies', [
    body('product_id').isInt({ min: 1 }).withMessage('Valid product ID is required'),
    body('policy_number').optional().trim(),
    body('start_date').optional().isDate().withMessage('Valid start date required'),
    body('end_date').optional().isDate().withMessage('Valid end date required')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { product_id, policy_number, start_date, end_date } = req.body;

    // Generate policy number if not provided
    const finalPolicyNumber = policy_number || `POL-${Date.now()}`;

    const query = `
        INSERT INTO client_products (client_id, product_id, policy_number, start_date, end_date)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(query, [id, product_id, finalPolicyNumber, start_date, end_date], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(409).json({ error: 'Policy already exists for this client and product' });
            } else {
                console.error('Error adding policy:', err);
                res.status(500).json({ error: 'Failed to add policy' });
            }
        } else {
            // Return the created policy with product details
            const policyQuery = `
                SELECT 
                    cp.*,
                    p.name as product_name,
                    p.type as product_type,
                    p.premium,
                    p.coverage
                FROM client_products cp
                INNER JOIN products p ON cp.product_id = p.id
                WHERE cp.id = ?
            `;

            db.get(policyQuery, [this.lastID], (err, row) => {
                if (err) {
                    res.status(500).json({ error: 'Policy created but failed to fetch' });
                } else {
                    res.status(201).json(row);
                }
            });
        }
    });
});

// Remove policy from client
router.delete('/:id/policies/:policyId', (req, res) => {
    const { id, policyId } = req.params;

    db.run('DELETE FROM client_products WHERE id = ? AND client_id = ?', [policyId, id], function(err) {
        if (err) {
            console.error('Error removing policy:', err);
            res.status(500).json({ error: 'Failed to remove policy' });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Policy not found' });
        } else {
            res.json({ message: 'Policy removed successfully' });
        }
    });
});

module.exports = router;
