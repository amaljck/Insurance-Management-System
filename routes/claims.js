const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/connection');

const router = express.Router();

// Get all claims with client and product details
router.get('/', (req, res) => {
    const { status, client_id, product_id } = req.query;
    
    let query = `
        SELECT 
            c.*,
            cl.name as client_name,
            cl.email as client_email,
            p.name as product_name,
            p.type as product_type
        FROM claims c
        INNER JOIN clients cl ON c.client_id = cl.id
        INNER JOIN products p ON c.product_id = p.id
        WHERE 1=1
    `;
    const params = [];

    if (status) {
        query += ' AND c.status = ?';
        params.push(status);
    }

    if (client_id) {
        query += ' AND c.client_id = ?';
        params.push(client_id);
    }

    if (product_id) {
        query += ' AND c.product_id = ?';
        params.push(product_id);
    }

    query += ' ORDER BY c.created_at DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error fetching claims:', err);
            res.status(500).json({ error: 'Failed to fetch claims' });
        } else {
            res.json(rows);
        }
    });
});

// Get claim by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT 
            c.*,
            cl.name as client_name,
            cl.email as client_email,
            cl.phone as client_phone,
            p.name as product_name,
            p.type as product_type,
            p.coverage
        FROM claims c
        INNER JOIN clients cl ON c.client_id = cl.id
        INNER JOIN products p ON c.product_id = p.id
        WHERE c.id = ?
    `;

    db.get(query, [id], (err, row) => {
        if (err) {
            console.error('Error fetching claim:', err);
            res.status(500).json({ error: 'Failed to fetch claim' });
        } else if (!row) {
            res.status(404).json({ error: 'Claim not found' });
        } else {
            res.json(row);
        }
    });
});

// Create new claim
router.post('/', [
    body('client_id').isInt({ min: 1 }).withMessage('Valid client ID is required'),
    body('product_id').isInt({ min: 1 }).withMessage('Valid product ID is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('description').notEmpty().trim().withMessage('Description is required'),
    body('claim_number').optional().trim()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { client_id, product_id, amount, description, claim_number } = req.body;

    // Verify client and product exist and client has an active policy for this product
    const verifyQuery = `
        SELECT 
            c.id as client_id,
            p.id as product_id,
            p.coverage,
            cp.id as policy_id
        FROM clients c
        CROSS JOIN products p
        LEFT JOIN client_products cp ON c.id = cp.client_id AND p.id = cp.product_id AND cp.status = 'active'
        WHERE c.id = ? AND p.id = ?
    `;

    db.get(verifyQuery, [client_id, product_id], (err, verification) => {
        if (err) {
            console.error('Error verifying claim prerequisites:', err);
            return res.status(500).json({ error: 'Failed to verify claim prerequisites' });
        }

        if (!verification) {
            return res.status(404).json({ error: 'Client or product not found' });
        }

        if (!verification.policy_id) {
            return res.status(400).json({ error: 'Client does not have an active policy for this product' });
        }

        if (amount > verification.coverage) {
            return res.status(400).json({ 
                error: 'Claim amount exceeds policy coverage',
                maxCoverage: verification.coverage 
            });
        }

        // Generate claim number if not provided
        const finalClaimNumber = claim_number || `CLM-${Date.now()}`;

        const insertQuery = `
            INSERT INTO claims (client_id, product_id, claim_number, amount, description)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.run(insertQuery, [client_id, product_id, finalClaimNumber, amount, description], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    res.status(409).json({ error: 'Claim number already exists' });
                } else {
                    console.error('Error creating claim:', err);
                    res.status(500).json({ error: 'Failed to create claim' });
                }
            } else {
                // Return the created claim with details
                const fetchQuery = `
                    SELECT 
                        c.*,
                        cl.name as client_name,
                        cl.email as client_email,
                        p.name as product_name,
                        p.type as product_type
                    FROM claims c
                    INNER JOIN clients cl ON c.client_id = cl.id
                    INNER JOIN products p ON c.product_id = p.id
                    WHERE c.id = ?
                `;

                db.get(fetchQuery, [this.lastID], (err, row) => {
                    if (err) {
                        res.status(500).json({ error: 'Claim created but failed to fetch' });
                    } else {
                        res.status(201).json(row);
                    }
                });
            }
        });
    });
});

// Update claim status
router.put('/:id/status', [
    body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),
    body('notes').optional().trim(),
    body('processed_by').optional().isInt({ min: 1 }).withMessage('Valid processor ID required')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, notes, processed_by } = req.body;

    const updateData = {
        status,
        updated_at: new Date().toISOString()
    };

    if (notes) updateData.notes = notes;
    if (processed_by) updateData.processed_by = processed_by;
    if (status !== 'pending') updateData.processed_date = new Date().toISOString().split('T')[0];

    const fields = Object.keys(updateData);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updateData[field]);
    values.push(id);

    const query = `UPDATE claims SET ${setClause} WHERE id = ?`;

    db.run(query, values, function(err) {
        if (err) {
            console.error('Error updating claim status:', err);
            res.status(500).json({ error: 'Failed to update claim status' });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Claim not found' });
        } else {
            // Return updated claim with details
            const fetchQuery = `
                SELECT 
                    c.*,
                    cl.name as client_name,
                    cl.email as client_email,
                    p.name as product_name,
                    p.type as product_type
                FROM claims c
                INNER JOIN clients cl ON c.client_id = cl.id
                INNER JOIN products p ON c.product_id = p.id
                WHERE c.id = ?
            `;

            db.get(fetchQuery, [id], (err, row) => {
                if (err) {
                    res.status(500).json({ error: 'Claim updated but failed to fetch' });
                } else {
                    res.json(row);
                }
            });
        }
    });
});

// Update claim details
router.put('/:id', [
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('description').optional().notEmpty().trim().withMessage('Description cannot be empty'),
    body('notes').optional().trim()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if claim is still pending (only pending claims can be fully updated)
    db.get('SELECT status, product_id FROM claims WHERE id = ?', [id], (err, claim) => {
        if (err) {
            console.error('Error checking claim status:', err);
            return res.status(500).json({ error: 'Failed to check claim status' });
        }

        if (!claim) {
            return res.status(404).json({ error: 'Claim not found' });
        }

        if (claim.status !== 'pending' && updates.amount) {
            return res.status(400).json({ error: 'Cannot modify amount of processed claim' });
        }

        // If amount is being updated, verify it doesn't exceed coverage
        if (updates.amount) {
            db.get('SELECT coverage FROM products WHERE id = ?', [claim.product_id], (err, product) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to verify coverage' });
                }

                if (updates.amount > product.coverage) {
                    return res.status(400).json({ 
                        error: 'Claim amount exceeds policy coverage',
                        maxCoverage: product.coverage 
                    });
                }

                performUpdate();
            });
        } else {
            performUpdate();
        }

        function performUpdate() {
            const fields = Object.keys(updates).filter(key => updates[key] !== undefined);
            if (fields.length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }

            const setClause = fields.map(field => `${field} = ?`).join(', ');
            const values = fields.map(field => updates[field]);
            values.push(id);

            const query = `UPDATE claims SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

            db.run(query, values, function(err) {
                if (err) {
                    console.error('Error updating claim:', err);
                    res.status(500).json({ error: 'Failed to update claim' });
                } else {
                    // Return updated claim with details
                    const fetchQuery = `
                        SELECT 
                            c.*,
                            cl.name as client_name,
                            cl.email as client_email,
                            p.name as product_name,
                            p.type as product_type
                        FROM claims c
                        INNER JOIN clients cl ON c.client_id = cl.id
                        INNER JOIN products p ON c.product_id = p.id
                        WHERE c.id = ?
                    `;

                    db.get(fetchQuery, [id], (err, row) => {
                        if (err) {
                            res.status(500).json({ error: 'Claim updated but failed to fetch' });
                        } else {
                            res.json(row);
                        }
                    });
                }
            });
        }
    });
});

// Delete claim
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    // Check if claim is pending (only pending claims can be deleted)
    db.get('SELECT status FROM claims WHERE id = ?', [id], (err, claim) => {
        if (err) {
            console.error('Error checking claim status:', err);
            return res.status(500).json({ error: 'Failed to check claim status' });
        }

        if (!claim) {
            return res.status(404).json({ error: 'Claim not found' });
        }

        if (claim.status !== 'pending') {
            return res.status(400).json({ error: 'Cannot delete processed claim' });
        }

        db.run('DELETE FROM claims WHERE id = ?', [id], function(err) {
            if (err) {
                console.error('Error deleting claim:', err);
                res.status(500).json({ error: 'Failed to delete claim' });
            } else {
                res.json({ message: 'Claim deleted successfully' });
            }
        });
    });
});

// Get claims statistics
router.get('/stats/summary', (req, res) => {
    const query = `
        SELECT 
            COUNT(*) as total_claims,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_claims,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_claims,
            COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_claims,
            COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) as total_approved_amount,
            COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending_amount
        FROM claims
    `;

    db.get(query, [], (err, row) => {
        if (err) {
            console.error('Error fetching claims statistics:', err);
            res.status(500).json({ error: 'Failed to fetch claims statistics' });
        } else {
            res.json(row);
        }
    });
});

module.exports = router;
