// Database simulation using localStorage
class Database {
    constructor() {
        this.products = this.getFromStorage('products') || [];
        this.clients = this.getFromStorage('clients') || [];
        this.claims = this.getFromStorage('claims') || [];
        
        // Initialize with sample data if empty
        if (this.products.length === 0) {
            this.initializeSampleData();
        }
    }

    getFromStorage(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch (e) {
            return [];
        }
    }

    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    initializeSampleData() {
        this.products = [
            {
                id: 1,
                name: 'Comprehensive Life Insurance',
                type: 'life',
                premium: 150.00,
                coverage: 500000,
                description: 'Complete life coverage with additional benefits for family protection.'
            },
            {
                id: 2,
                name: 'Premium Health Coverage',
                type: 'health',
                premium: 220.00,
                coverage: 100000,
                description: 'Comprehensive health insurance covering major medical expenses.'
            },
            {
                id: 3,
                name: 'Auto Protection Plus',
                type: 'auto',
                premium: 85.00,
                coverage: 75000,
                description: 'Full auto insurance with collision and comprehensive coverage.'
            }
        ];

        this.clients = [
            {
                id: 1,
                name: 'John Smith',
                email: 'john.smith@email.com',
                phone: '(555) 123-4567',
                dob: '1985-03-15',
                address: '123 Main St, City, State 12345',
                policies: 2,
                status: 'active'
            },
            {
                id: 2,
                name: 'Sarah Johnson',
                email: 'sarah.j@email.com',
                phone: '(555) 987-6543',
                dob: '1990-07-22',
                address: '456 Oak Ave, City, State 12345',
                policies: 1,
                status: 'active'
            }
        ];

        this.claims = [
            {
                id: 1,
                clientId: 1,
                productId: 2,
                amount: 2500.00,
                description: 'Medical expenses for routine surgery',
                date: '2024-10-15',
                status: 'pending'
            },
            {
                id: 2,
                clientId: 2,
                productId: 3,
                amount: 4200.00,
                description: 'Vehicle damage from accident',
                date: '2024-10-10',
                status: 'approved'
            }
        ];

        this.saveAllData();
    }

    saveAllData() {
        this.saveToStorage('products', this.products);
        this.saveToStorage('clients', this.clients);
        this.saveToStorage('claims', this.claims);
    }

    // Product methods
    addProduct(product) {
        product.id = Date.now();
        this.products.push(product);
        this.saveToStorage('products', this.products);
        return product;
    }

    updateProduct(id, updatedProduct) {
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...updatedProduct };
            this.saveToStorage('products', this.products);
            return this.products[index];
        }
        return null;
    }

    deleteProduct(id) {
        this.products = this.products.filter(p => p.id !== id);
        this.saveToStorage('products', this.products);
    }

    // Client methods
    addClient(client) {
        client.id = Date.now();
        client.policies = 0;
        client.status = 'active';
        this.clients.push(client);
        this.saveToStorage('clients', this.clients);
        return client;
    }

    updateClient(id, updatedClient) {
        const index = this.clients.findIndex(c => c.id === id);
        if (index !== -1) {
            this.clients[index] = { ...this.clients[index], ...updatedClient };
            this.saveToStorage('clients', this.clients);
            return this.clients[index];
        }
        return null;
    }

    deleteClient(id) {
        this.clients = this.clients.filter(c => c.id !== id);
        this.saveToStorage('clients', this.clients);
    }

    // Claim methods
    addClaim(claim) {
        claim.id = Date.now();
        claim.status = 'pending';
        claim.date = new Date().toISOString().split('T')[0];
        this.claims.push(claim);
        this.saveToStorage('claims', this.claims);
        return claim;
    }

    updateClaimStatus(id, status) {
        const index = this.claims.findIndex(c => c.id === id);
        if (index !== -1) {
            this.claims[index].status = status;
            this.saveToStorage('claims', this.claims);
            return this.claims[index];
        }
        return null;
    }

    deleteClaim(id) {
        this.claims = this.claims.filter(c => c.id !== id);
        this.saveToStorage('claims', this.claims);
    }
}

// Initialize database
const db = new Database();

// Application state
let currentEditingProduct = null;
let currentEditingClient = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    updateDashboard();
    renderProducts();
    renderClients();
    renderClaims();
    setupForms();
}

// Navigation
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            // Update active nav button
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(tab => tab.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            
            // Update content based on tab
            if (tabId === 'dashboard') updateDashboard();
            if (tabId === 'products') renderProducts();
            if (tabId === 'clients') renderClients();
            if (tabId === 'claims') renderClaims();
        });
    });
}

// Dashboard
function updateDashboard() {
    document.getElementById('total-products').textContent = db.products.length;
    document.getElementById('total-clients').textContent = db.clients.filter(c => c.status === 'active').length;
    document.getElementById('total-claims').textContent = db.claims.filter(c => c.status === 'pending').length;
    
    const totalRevenue = db.products.reduce((sum, p) => sum + p.premium, 0) * db.clients.length;
    document.getElementById('total-revenue').textContent = `$${totalRevenue.toLocaleString()}`;
    
    renderRecentActivity();
}

function renderRecentActivity() {
    const activityList = document.getElementById('activity-list');
    const activities = [
        { icon: 'fas fa-user-plus', text: 'New client registered', time: '2 hours ago' },
        { icon: 'fas fa-file-invoice-dollar', text: 'Claim approved for John Smith', time: '4 hours ago' },
        { icon: 'fas fa-box', text: 'New insurance product added', time: '1 day ago' },
        { icon: 'fas fa-handshake', text: 'Policy renewed for Sarah Johnson', time: '2 days ago' }
    ];

    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-text">${activity.text}</div>
            <div class="activity-time">${activity.time}</div>
        </div>
    `).join('');
}

// Products
function renderProducts() {
    const productsGrid = document.getElementById('products-grid');
    productsGrid.innerHTML = db.products.map(product => `
        <div class="product-card">
            <div class="product-header">
                <div class="product-type">${product.type}</div>
            </div>
            <div class="product-name">${product.name}</div>
            <div class="product-premium">$${product.premium}/month</div>
            <div class="product-coverage">Coverage: $${product.coverage.toLocaleString()}</div>
            <div class="product-description">${product.description}</div>
            <div class="product-actions">
                <button class="btn-edit" onclick="editProduct(${product.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-danger" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    const title = document.getElementById('product-modal-title');
    
    if (productId) {
        currentEditingProduct = db.products.find(p => p.id === productId);
        title.textContent = 'Edit Product';
        
        // Populate form
        document.getElementById('product-name').value = currentEditingProduct.name;
        document.getElementById('product-type').value = currentEditingProduct.type;
        document.getElementById('product-premium').value = currentEditingProduct.premium;
        document.getElementById('product-coverage').value = currentEditingProduct.coverage;
        document.getElementById('product-description').value = currentEditingProduct.description;
    } else {
        currentEditingProduct = null;
        title.textContent = 'Add New Product';
        form.reset();
    }
    
    modal.style.display = 'block';
}

function editProduct(id) {
    openProductModal(id);
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        db.deleteProduct(id);
        renderProducts();
        updateDashboard();
    }
}

function searchProducts() {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    const filteredProducts = db.products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.type.toLowerCase().includes(searchTerm)
    );
    
    const productsGrid = document.getElementById('products-grid');
    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <div class="product-header">
                <div class="product-type">${product.type}</div>
            </div>
            <div class="product-name">${product.name}</div>
            <div class="product-premium">$${product.premium}/month</div>
            <div class="product-coverage">Coverage: $${product.coverage.toLocaleString()}</div>
            <div class="product-description">${product.description}</div>
            <div class="product-actions">
                <button class="btn-edit" onclick="editProduct(${product.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-danger" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Clients
function renderClients() {
    const clientsTableBody = document.getElementById('clients-table-body');
    clientsTableBody.innerHTML = db.clients.map(client => `
        <tr>
            <td>${client.id}</td>
            <td>${client.name}</td>
            <td>${client.email}</td>
            <td>${client.phone}</td>
            <td>${client.policies}</td>
            <td><span class="status-badge status-${client.status}">${client.status}</span></td>
            <td>
                <button class="btn-edit" onclick="editClient(${client.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-danger" onclick="deleteClient(${client.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function openClientModal(clientId = null) {
    const modal = document.getElementById('client-modal');
    const form = document.getElementById('client-form');
    const title = document.getElementById('client-modal-title');
    
    if (clientId) {
        currentEditingClient = db.clients.find(c => c.id === clientId);
        title.textContent = 'Edit Client';
        
        // Populate form
        document.getElementById('client-name').value = currentEditingClient.name;
        document.getElementById('client-email').value = currentEditingClient.email;
        document.getElementById('client-phone').value = currentEditingClient.phone;
        document.getElementById('client-dob').value = currentEditingClient.dob;
        document.getElementById('client-address').value = currentEditingClient.address;
    } else {
        currentEditingClient = null;
        title.textContent = 'Add New Client';
        form.reset();
    }
    
    modal.style.display = 'block';
}

function editClient(id) {
    openClientModal(id);
}

function deleteClient(id) {
    if (confirm('Are you sure you want to delete this client?')) {
        db.deleteClient(id);
        renderClients();
        updateDashboard();
    }
}

function searchClients() {
    const searchTerm = document.getElementById('client-search').value.toLowerCase();
    const filteredClients = db.clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm) ||
        client.email.toLowerCase().includes(searchTerm)
    );
    
    const clientsTableBody = document.getElementById('clients-table-body');
    clientsTableBody.innerHTML = filteredClients.map(client => `
        <tr>
            <td>${client.id}</td>
            <td>${client.name}</td>
            <td>${client.email}</td>
            <td>${client.phone}</td>
            <td>${client.policies}</td>
            <td><span class="status-badge status-${client.status}">${client.status}</span></td>
            <td>
                <button class="btn-edit" onclick="editClient(${client.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-danger" onclick="deleteClient(${client.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Claims
function renderClaims() {
    const claimsTableBody = document.getElementById('claims-table-body');
    claimsTableBody.innerHTML = db.claims.map(claim => {
        const client = db.clients.find(c => c.id === claim.clientId);
        const product = db.products.find(p => p.id === claim.productId);
        
        return `
            <tr>
                <td>${claim.id}</td>
                <td>${client ? client.name : 'Unknown'}</td>
                <td>${product ? product.name : 'Unknown'}</td>
                <td>$${claim.amount.toLocaleString()}</td>
                <td>${claim.date}</td>
                <td><span class="status-badge status-${claim.status}">${claim.status}</span></td>
                <td>
                    ${claim.status === 'pending' ? `
                        <button class="btn-edit" onclick="updateClaimStatus(${claim.id}, 'approved')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn-danger" onclick="updateClaimStatus(${claim.id}, 'rejected')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : `
                        <button class="btn-danger" onclick="deleteClaim(${claim.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    `}
                </td>
            </tr>
        `;
    }).join('');
    
    // Populate claim form dropdowns
    populateClaimFormDropdowns();
}

function populateClaimFormDropdowns() {
    const clientSelect = document.getElementById('claim-client');
    const productSelect = document.getElementById('claim-product');
    
    clientSelect.innerHTML = '<option value="">Select Client</option>' + 
        db.clients.map(client => `<option value="${client.id}">${client.name}</option>`).join('');
    
    productSelect.innerHTML = '<option value="">Select Product</option>' + 
        db.products.map(product => `<option value="${product.id}">${product.name}</option>`).join('');
}

function openClaimModal() {
    const modal = document.getElementById('claim-modal');
    const form = document.getElementById('claim-form');
    
    form.reset();
    populateClaimFormDropdowns();
    modal.style.display = 'block';
}

function updateClaimStatus(id, status) {
    db.updateClaimStatus(id, status);
    renderClaims();
    updateDashboard();
}

function deleteClaim(id) {
    if (confirm('Are you sure you want to delete this claim?')) {
        db.deleteClaim(id);
        renderClaims();
        updateDashboard();
    }
}

function filterClaims() {
    const statusFilter = document.getElementById('status-filter').value;
    const dateFilter = document.getElementById('date-filter').value;
    
    let filteredClaims = db.claims;
    
    if (statusFilter) {
        filteredClaims = filteredClaims.filter(claim => claim.status === statusFilter);
    }
    
    if (dateFilter) {
        filteredClaims = filteredClaims.filter(claim => claim.date === dateFilter);
    }
    
    const claimsTableBody = document.getElementById('claims-table-body');
    claimsTableBody.innerHTML = filteredClaims.map(claim => {
        const client = db.clients.find(c => c.id === claim.clientId);
        const product = db.products.find(p => p.id === claim.productId);
        
        return `
            <tr>
                <td>${claim.id}</td>
                <td>${client ? client.name : 'Unknown'}</td>
                <td>${product ? product.name : 'Unknown'}</td>
                <td>$${claim.amount.toLocaleString()}</td>
                <td>${claim.date}</td>
                <td><span class="status-badge status-${claim.status}">${claim.status}</span></td>
                <td>
                    ${claim.status === 'pending' ? `
                        <button class="btn-edit" onclick="updateClaimStatus(${claim.id}, 'approved')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn-danger" onclick="updateClaimStatus(${claim.id}, 'rejected')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : `
                        <button class="btn-danger" onclick="deleteClaim(${claim.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

// Form handling
function setupForms() {
    // Product form
    document.getElementById('product-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const productData = {
            name: document.getElementById('product-name').value,
            type: document.getElementById('product-type').value,
            premium: parseFloat(document.getElementById('product-premium').value),
            coverage: parseInt(document.getElementById('product-coverage').value),
            description: document.getElementById('product-description').value
        };
        
        if (currentEditingProduct) {
            db.updateProduct(currentEditingProduct.id, productData);
        } else {
            db.addProduct(productData);
        }
        
        closeModal('product-modal');
        renderProducts();
        updateDashboard();
    });
    
    // Client form
    document.getElementById('client-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const clientData = {
            name: document.getElementById('client-name').value,
            email: document.getElementById('client-email').value,
            phone: document.getElementById('client-phone').value,
            dob: document.getElementById('client-dob').value,
            address: document.getElementById('client-address').value
        };
        
        if (currentEditingClient) {
            db.updateClient(currentEditingClient.id, clientData);
        } else {
            db.addClient(clientData);
        }
        
        closeModal('client-modal');
        renderClients();
        updateDashboard();
    });
    
    // Claim form
    document.getElementById('claim-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const claimData = {
            clientId: parseInt(document.getElementById('claim-client').value),
            productId: parseInt(document.getElementById('claim-product').value),
            amount: parseFloat(document.getElementById('claim-amount').value),
            description: document.getElementById('claim-description').value
        };
        
        db.addClaim(claimData);
        closeModal('claim-modal');
        renderClaims();
        updateDashboard();
    });
}

// Modal functions
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    currentEditingProduct = null;
    currentEditingClient = null;
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});
