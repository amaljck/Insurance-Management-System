const db = require('./connection');
const bcrypt = require('bcryptjs');

// Function to create default admin user
const createDefaultAdmin = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            // Check if admin user already exists
            db.get('SELECT id FROM users WHERE username = ? OR email = ?', ['admin', 'admin@insurance.com'], async (err, row) => {
                if (err) {
                    console.error('Error checking for admin user:', err);
                    reject(err);
                    return;
                }

                if (row) {
                    console.log('👤 Admin user already exists');
                    resolve();
                    return;
                }

                try {
                    // Hash the password
                    const passwordHash = await bcrypt.hash('admin', 10);
                    
                    // Insert admin user
                    db.run(
                        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                        ['admin', 'admin@insurance.com', passwordHash, 'admin'],
                        function(err) {
                            if (err) {
                                console.error('Error creating admin user:', err);
                                reject(err);
                            } else {
                                console.log('👤 Default admin user created successfully');
                                console.log('📋 Login credentials: username=admin, password=admin');
                                resolve();
                            }
                        }
                    );
                } catch (hashError) {
                    console.error('Error hashing password:', hashError);
                    reject(hashError);
                }
            });
        } catch (error) {
            console.error('Error in createDefaultAdmin:', error);
            reject(error);
        }
    });
};

const initializeDatabase = () => {
    return new Promise((resolve, reject) => {
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON');

        // Create tables
        const createTables = `
            -- Users table for authentication
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'admin',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Products table
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(200) NOT NULL,
                type VARCHAR(50) NOT NULL,
                premium DECIMAL(10,2) NOT NULL,
                coverage DECIMAL(15,2) NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Clients table
            CREATE TABLE IF NOT EXISTS clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(200) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20),
                date_of_birth DATE,
                address TEXT,
                status VARCHAR(20) DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Client Products junction table (many-to-many)
            CREATE TABLE IF NOT EXISTS client_products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                policy_number VARCHAR(50) UNIQUE,
                start_date DATE DEFAULT CURRENT_DATE,
                end_date DATE,
                status VARCHAR(20) DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                UNIQUE(client_id, product_id)
            );

            -- Claims table
            CREATE TABLE IF NOT EXISTS claims (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                claim_number VARCHAR(50) UNIQUE,
                amount DECIMAL(15,2) NOT NULL,
                description TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                submitted_date DATE DEFAULT CURRENT_DATE,
                processed_date DATE,
                processed_by INTEGER,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (processed_by) REFERENCES users(id)
            );

            -- Indexes for better performance
            CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
            CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
            CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
            CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
            CREATE INDEX IF NOT EXISTS idx_claims_client ON claims(client_id);
            CREATE INDEX IF NOT EXISTS idx_claims_product ON claims(product_id);
            CREATE INDEX IF NOT EXISTS idx_client_products_client ON client_products(client_id);
            CREATE INDEX IF NOT EXISTS idx_client_products_product ON client_products(product_id);
        `;

        db.exec(createTables, (err) => {
            if (err) {
                console.error('Error creating tables:', err.message);
                reject(err);
            } else {
                console.log('✅ Database tables created successfully');
                insertSampleData().then(resolve).catch(reject);
            }
        });
    });
};

const insertSampleData = () => {
    return new Promise((resolve, reject) => {
        // Check if data already exists
        db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            if (row.count > 0) {
                console.log('📊 Sample data already exists');
                resolve();
                return;
            }

            // Insert sample data
            const sampleData = `
                -- Insert sample products
                INSERT INTO products (name, type, premium, coverage, description) VALUES
                ('Comprehensive Life Insurance', 'life', 150.00, 500000, 'Complete life coverage with additional benefits for family protection.'),
                ('Premium Health Coverage', 'health', 220.00, 100000, 'Comprehensive health insurance covering major medical expenses.'),
                ('Auto Protection Plus', 'auto', 85.00, 75000, 'Full auto insurance with collision and comprehensive coverage.'),
                ('Home Security Insurance', 'home', 120.00, 300000, 'Complete home protection against damages and theft.'),
                ('Travel Safe Insurance', 'travel', 45.00, 25000, 'International travel insurance with medical and trip coverage.');

                -- Insert sample clients
                INSERT INTO clients (name, email, phone, date_of_birth, address) VALUES
                ('John Smith', 'john.smith@email.com', '(555) 123-4567', '1985-03-15', '123 Main St, City, State 12345'),
                ('Sarah Johnson', 'sarah.j@email.com', '(555) 987-6543', '1990-07-22', '456 Oak Ave, City, State 12345'),
                ('Michael Brown', 'michael.brown@email.com', '(555) 456-7890', '1988-11-08', '789 Pine Rd, City, State 12345'),
                ('Emily Davis', 'emily.davis@email.com', '(555) 321-0987', '1992-05-20', '321 Elm St, City, State 12345');

                -- Insert sample client-product relationships
                INSERT INTO client_products (client_id, product_id, policy_number) VALUES
                (1, 1, 'POL-LIFE-001'),
                (1, 2, 'POL-HEALTH-001'),
                (2, 3, 'POL-AUTO-001'),
                (3, 1, 'POL-LIFE-002'),
                (3, 4, 'POL-HOME-001'),
                (4, 2, 'POL-HEALTH-002'),
                (4, 5, 'POL-TRAVEL-001');

                -- Insert sample claims
                INSERT INTO claims (client_id, product_id, claim_number, amount, description, status, submitted_date) VALUES
                (1, 2, 'CLM-001', 2500.00, 'Medical expenses for routine surgery', 'pending', '2024-10-15'),
                (2, 3, 'CLM-002', 4200.00, 'Vehicle damage from accident', 'approved', '2024-10-10'),
                (3, 4, 'CLM-003', 1500.00, 'Water damage in kitchen', 'pending', '2024-10-12'),
                (4, 5, 'CLM-004', 800.00, 'Flight cancellation compensation', 'approved', '2024-10-08');
            `;

            db.exec(sampleData, async (err) => {
                if (err) {
                    console.error('Error inserting sample data:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Sample data inserted successfully');
                    // Create default admin user
                    await createDefaultAdmin();
                    resolve();
                }
            });
        });
    });
};

// Run initialization if this file is executed directly
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('🎉 Database initialization completed');
            process.exit(0);
        })
        .catch((err) => {
            console.error('❌ Database initialization failed:', err);
            process.exit(1);
        });
}

module.exports = { initializeDatabase };
