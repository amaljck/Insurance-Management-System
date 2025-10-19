const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/connection');

const router = express.Router();

// Get all products
router.get('/', (req, res) => {
    const { type, active } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (type) {
        query += ' AND type = ?';
        params.push(type);
    }

    if (active !== undefined) {
        query += ' AND is_active = ?';
        params.push(active === 'true' ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error fetching products:', err);
            res.status(500).json({ error: 'Failed to fetch products' });
        } else {
            res.json(rows);
        }
    });
});

// Get product by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error fetching product:', err);
            res.status(500).json({ error: 'Failed to fetch product' });
        } else if (!row) {
            res.status(404).json({ error: 'Product not found' });
        } else {
            res.json(row);
        }
    });
});

// Create new product
router.post('/', [
    body('name').notEmpty().trim().withMessage('Product name is required'),
    body('type').isIn(['life', 'health', 'auto', 'home', 'travel']).withMessage('Invalid product type'),
    body('premium').isFloat({ min: 0 }).withMessage('Premium must be a positive number'),
    body('coverage').isFloat({ min: 0 }).withMessage('Coverage must be a positive number'),
    body('description').optional().trim()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, premium, coverage, description } = req.body;

    const query = `
        INSERT INTO products (name, type, premium, coverage, description)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(query, [name, type, premium, coverage, description], function(err) {
        if (err) {
            console.error('Error creating product:', err);
            res.status(500).json({ error: 'Failed to create product' });
        } else {
            // Return the created product
            db.get('SELECT * FROM products WHERE id = ?', [this.lastID], (err, row) => {
                if (err) {
                    res.status(500).json({ error: 'Product created but failed to fetch' });
                } else {
                    res.status(201).json(row);
                }
            });
        }
    });
});

// Update product
router.put('/:id', [
    body('name').optional().notEmpty().trim().withMessage('Product name cannot be empty'),
    body('type').optional().isIn(['life', 'health', 'auto', 'home', 'travel']).withMessage('Invalid product type'),
    body('premium').optional().isFloat({ min: 0 }).withMessage('Premium must be a positive number'),
    body('coverage').optional().isFloat({ min: 0 }).withMessage('Coverage must be a positive number'),
    body('description').optional().trim()
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

    const query = `UPDATE products SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    db.run(query, values, function(err) {
        if (err) {
            console.error('Error updating product:', err);
            res.status(500).json({ error: 'Failed to update product' });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Product not found' });
        } else {
            // Return updated product
            db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
                if (err) {
                    res.status(500).json({ error: 'Product updated but failed to fetch' });
                } else {
                    res.json(row);
                }
            });
        }
    });
});

// Delete product
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    // Check if product has active policies
    db.get('SELECT COUNT(*) as count FROM client_products WHERE product_id = ? AND status = "active"', [id], (err, row) => {
        if (err) {
            console.error('Error checking product dependencies:', err);
            return res.status(500).json({ error: 'Failed to check product dependencies' });
        }

        if (row.count > 0) {
            return res.status(409).json({ 
                error: 'Cannot delete product with active policies',
                activePoliciessCount: row.count 
            });
        }

        // Safe to delete
        db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
            if (err) {
                console.error('Error deleting product:', err);
                res.status(500).json({ error: 'Failed to delete product' });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Product not found' });
            } else {
                res.json({ message: 'Product deleted successfully' });
            }
        });
    });
});

// Search products
router.get('/search/:term', (req, res) => {
    const { term } = req.params;
    const searchTerm = `%${term}%`;

    const query = `
        SELECT * FROM products 
        WHERE (name LIKE ? OR type LIKE ? OR description LIKE ?) 
        AND is_active = 1
        ORDER BY name
    `;

    db.all(query, [searchTerm, searchTerm, searchTerm], (err, rows) => {
        if (err) {
            console.error('Error searching products:', err);
            res.status(500).json({ error: 'Failed to search products' });
        } else {
            res.json(rows);
        }
    });
});

module.exports = router;
