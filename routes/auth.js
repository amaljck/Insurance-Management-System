const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../database/connection');

const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Register new user (admin only in production)
router.post('/register', [
    body('username').isLength({ min: 3 }).trim().withMessage('Username must be at least 3 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'agent']).withMessage('Invalid role')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role = 'admin' } = req.body;

    try {
        // Check if user already exists
        const existingUser = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (existingUser) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const insertUser = await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                [username, email, passwordHash, role],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        // Generate JWT token
        const token = jwt.sign(
            { id: insertUser, username, email, role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: insertUser, username, email, role }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Login
router.post('/login', [
    body('username').notEmpty().trim().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
        // Find user
        const user = await new Promise((resolve, reject) => {
            db.get(
                'SELECT id, username, email, password_hash, role FROM users WHERE username = ? OR email = ?',
                [username, username],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const passwordValid = await bcrypt.compare(password, user.password_hash);
        if (!passwordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email, 
                role: user.role 
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// Verify token and get current user
router.get('/me', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

// Change password
router.put('/change-password', authenticateToken, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
        // Get current user's password hash
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT password_hash FROM users WHERE id = ?', [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const passwordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!passwordValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newPasswordHash, userId],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Logout (client-side should remove token)
router.post('/logout', authenticateToken, (req, res) => {
    res.json({ message: 'Logout successful' });
});

// Create default admin user (for initial setup)
router.post('/setup', async (req, res) => {
    try {
        // Check if any users exist
        const userCount = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        if (userCount > 0) {
            return res.status(409).json({ error: 'Users already exist in the system' });
        }

        // Create default admin user
        const defaultPassword = 'admin123';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        const adminId = await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                ['admin', 'admin@insurance.com', passwordHash, 'admin'],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        res.status(201).json({
            message: 'Default admin user created successfully',
            credentials: {
                username: 'admin',
                password: defaultPassword,
                note: 'Please change this password immediately after first login'
            }
        });

    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ error: 'Failed to create default user' });
    }
});

// Export middleware for use in other routes
module.exports = router;
module.exports.authenticateToken = authenticateToken;
