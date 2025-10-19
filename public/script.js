// API Client for backend communication
class ApiClient {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('authToken');
    }

    // Helper method for making API requests
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Token expired or invalid, redirect to login
                    this.logout();
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication methods
    async login(username, password) {
        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        this.token = data.token;
        localStorage.setItem('authToken', this.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        return data;
    }

    logout() {
        this.token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        showLoginScreen();
    }

    isAuthenticated() {
        return !!this.token;
    }

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    // Product methods
    async getProducts() {
        return await this.request('/products');
    }

    async getProduct(id) {
        return await this.request(`/products/${id}`);
    }

    async addProduct(product) {
        return await this.request('/products', {
            method: 'POST',
            body: JSON.stringify(product)
        });
    }

    async updateProduct(id, product) {
        return await this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(product)
        });
    }

    async deleteProduct(id) {
        return await this.request(`/products/${id}`, {
            method: 'DELETE'
        });
    }

    async searchProducts(term) {
        return await this.request(`/products/search/${encodeURIComponent(term)}`);
    }

    // Client methods
    async getClients() {
        return await this.request('/clients');
    }

    async getClient(id) {
        return await this.request(`/clients/${id}`);
    }

    async addClient(client) {
        return await this.request('/clients', {
            method: 'POST',
            body: JSON.stringify(client)
        });
    }

    async updateClient(id, client) {
        return await this.request(`/clients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(client)
        });
    }

    async updateClientStatus(id, status, notes = '') {
        return await this.request(`/clients/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, notes })
        });
    }

    async deleteClient(id) {
        return await this.request(`/clients/${id}`, {
            method: 'DELETE'
        });
    }

    async searchClients(term) {
        return await this.request(`/clients/search/${encodeURIComponent(term)}`);
    }

    // Claim methods
    async getClaims() {
        return await this.request('/claims');
    }

    async getClaim(id) {
        return await this.request(`/claims/${id}`);
    }

    async addClaim(claim) {
        return await this.request('/claims', {
            method: 'POST',
            body: JSON.stringify(claim)
        });
    }

    async updateClaimStatus(id, status, notes = '') {
        return await this.request(`/claims/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, notes })
        });
    }

    async deleteClaim(id) {
        return await this.request(`/claims/${id}`, {
            method: 'DELETE'
        });
    }

    // Policy methods
    async getPolicies() {
        return await this.request('/policies');
    }

    async getPolicy(id) {
        return await this.request(`/policies/${id}`);
    }

    async addPolicy(policy) {
        return await this.request('/policies', {
            method: 'POST',
            body: JSON.stringify(policy)
        });
    }

    async updatePolicyStatus(id, status, notes = '') {
        return await this.request(`/policies/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, notes })
        });
    }

    async updatePolicy(id, policy) {
        return await this.request(`/policies/${id}`, {
            method: 'PUT',
            body: JSON.stringify(policy)
        });
    }

    async deletePolicy(id) {
        return await this.request(`/policies/${id}`, {
            method: 'DELETE'
        });
    }

    async searchPolicies(term) {
        return await this.request(`/policies/search/${encodeURIComponent(term)}`);
    }

    async getPoliciesByStatus(status) {
        return await this.request(`/policies/status/${status}`);
    }

    async renewPolicy(id, renewalData) {
        return await this.request(`/policies/${id}/renew`, {
            method: 'PUT',
            body: JSON.stringify(renewalData)
        });
    }

    async getReportsSummary() {
        return await this.request('/reports/summary');
    }

    // Dashboard methods
    async getDashboardStats() {
        return await this.request('/dashboard/stats');
    }

    async getRecentActivity() {
        return await this.request('/dashboard/activity');
    }
}

// Initialize API client
const api = new ApiClient();

// Global data store
let productsData = [];
let clientsData = [];
let claimsData = [];
let policiesData = [];

// Application state
let currentEditingProduct = null;
let currentEditingClient = null;
let currentEditingPolicy = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    checkAuthAndInitialize();
});

function checkAuthAndInitialize() {
    if (api.isAuthenticated()) {
        showMainApp();
        initializeApp();
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
    setupLoginForm();
}

function showMainApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
}

function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            try {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
                submitBtn.disabled = true;
                
                await api.login(username, password);
                showMainApp();
                await initializeApp();
                showSuccess('Login successful!');
                
            } catch (error) {
                console.error('Login failed:', error);
                showError(error.message || 'Login failed');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        api.logout();
        showSuccess('Logged out successfully');
    }
}

function initializeApp() {
    setupNavigation();
    updateDashboard();
    renderProducts();
    renderClients();
    renderPolicies();
    renderClaims();
    renderReports();
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
            if (tabId === 'policies') renderPolicies();
            if (tabId === 'claims') renderClaims();
            if (tabId === 'reports') renderReports();
        });
    });
}

// Dashboard
async function updateDashboard() {
    try {
        const stats = await api.getDashboardStats();
        document.getElementById('total-products').textContent = stats.totalProducts;
        document.getElementById('total-clients').textContent = stats.activeClients;
        document.getElementById('total-claims').textContent = stats.pendingClaims;
        document.getElementById('active-policies').textContent = stats.activePolicies || 0;
        document.getElementById('total-revenue').textContent = `$${stats.totalRevenue.toLocaleString()}`;
        
        await renderRecentActivity();
    } catch (error) {
        console.error('Failed to update dashboard:', error);
        showError('Failed to load dashboard data');
    }
}

async function renderRecentActivity() {
    try {
        const activities = await api.getRecentActivity();
        const activityList = document.getElementById('activity-list');
        
        if (activities.length === 0) {
            activityList.innerHTML = '<div class="activity-item">No recent activity</div>';
            return;
        }

        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-text">${activity.description}</div>
                <div class="activity-time">${formatDate(activity.timestamp)}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load recent activity:', error);
    }
}

function getActivityIcon(type) {
    switch(type) {
        case 'client': return 'fas fa-user-plus';
        case 'claim': return 'fas fa-file-invoice-dollar';
        case 'product': return 'fas fa-box';
        default: return 'fas fa-info-circle';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
}

// Products
async function renderProducts() {
    try {
        productsData = await api.getProducts();
        const productsGrid = document.getElementById('products-grid');
        
        if (productsData.length === 0) {
            productsGrid.innerHTML = '<div class="no-data">No products found</div>';
            return;
        }

        productsGrid.innerHTML = productsData.map(product => `
            <div class="product-card">
                <div class="product-header">
                    <div class="product-type">${product.type}</div>
                </div>
                <div class="product-name">${product.name}</div>
                <div class="product-premium">$${parseFloat(product.premium).toFixed(2)}/month</div>
                <div class="product-coverage">Coverage: $${parseInt(product.coverage).toLocaleString()}</div>
                <div class="product-description">${product.description || 'No description available'}</div>
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
    } catch (error) {
        console.error('Failed to load products:', error);
        showError('Failed to load products');
    }
}

function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    const title = document.getElementById('product-modal-title');
    
    if (productId) {
        currentEditingProduct = productsData.find(p => p.id === productId);
        title.textContent = 'Edit Product';
        
        // Populate form
        document.getElementById('product-name').value = currentEditingProduct.name;
        document.getElementById('product-type').value = currentEditingProduct.type;
        document.getElementById('product-premium').value = currentEditingProduct.premium;
        document.getElementById('product-coverage').value = currentEditingProduct.coverage;
        document.getElementById('product-description').value = currentEditingProduct.description || '';
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

async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await api.deleteProduct(id);
            await renderProducts();
            await updateDashboard();
            showSuccess('Product deleted successfully');
        } catch (error) {
            console.error('Failed to delete product:', error);
            showError(error.message || 'Failed to delete product');
        }
    }
}

async function searchProducts() {
    const searchTerm = document.getElementById('product-search').value.trim();
    
    if (!searchTerm) {
        await renderProducts();
        return;
    }

    try {
        const filteredProducts = await api.searchProducts(searchTerm);
        const productsGrid = document.getElementById('products-grid');
        
        if (filteredProducts.length === 0) {
            productsGrid.innerHTML = '<div class="no-data">No products found</div>';
            return;
        }

        productsGrid.innerHTML = filteredProducts.map(product => `
            <div class="product-card">
                <div class="product-header">
                    <div class="product-type">${product.type}</div>
                </div>
                <div class="product-name">${product.name}</div>
                <div class="product-premium">$${parseFloat(product.premium).toFixed(2)}/month</div>
                <div class="product-coverage">Coverage: $${parseInt(product.coverage).toLocaleString()}</div>
                <div class="product-description">${product.description || 'No description available'}</div>
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
    } catch (error) {
        console.error('Failed to search products:', error);
        showError('Failed to search products');
    }
}

// Clients
async function renderClients() {
    try {
        clientsData = await api.getClients();
        const clientsTableBody = document.getElementById('clients-table-body');
        
        if (clientsData.length === 0) {
            clientsTableBody.innerHTML = '<tr><td colspan="7">No clients found</td></tr>';
            return;
        }

        clientsTableBody.innerHTML = clientsData.map(client => `
            <tr>
                <td>${client.id}</td>
                <td>${client.name}</td>
                <td>${client.email}</td>
                <td>${client.phone || 'N/A'}</td>
                <td>${client.policies || 0}</td>
                <td>
                    <span class="status-badge status-${client.status}">
                        ${client.status}
                        <button class="status-change-btn" onclick="openClientStatusModal(${client.id}, '${client.status}')" title="Change Status">
                            <i class="fas fa-edit"></i>
                        </button>
                    </span>
                </td>
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
    } catch (error) {
        console.error('Failed to load clients:', error);
        showError('Failed to load clients');
    }
}

function openClientModal(clientId = null) {
    const modal = document.getElementById('client-modal');
    const form = document.getElementById('client-form');
    const title = document.getElementById('client-modal-title');
    
    if (clientId) {
        currentEditingClient = clientsData.find(c => c.id === clientId);
        title.textContent = 'Edit Client';
        
        // Populate form
        document.getElementById('client-name').value = currentEditingClient.name;
        document.getElementById('client-email').value = currentEditingClient.email;
        document.getElementById('client-phone').value = currentEditingClient.phone || '';
        document.getElementById('client-dob').value = currentEditingClient.date_of_birth || '';
        document.getElementById('client-address').value = currentEditingClient.address || '';
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

function openClientStatusModal(clientId, currentStatus) {
    currentEditingClient = clientsData.find(c => c.id === clientId);
    const modal = document.getElementById('client-status-modal');
    const statusSelect = document.getElementById('client-status-select');
    const notesField = document.getElementById('client-status-notes');
    
    statusSelect.value = currentStatus;
    notesField.value = '';
    
    modal.style.display = 'block';
}

async function deleteClient(id) {
    if (confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
        try {
            await api.deleteClient(id);
            await renderClients();
            await updateDashboard();
            showSuccess('Client deleted successfully');
        } catch (error) {
            console.error('Failed to delete client:', error);
            if (error.message.includes('active policies') || error.message.includes('pending claims')) {
                showError('Cannot delete client with active policies or pending claims. Please cancel/complete them first.');
            } else {
                showError(error.message || 'Failed to delete client');
            }
        }
    }
}

async function searchClients() {
    const searchTerm = document.getElementById('client-search').value.trim();
    
    if (!searchTerm) {
        await renderClients();
        return;
    }

    try {
        const filteredClients = await api.searchClients(searchTerm);
        const clientsTableBody = document.getElementById('clients-table-body');
        
        if (filteredClients.length === 0) {
            clientsTableBody.innerHTML = '<tr><td colspan="7">No clients found</td></tr>';
            return;
        }

        clientsTableBody.innerHTML = filteredClients.map(client => `
            <tr>
                <td>${client.id}</td>
                <td>${client.name}</td>
                <td>${client.email}</td>
                <td>${client.phone || 'N/A'}</td>
                <td>${client.policies || 0}</td>
                <td>
                    <span class="status-badge status-${client.status}">
                        ${client.status}
                        <button class="status-change-btn" onclick="openClientStatusModal(${client.id}, '${client.status}')" title="Change Status">
                            <i class="fas fa-edit"></i>
                        </button>
                    </span>
                </td>
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
    } catch (error) {
        console.error('Failed to search clients:', error);
        showError('Failed to search clients');
    }
}

async function filterClientsByStatus() {
    const statusFilter = document.getElementById('client-status-filter').value;
    
    if (!statusFilter) {
        await renderClients();
        return;
    }

    try {
        // Filter clients by status
        const filteredClients = clientsData.filter(client => client.status === statusFilter);
        const clientsTableBody = document.getElementById('clients-table-body');
        
        if (filteredClients.length === 0) {
            clientsTableBody.innerHTML = '<tr><td colspan="7">No clients found</td></tr>';
            return;
        }

        clientsTableBody.innerHTML = filteredClients.map(client => `
            <tr>
                <td>${client.id}</td>
                <td>${client.name}</td>
                <td>${client.email}</td>
                <td>${client.phone || 'N/A'}</td>
                <td>${client.policies || 0}</td>
                <td>
                    <span class="status-badge status-${client.status}">
                        ${client.status}
                        <button class="status-change-btn" onclick="openClientStatusModal(${client.id}, '${client.status}')" title="Change Status">
                            <i class="fas fa-edit"></i>
                        </button>
                    </span>
                </td>
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
    } catch (error) {
        console.error('Failed to filter clients:', error);
        showError('Failed to filter clients');
    }
}

// Reports
async function renderReports() {
    try {
        const stats = await api.getReportsSummary();
        
        document.getElementById('report-active-policies').textContent = stats.active_policies || 0;
        document.getElementById('report-expired-policies').textContent = stats.expired_policies || 0;
        document.getElementById('report-cancelled-policies').textContent = stats.cancelled_policies || 0;
        
        document.getElementById('report-active-clients').textContent = stats.active_clients || 0;
        document.getElementById('report-inactive-clients').textContent = stats.inactive_clients || 0;
        document.getElementById('report-total-products').textContent = stats.total_products || 0;
        
        document.getElementById('report-pending-claims').textContent = stats.pending_claims || 0;
        document.getElementById('report-approved-claims').textContent = stats.approved_claims || 0;
        document.getElementById('report-rejected-claims').textContent = stats.rejected_claims || 0;
        
        const monthlyRevenue = stats.monthly_revenue || 0;
        document.getElementById('report-monthly-revenue').textContent = `$${monthlyRevenue.toLocaleString()}`;
        document.getElementById('report-annual-revenue').textContent = `$${(monthlyRevenue * 12).toLocaleString()}`;
        document.getElementById('report-claims-paid').textContent = `$${(stats.total_claims_paid || 0).toLocaleString()}`;
        
    } catch (error) {
        console.error('Failed to load reports:', error);
        showError('Failed to load reports');
    }
}

async function generateReport() {
    try {
        const stats = await api.getReportsSummary();
        const reportData = {
            date: new Date().toLocaleDateString(),
            policies: {
                active: stats.active_policies || 0,
                expired: stats.expired_policies || 0,
                cancelled: stats.cancelled_policies || 0
            },
            clients: {
                active: stats.active_clients || 0,
                inactive: stats.inactive_clients || 0
            },
            claims: {
                pending: stats.pending_claims || 0,
                approved: stats.approved_claims || 0,
                rejected: stats.rejected_claims || 0
            },
            financial: {
                monthlyRevenue: stats.monthly_revenue || 0,
                annualRevenue: (stats.monthly_revenue || 0) * 12,
                claimsPaid: stats.total_claims_paid || 0
            }
        };
        
        // Create downloadable report
        const reportText = `
INSURANCE MANAGEMENT SYSTEM REPORT
Generated on: ${reportData.date}

POLICY SUMMARY:
- Active Policies: ${reportData.policies.active}
- Expired Policies: ${reportData.policies.expired}
- Cancelled Policies: ${reportData.policies.cancelled}

CLIENT SUMMARY:
- Active Clients: ${reportData.clients.active}
- Inactive Clients: ${reportData.clients.inactive}

CLAIMS SUMMARY:
- Pending Claims: ${reportData.claims.pending}
- Approved Claims: ${reportData.claims.approved}
- Rejected Claims: ${reportData.claims.rejected}

FINANCIAL SUMMARY:
- Monthly Revenue: $${reportData.financial.monthlyRevenue.toLocaleString()}
- Annual Revenue: $${reportData.financial.annualRevenue.toLocaleString()}
- Total Claims Paid: $${reportData.financial.claimsPaid.toLocaleString()}
        `;
        
        // Download the report
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `insurance-report-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showSuccess('Report generated and downloaded successfully');
    } catch (error) {
        console.error('Failed to generate report:', error);
        showError('Failed to generate report');
    }
}

// Claims
async function renderClaims() {
    try {
        claimsData = await api.getClaims();
        const claimsTableBody = document.getElementById('claims-table-body');
        
        if (claimsData.length === 0) {
            claimsTableBody.innerHTML = '<tr><td colspan="7">No claims found</td></tr>';
            return;
        }

        claimsTableBody.innerHTML = claimsData.map(claim => `
            <tr>
                <td>${claim.claim_number || claim.id}</td>
                <td>${claim.client_name}</td>
                <td>${claim.product_name}</td>
                <td>$${parseFloat(claim.amount).toLocaleString()}</td>
                <td>${claim.submitted_date || claim.date}</td>
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
        `).join('');
        
        // Populate claim form dropdowns
        await populateClaimFormDropdowns();
    } catch (error) {
        console.error('Failed to load claims:', error);
        showError('Failed to load claims');
    }
}

async function populateClaimFormDropdowns() {
    try {
        const clientSelect = document.getElementById('claim-client');
        const productSelect = document.getElementById('claim-product');
        
        // Ensure we have current data
        if (clientsData.length === 0) {
            clientsData = await api.getClients();
        }
        if (productsData.length === 0) {
            productsData = await api.getProducts();
        }
        
        clientSelect.innerHTML = '<option value="">Select Client</option>' + 
            clientsData.map(client => `<option value="${client.id}">${client.name}</option>`).join('');
        
        productSelect.innerHTML = '<option value="">Select Product</option>' + 
            productsData.map(product => `<option value="${product.id}">${product.name}</option>`).join('');
    } catch (error) {
        console.error('Failed to populate dropdowns:', error);
    }
}

function openClaimModal() {
    const modal = document.getElementById('claim-modal');
    const form = document.getElementById('claim-form');
    
    form.reset();
    populateClaimFormDropdowns();
    modal.style.display = 'block';
}

async function updateClaimStatus(id, status) {
    try {
        await api.updateClaimStatus(id, status);
        await renderClaims();
        await updateDashboard();
        showSuccess(`Claim ${status} successfully`);
    } catch (error) {
        console.error('Failed to update claim status:', error);
        showError(error.message || 'Failed to update claim status');
    }
}

async function deleteClaim(id) {
    if (confirm('Are you sure you want to delete this claim?')) {
        try {
            await api.deleteClaim(id);
            await renderClaims();
            await updateDashboard();
            showSuccess('Claim deleted successfully');
        } catch (error) {
            console.error('Failed to delete claim:', error);
            showError(error.message || 'Failed to delete claim');
        }
    }
}

async function filterClaims() {
    const statusFilter = document.getElementById('status-filter').value;
    const dateFilter = document.getElementById('date-filter').value;
    
    try {
        // Get all claims first
        let filteredClaims = await api.getClaims();
        
        // Apply client-side filters for now (could be moved to backend)
        if (statusFilter) {
            filteredClaims = filteredClaims.filter(claim => claim.status === statusFilter);
        }
        
        if (dateFilter) {
            filteredClaims = filteredClaims.filter(claim => 
                (claim.submitted_date || claim.date) === dateFilter
            );
        }
        
        const claimsTableBody = document.getElementById('claims-table-body');
        
        if (filteredClaims.length === 0) {
            claimsTableBody.innerHTML = '<tr><td colspan="7">No claims found</td></tr>';
            return;
        }

        claimsTableBody.innerHTML = filteredClaims.map(claim => `
            <tr>
                <td>${claim.claim_number || claim.id}</td>
                <td>${claim.client_name}</td>
                <td>${claim.product_name}</td>
                <td>$${parseFloat(claim.amount).toLocaleString()}</td>
                <td>${claim.submitted_date || claim.date}</td>
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
        `).join('');
    } catch (error) {
        console.error('Failed to filter claims:', error);
        showError('Failed to filter claims');
    }
}

// Policies
async function renderPolicies() {
    try {
        policiesData = await api.getPolicies();
        const policiesTableBody = document.getElementById('policies-table-body');
        
        if (policiesData.length === 0) {
            policiesTableBody.innerHTML = '<tr><td colspan="8">No policies found</td></tr>';
            return;
        }

        policiesTableBody.innerHTML = policiesData.map(policy => `
            <tr>
                <td>${policy.policy_number}</td>
                <td>${policy.client_name}</td>
                <td>${policy.product_name}</td>
                <td>$${parseFloat(policy.monthly_premium).toFixed(2)}/month</td>
                <td>$${parseInt(policy.coverage).toLocaleString()}</td>
                <td>${policy.start_date}</td>
                <td>
                    <span class="status-badge status-${policy.status}">
                        ${policy.status}
                        <button class="status-change-btn" onclick="openPolicyStatusModal(${policy.id}, '${policy.status}')" title="Change Status">
                            <i class="fas fa-edit"></i>
                        </button>
                    </span>
                </td>
                <td>
                    <button class="btn-edit" onclick="editPolicy(${policy.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-danger" onclick="deletePolicy(${policy.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Populate policy form dropdowns
        await populatePolicyFormDropdowns();
    } catch (error) {
        console.error('Failed to load policies:', error);
        showError('Failed to load policies');
    }
}

async function populatePolicyFormDropdowns() {
    try {
        const clientSelect = document.getElementById('policy-client');
        const productSelect = document.getElementById('policy-product');
        
        // Ensure we have current data
        if (clientsData.length === 0) {
            clientsData = await api.getClients();
        }
        if (productsData.length === 0) {
            productsData = await api.getProducts();
        }
        
        clientSelect.innerHTML = '<option value="">Select Client</option>' + 
            clientsData.map(client => `<option value="${client.id}">${client.name}</option>`).join('');
        
        productSelect.innerHTML = '<option value="">Select Product</option>' + 
            productsData.map(product => `<option value="${product.id}">${product.name} (${product.type})</option>`).join('');
    } catch (error) {
        console.error('Failed to populate policy dropdowns:', error);
    }
}

function openPolicyModal(policyId = null) {
    const modal = document.getElementById('policy-modal');
    const form = document.getElementById('policy-form');
    const title = document.getElementById('policy-modal-title');
    
    if (policyId) {
        currentEditingPolicy = policiesData.find(p => p.id === policyId);
        title.textContent = 'Edit Policy';
        
        // Populate form
        document.getElementById('policy-client').value = currentEditingPolicy.client_id;
        document.getElementById('policy-product').value = currentEditingPolicy.product_id;
        document.getElementById('policy-number').value = currentEditingPolicy.policy_number;
        document.getElementById('policy-start-date').value = currentEditingPolicy.start_date;
        document.getElementById('policy-end-date').value = currentEditingPolicy.end_date || '';
    } else {
        currentEditingPolicy = null;
        title.textContent = 'Add New Policy';
        form.reset();
        // Set default start date to today
        document.getElementById('policy-start-date').value = new Date().toISOString().split('T')[0];
    }
    
    populatePolicyFormDropdowns();
    modal.style.display = 'block';
}

function openPolicyStatusModal(policyId, currentStatus) {
    currentEditingPolicy = policiesData.find(p => p.id === policyId);
    const modal = document.getElementById('policy-status-modal');
    const statusSelect = document.getElementById('policy-status-select');
    const notesField = document.getElementById('policy-status-notes');
    
    statusSelect.value = currentStatus;
    notesField.value = '';
    
    modal.style.display = 'block';
}

function editPolicy(id) {
    openPolicyModal(id);
}

async function deletePolicy(id) {
    if (confirm('Are you sure you want to delete this policy?')) {
        try {
            await api.deletePolicy(id);
            await renderPolicies();
            await updateDashboard();
            showSuccess('Policy deleted successfully');
        } catch (error) {
            console.error('Failed to delete policy:', error);
            showError(error.message || 'Failed to delete policy');
        }
    }
}

async function renewPolicy(id) {
    if (confirm('Renew this policy for 12 months?')) {
        try {
            await api.renewPolicy(id, { renewal_period_months: 12 });
            await renderPolicies();
            await updateDashboard();
            showSuccess('Policy renewed successfully for 12 months');
        } catch (error) {
            console.error('Failed to renew policy:', error);
            showError(error.message || 'Failed to renew policy');
        }
    }
}

function getPolicyActionButtons(policy) {
    return `
        <button class="btn-edit" onclick="editPolicy(${policy.id})">
            <i class="fas fa-edit"></i> Edit
        </button>
        ${policy.status === 'expired' ? `
            <button class="btn-success" onclick="renewPolicy(${policy.id})">
                <i class="fas fa-redo"></i> Renew
            </button>
        ` : ''}
        <button class="btn-danger" onclick="deletePolicy(${policy.id})">
            <i class="fas fa-trash"></i> Delete
        </button>
    `;
}

async function searchPolicies() {
    const searchTerm = document.getElementById('policy-search').value.trim();
    
    if (!searchTerm) {
        await renderPolicies();
        return;
    }

    try {
        const filteredPolicies = await api.searchPolicies(searchTerm);
        const policiesTableBody = document.getElementById('policies-table-body');
        
        if (filteredPolicies.length === 0) {
            policiesTableBody.innerHTML = '<tr><td colspan="8">No policies found</td></tr>';
            return;
        }

        policiesTableBody.innerHTML = filteredPolicies.map(policy => `
            <tr>
                <td>${policy.policy_number}</td>
                <td>${policy.client_name}</td>
                <td>${policy.product_name}</td>
                <td>$${parseFloat(policy.monthly_premium).toFixed(2)}/month</td>
                <td>$${parseInt(policy.coverage).toLocaleString()}</td>
                <td>${policy.start_date}</td>
                <td>
                    <span class="status-badge status-${policy.status}">
                        ${policy.status}
                        <button class="status-change-btn" onclick="openPolicyStatusModal(${policy.id}, '${policy.status}')" title="Change Status">
                            <i class="fas fa-edit"></i>
                        </button>
                    </span>
                </td>
                <td>
                    <button class="btn-edit" onclick="editPolicy(${policy.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-danger" onclick="deletePolicy(${policy.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to search policies:', error);
        showError('Failed to search policies');
    }
}

async function filterPoliciesByStatus() {
    const statusFilter = document.getElementById('policy-status-filter').value;
    
    if (!statusFilter) {
        await renderPolicies();
        return;
    }

    try {
        const filteredPolicies = await api.getPoliciesByStatus(statusFilter);
        const policiesTableBody = document.getElementById('policies-table-body');
        
        if (filteredPolicies.length === 0) {
            policiesTableBody.innerHTML = '<tr><td colspan="8">No policies found</td></tr>';
            return;
        }

        policiesTableBody.innerHTML = filteredPolicies.map(policy => `
            <tr>
                <td>${policy.policy_number}</td>
                <td>${policy.client_name}</td>
                <td>${policy.product_name}</td>
                <td>$${parseFloat(policy.monthly_premium).toFixed(2)}/month</td>
                <td>$${parseInt(policy.coverage).toLocaleString()}</td>
                <td>${policy.start_date}</td>
                <td>
                    <span class="status-badge status-${policy.status}">
                        ${policy.status}
                        <button class="status-change-btn" onclick="openPolicyStatusModal(${policy.id}, '${policy.status}')" title="Change Status">
                            <i class="fas fa-edit"></i>
                        </button>
                    </span>
                </td>
                <td>
                    <button class="btn-edit" onclick="editPolicy(${policy.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-danger" onclick="deletePolicy(${policy.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to filter policies:', error);
        showError('Failed to filter policies');
    }
}

// Form handling
function setupForms() {
    // Product form
    document.getElementById('product-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const productData = {
            name: document.getElementById('product-name').value,
            type: document.getElementById('product-type').value,
            premium: parseFloat(document.getElementById('product-premium').value),
            coverage: parseInt(document.getElementById('product-coverage').value),
            description: document.getElementById('product-description').value
        };
        
        try {
            if (currentEditingProduct) {
                await api.updateProduct(currentEditingProduct.id, productData);
                showSuccess('Product updated successfully');
            } else {
                await api.addProduct(productData);
                showSuccess('Product added successfully');
            }
            
            closeModal('product-modal');
            await renderProducts();
            await updateDashboard();
        } catch (error) {
            console.error('Failed to save product:', error);
            showError(error.message || 'Failed to save product');
        }
    });
    
    // Client form
    document.getElementById('client-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const clientData = {
            name: document.getElementById('client-name').value,
            email: document.getElementById('client-email').value,
            phone: document.getElementById('client-phone').value,
            date_of_birth: document.getElementById('client-dob').value,
            address: document.getElementById('client-address').value
        };
        
        try {
            if (currentEditingClient) {
                await api.updateClient(currentEditingClient.id, clientData);
                showSuccess('Client updated successfully');
            } else {
                await api.addClient(clientData);
                showSuccess('Client added successfully');
            }
            
            closeModal('client-modal');
            await renderClients();
            await updateDashboard();
        } catch (error) {
            console.error('Failed to save client:', error);
            showError(error.message || 'Failed to save client');
        }
    });
    
    // Claim form
    document.getElementById('claim-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const claimData = {
            client_id: parseInt(document.getElementById('claim-client').value),
            product_id: parseInt(document.getElementById('claim-product').value),
            amount: parseFloat(document.getElementById('claim-amount').value),
            description: document.getElementById('claim-description').value
        };
        
        try {
            await api.addClaim(claimData);
            closeModal('claim-modal');
            await renderClaims();
            await updateDashboard();
            showSuccess('Claim submitted successfully');
        } catch (error) {
            console.error('Failed to submit claim:', error);
            showError(error.message || 'Failed to submit claim');
        }
    });
    
    // Policy form
    document.getElementById('policy-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const policyData = {
            client_id: parseInt(document.getElementById('policy-client').value),
            product_id: parseInt(document.getElementById('policy-product').value),
            policy_number: document.getElementById('policy-number').value || undefined,
            start_date: document.getElementById('policy-start-date').value,
            end_date: document.getElementById('policy-end-date').value || undefined
        };
        
        try {
            if (currentEditingPolicy) {
                await api.updatePolicy(currentEditingPolicy.id, policyData);
                showSuccess('Policy updated successfully');
            } else {
                await api.addPolicy(policyData);
                showSuccess('Policy added successfully');
            }
            
            closeModal('policy-modal');
            await renderPolicies();
            await updateDashboard();
        } catch (error) {
            console.error('Failed to save policy:', error);
            showError(error.message || 'Failed to save policy');
        }
    });
    
    // Policy status form
    document.getElementById('policy-status-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!currentEditingPolicy) {
            showError('No policy selected');
            return;
        }
        
        const status = document.getElementById('policy-status-select').value;
        const notes = document.getElementById('policy-status-notes').value;
        
        try {
            await api.updatePolicyStatus(currentEditingPolicy.id, status, notes);
            closeModal('policy-status-modal');
            await renderPolicies();
            await updateDashboard();
            showSuccess(`Policy status updated to ${status}`);
        } catch (error) {
            console.error('Failed to update policy status:', error);
            showError(error.message || 'Failed to update policy status');
        }
    });
    
    // Client status form
    document.getElementById('client-status-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!currentEditingClient) {
            showError('No client selected');
            return;
        }
        
        const status = document.getElementById('client-status-select').value;
        const notes = document.getElementById('client-status-notes').value;
        
        try {
            await api.updateClientStatus(currentEditingClient.id, status, notes);
            closeModal('client-status-modal');
            await renderClients();
            await updateDashboard();
            showSuccess(`Client status updated to ${status}`);
        } catch (error) {
            console.error('Failed to update client status:', error);
            showError(error.message || 'Failed to update client status');
        }
    });
}

// Utility functions
function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
    
    // Allow manual close
    notification.addEventListener('click', () => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
}

// Modal functions
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    currentEditingProduct = null;
    currentEditingClient = null;
    currentEditingPolicy = null;
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
