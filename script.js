// Finance Tracker Application
class FinanceTracker {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.categories = JSON.parse(localStorage.getItem('categories')) || this.getDefaultCategories();
        this.budgets = JSON.parse(localStorage.getItem('budgets')) || [];
        this.bankAccounts = JSON.parse(localStorage.getItem('bankAccounts')) || [];
        this.currentEditingId = null;
        this.currentConnectionStep = 1;
        this.selectedBank = null;
        this.plaidClient = null;
        
        this.initializeApp();
    }

    getDefaultCategories() {
        return [
            { id: 1, name: 'Food & Dining', type: 'expense', color: '#e74c3c' },
            { id: 2, name: 'Transportation', type: 'expense', color: '#3498db' },
            { id: 3, name: 'Shopping', type: 'expense', color: '#9b59b6' },
            { id: 4, name: 'Entertainment', type: 'expense', color: '#f39c12' },
            { id: 5, name: 'Bills & Utilities', type: 'expense', color: '#1abc9c' },
            { id: 6, name: 'Healthcare', type: 'expense', color: '#e67e22' },
            { id: 7, name: 'Salary', type: 'income', color: '#27ae60' },
            { id: 8, name: 'Freelance', type: 'income', color: '#2ecc71' },
            { id: 9, name: 'Investment', type: 'income', color: '#34495e' }
        ];
    }

    initializeApp() {
        this.setupEventListeners();
        this.populateCategorySelects();
        this.updateDashboard();
        this.renderTransactions();
        this.renderBudgets();
        this.renderCategories();
        this.renderBankAccounts();
        this.setupCharts();
        
        // Set today's date as default for transaction date
        document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
        
        // Initialize Plaid (for demo purposes, we'll simulate the integration)
        this.initializePlaid();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });

        // Transaction modal
        document.getElementById('add-transaction-btn').addEventListener('click', () => {
            this.openTransactionModal();
        });

        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });

        document.getElementById('cancel-transaction').addEventListener('click', () => {
            this.closeModal('transaction-modal');
        });

        // Budget modal
        document.getElementById('add-budget-btn').addEventListener('click', () => {
            this.openBudgetModal();
        });

        document.getElementById('budget-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBudget();
        });

        document.getElementById('cancel-budget').addEventListener('click', () => {
            this.closeModal('budget-modal');
        });

        // Category modal
        document.getElementById('add-category-btn').addEventListener('click', () => {
            this.openCategoryModal();
        });

        document.getElementById('category-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory();
        });

        document.getElementById('cancel-category').addEventListener('click', () => {
            this.closeModal('category-modal');
        });

        // Modal close buttons
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal').id);
            });
        });

        // Close modal when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Dashboard period change
        document.getElementById('dashboard-period').addEventListener('change', () => {
            this.updateDashboard();
        });

        // Transaction filters
        document.getElementById('search-transactions').addEventListener('input', () => {
            this.renderTransactions();
        });

        document.getElementById('filter-category').addEventListener('change', () => {
            this.renderTransactions();
        });

        document.getElementById('filter-type').addEventListener('change', () => {
            this.renderTransactions();
        });

        document.getElementById('filter-date-from').addEventListener('change', () => {
            this.renderTransactions();
        });

        document.getElementById('filter-date-to').addEventListener('change', () => {
            this.renderTransactions();
        });

        // Bank account modal
        document.getElementById('add-account-btn').addEventListener('click', () => {
            this.openBankAccountModal();
        });

        document.getElementById('sync-accounts-btn').addEventListener('click', () => {
            this.syncAllAccounts();
        });

        document.getElementById('cancel-bank-connection').addEventListener('click', () => {
            this.closeModal('bank-account-modal');
        });

        document.getElementById('next-step-btn').addEventListener('click', () => {
            this.nextConnectionStep();
        });

        document.getElementById('proceed-login-btn').addEventListener('click', () => {
            this.proceedToBankLogin();
        });

        // Bank search
        document.getElementById('bank-search').addEventListener('input', (e) => {
            this.searchBanks(e.target.value);
        });
    }

    switchSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        // Update specific section data
        if (sectionName === 'dashboard') {
            this.updateDashboard();
        } else if (sectionName === 'transactions') {
            this.renderTransactions();
        } else if (sectionName === 'budget') {
            this.renderBudgets();
        } else if (sectionName === 'categories') {
            this.renderCategories();
        } else if (sectionName === 'accounts') {
            this.renderBankAccounts();
        }
    }

    populateCategorySelects() {
        const selects = [
            'transaction-category',
            'budget-category',
            'filter-category'
        ];

        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            select.innerHTML = selectId === 'filter-category' ? '<option value="">All Categories</option>' : '<option value="">Select Category</option>';
            
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });
        });
    }

    openTransactionModal(transaction = null) {
        this.currentEditingId = transaction ? transaction.id : null;
        const modal = document.getElementById('transaction-modal');
        const title = document.getElementById('transaction-modal-title');
        
        title.textContent = transaction ? 'Edit Transaction' : 'Add Transaction';
        
        if (transaction) {
            document.getElementById('transaction-type').value = transaction.type;
            document.getElementById('transaction-amount').value = transaction.amount;
            document.getElementById('transaction-description').value = transaction.description;
            document.getElementById('transaction-category').value = transaction.categoryId;
            document.getElementById('transaction-date').value = transaction.date;
        } else {
            document.getElementById('transaction-form').reset();
            document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
        }
        
        modal.style.display = 'block';
    }

    openBudgetModal(budget = null) {
        this.currentEditingId = budget ? budget.id : null;
        const modal = document.getElementById('budget-modal');
        const title = document.getElementById('budget-modal-title');
        
        title.textContent = budget ? 'Edit Budget' : 'Add Budget';
        
        if (budget) {
            document.getElementById('budget-category').value = budget.categoryId;
            document.getElementById('budget-amount').value = budget.amount;
            document.getElementById('budget-period').value = budget.period;
        } else {
            document.getElementById('budget-form').reset();
        }
        
        modal.style.display = 'block';
    }

    openCategoryModal(category = null) {
        this.currentEditingId = category ? category.id : null;
        const modal = document.getElementById('category-modal');
        const title = document.getElementById('category-modal-title');
        
        title.textContent = category ? 'Edit Category' : 'Add Category';
        
        if (category) {
            document.getElementById('category-name').value = category.name;
            document.getElementById('category-type').value = category.type;
            document.getElementById('category-color').value = category.color;
        } else {
            document.getElementById('category-form').reset();
            document.getElementById('category-color').value = '#3498db';
        }
        
        modal.style.display = 'block';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
        this.currentEditingId = null;
    }

    saveTransaction() {
        const type = document.getElementById('transaction-type').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const description = document.getElementById('transaction-description').value;
        const categoryId = parseInt(document.getElementById('transaction-category').value);
        const date = document.getElementById('transaction-date').value;

        if (!amount || !description || !categoryId || !date) {
            alert('Please fill in all fields');
            return;
        }

        const transaction = {
            id: this.currentEditingId || Date.now(),
            type,
            amount,
            description,
            categoryId,
            date,
            createdAt: this.currentEditingId ? this.transactions.find(t => t.id === this.currentEditingId).createdAt : new Date().toISOString()
        };

        if (this.currentEditingId) {
            const index = this.transactions.findIndex(t => t.id === this.currentEditingId);
            this.transactions[index] = transaction;
        } else {
            this.transactions.push(transaction);
        }

        this.saveData();
        this.closeModal('transaction-modal');
        this.updateDashboard();
        this.renderTransactions();
        this.setupCharts();
    }

    saveBudget() {
        const categoryId = parseInt(document.getElementById('budget-category').value);
        const amount = parseFloat(document.getElementById('budget-amount').value);
        const period = document.getElementById('budget-period').value;

        if (!amount || !categoryId) {
            alert('Please fill in all fields');
            return;
        }

        const budget = {
            id: this.currentEditingId || Date.now(),
            categoryId,
            amount,
            period
        };

        if (this.currentEditingId) {
            const index = this.budgets.findIndex(b => b.id === this.currentEditingId);
            this.budgets[index] = budget;
        } else {
            this.budgets.push(budget);
        }

        this.saveData();
        this.closeModal('budget-modal');
        this.renderBudgets();
    }

    saveCategory() {
        const name = document.getElementById('category-name').value;
        const type = document.getElementById('category-type').value;
        const color = document.getElementById('category-color').value;

        if (!name || !type) {
            alert('Please fill in all fields');
            return;
        }

        const category = {
            id: this.currentEditingId || Date.now(),
            name,
            type,
            color
        };

        if (this.currentEditingId) {
            const index = this.categories.findIndex(c => c.id === this.currentEditingId);
            this.categories[index] = category;
        } else {
            this.categories.push(category);
        }

        this.saveData();
        this.closeModal('category-modal');
        this.populateCategorySelects();
        this.renderCategories();
    }

    deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveData();
            this.updateDashboard();
            this.renderTransactions();
            this.setupCharts();
        }
    }

    deleteBudget(id) {
        if (confirm('Are you sure you want to delete this budget?')) {
            this.budgets = this.budgets.filter(b => b.id !== id);
            this.saveData();
            this.renderBudgets();
        }
    }

    deleteCategory(id) {
        if (confirm('Are you sure you want to delete this category?')) {
            this.categories = this.categories.filter(c => c.id !== id);
            this.saveData();
            this.populateCategorySelects();
            this.renderCategories();
        }
    }

    saveData() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
        localStorage.setItem('categories', JSON.stringify(this.categories));
        localStorage.setItem('budgets', JSON.stringify(this.budgets));
        localStorage.setItem('bankAccounts', JSON.stringify(this.bankAccounts));
    }

    getFilteredTransactions() {
        const search = document.getElementById('search-transactions').value.toLowerCase();
        const categoryFilter = document.getElementById('filter-category').value;
        const typeFilter = document.getElementById('filter-type').value;
        const dateFrom = document.getElementById('filter-date-from').value;
        const dateTo = document.getElementById('filter-date-to').value;

        return this.transactions.filter(transaction => {
            const category = this.categories.find(c => c.id === transaction.categoryId);
            const matchesSearch = !search || 
                transaction.description.toLowerCase().includes(search) ||
                (category && category.name.toLowerCase().includes(search));
            
            const matchesCategory = !categoryFilter || transaction.categoryId == categoryFilter;
            const matchesType = !typeFilter || transaction.type === typeFilter;
            const matchesDateFrom = !dateFrom || transaction.date >= dateFrom;
            const matchesDateTo = !dateTo || transaction.date <= dateTo;

            return matchesSearch && matchesCategory && matchesType && matchesDateFrom && matchesDateTo;
        });
    }

    getTransactionsByPeriod(period) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return this.transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            
            switch (period) {
                case 'month':
                    return transactionDate.getMonth() === currentMonth && 
                           transactionDate.getFullYear() === currentYear;
                case 'year':
                    return transactionDate.getFullYear() === currentYear;
                case 'all':
                default:
                    return true;
            }
        });
    }

    updateDashboard() {
        const period = document.getElementById('dashboard-period').value;
        const transactions = this.getTransactionsByPeriod(period);
        
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const balance = income - expenses;
        const savingsRate = income > 0 ? ((balance / income) * 100) : 0;

        document.getElementById('total-income').textContent = this.formatCurrency(income);
        document.getElementById('total-expense').textContent = this.formatCurrency(expenses);
        document.getElementById('balance').textContent = this.formatCurrency(balance);
        document.getElementById('savings-rate').textContent = `${savingsRate.toFixed(1)}%`;

        // Update balance color
        const balanceElement = document.getElementById('balance');
        balanceElement.className = balance >= 0 ? 'stat-amount' : 'stat-amount expense';

        this.renderRecentTransactions();
    }

    renderRecentTransactions() {
        const recentTransactions = this.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        const container = document.getElementById('recent-transactions-list');
        
        if (recentTransactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h3>No transactions yet</h3>
                    <p>Add your first transaction to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentTransactions.map(transaction => {
            const category = this.categories.find(c => c.id === transaction.categoryId);
            return this.createTransactionHTML(transaction, category);
        }).join('');
    }

    renderTransactions() {
        const filteredTransactions = this.getFilteredTransactions();
        const container = document.getElementById('all-transactions-list');
        
        if (filteredTransactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No transactions found</h3>
                    <p>Try adjusting your filters or add a new transaction.</p>
                </div>
            `;
            return;
        }

        const sortedTransactions = filteredTransactions
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = sortedTransactions.map(transaction => {
            const category = this.categories.find(c => c.id === transaction.categoryId);
            return this.createTransactionHTML(transaction, category);
        }).join('');
    }

    createTransactionHTML(transaction, category) {
        const icon = transaction.type === 'income' ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
        const amountClass = transaction.type === 'income' ? 'income' : 'expense';
        const isBankTransaction = transaction.source === 'bank';
        const bankClass = isBankTransaction ? 'bank-transaction' : '';
        
        return `
            <div class="transaction-item ${bankClass}">
                <div class="transaction-info">
                    <div class="transaction-icon" style="background-color: ${category?.color || '#95a5a6'}">
                        <i class="${icon}"></i>
                    </div>
                    <div class="transaction-details">
                        <h4>${transaction.description}</h4>
                        <p>${category?.name || 'Unknown'} • ${this.formatDate(transaction.date)}${isBankTransaction ? ' • Bank' : ''}</p>
                    </div>
                </div>
                <div class="transaction-amount ${amountClass}">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                </div>
                <div class="transaction-actions">
                    <button class="btn btn-secondary" onclick="app.openTransactionModal(${JSON.stringify(transaction).replace(/"/g, '&quot;')})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="app.deleteTransaction(${transaction.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderBudgets() {
        const container = document.getElementById('budget-grid');
        
        if (this.budgets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-piggy-bank"></i>
                    <h3>No budgets set</h3>
                    <p>Create your first budget to start tracking your spending!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.budgets.map(budget => {
            const category = this.categories.find(c => c.id === budget.categoryId);
            const spent = this.getBudgetSpent(budget);
            const percentage = (spent / budget.amount) * 100;
            
            return `
                <div class="budget-item">
                    <div class="budget-header">
                        <div class="budget-category" style="color: ${category?.color || '#3498db'}">
                            ${category?.name || 'Unknown Category'}
                        </div>
                        <div class="budget-amount">
                            ${this.formatCurrency(spent)} / ${this.formatCurrency(budget.amount)}
                        </div>
                    </div>
                    <div class="budget-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%; background: ${percentage > 100 ? '#e74c3c' : '#3498db'}"></div>
                        </div>
                        <div class="progress-text">
                            <span>${percentage.toFixed(1)}% used</span>
                            <span>${budget.period}</span>
                        </div>
                    </div>
                    <div class="budget-actions">
                        <button class="btn btn-secondary" onclick="app.openBudgetModal(${JSON.stringify(budget).replace(/"/g, '&quot;')})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteBudget(${budget.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    getBudgetSpent(budget) {
        const now = new Date();
        let startDate, endDate;

        switch (budget.period) {
            case 'weekly':
                startDate = new Date(now.setDate(now.getDate() - now.getDay()));
                endDate = new Date(now.setDate(now.getDate() + 6));
                break;
            case 'monthly':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'yearly':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
        }

        return this.transactions
            .filter(t => {
                const transactionDate = new Date(t.date);
                return t.type === 'expense' && 
                       t.categoryId === budget.categoryId &&
                       transactionDate >= startDate && 
                       transactionDate <= endDate;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    }

    renderCategories() {
        const container = document.getElementById('categories-grid');
        
        if (this.categories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tags"></i>
                    <h3>No categories</h3>
                    <p>Add your first category to organize your transactions!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.categories.map(category => {
            const transactionCount = this.transactions.filter(t => t.categoryId === category.id).length;
            const totalAmount = this.transactions
                .filter(t => t.categoryId === category.id)
                .reduce((sum, t) => sum + t.amount, 0);

            return `
                <div class="category-item">
                    <div class="category-color" style="background-color: ${category.color}"></div>
                    <div class="category-info">
                        <h4>${category.name}</h4>
                        <p>${transactionCount} transactions • ${this.formatCurrency(totalAmount)}</p>
                        <small style="color: ${category.type === 'income' ? '#27ae60' : '#e74c3c'}">
                            ${category.type === 'income' ? 'Income' : 'Expense'}
                        </small>
                    </div>
                    <div class="category-actions">
                        <button class="btn btn-secondary" onclick="app.openCategoryModal(${JSON.stringify(category).replace(/"/g, '&quot;')})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteCategory(${category.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    setupCharts() {
        const incomeCanvas = document.getElementById('incomeExpenseChart');
        const expenseCanvas = document.getElementById('expenseCategoryChart');

        if (!incomeCanvas || !expenseCanvas) {
            return;
        }

        if (typeof Chart === 'undefined') {
            this.loadChartJs(() => this.setupCharts());
            return;
        }

        this.setupIncomeExpenseChart();
        this.setupExpenseCategoryChart();
    }

    loadChartJs(onReady) {
        if (this.chartJsLoading) {
            return;
        }
        this.chartJsLoading = true;

        const script = document.createElement('script');
        script.src = 'chart.min.js';
        script.onload = () => {
            this.chartJsLoading = false;
            onReady();
        };
        script.onerror = () => {
            this.chartJsLoading = false;
            console.error('Failed to load chart.min.js');
        };
        document.head.appendChild(script);
    }

    setupIncomeExpenseChart() {
        const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
        const period = document.getElementById('dashboard-period').value;
        const transactions = this.getTransactionsByPeriod(period);
        
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        if (typeof Chart !== 'undefined') {
            const existingChart = Chart.getChart(ctx);
            if (existingChart) {
                existingChart.destroy();
            }
        }

        window.incomeExpenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Income', 'Expenses'],
                datasets: [{
                    data: [income, expenses],
                    backgroundColor: ['#27ae60', '#e74c3c'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    setupExpenseCategoryChart() {
        const ctx = document.getElementById('expenseCategoryChart').getContext('2d');
        const period = document.getElementById('dashboard-period').value;
        const transactions = this.getTransactionsByPeriod(period)
            .filter(t => t.type === 'expense');

        const categoryData = {};
        transactions.forEach(transaction => {
            const category = this.categories.find(c => c.id === transaction.categoryId);
            const categoryName = category ? category.name : 'Unknown';
            categoryData[categoryName] = (categoryData[categoryName] || 0) + transaction.amount;
        });

        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);
        const colors = labels.map(label => {
            const category = this.categories.find(c => c.name === label);
            return category ? category.color : '#95a5a6';
        });

        if (typeof Chart !== 'undefined') {
            const existingChart = Chart.getChart(ctx);
            if (existingChart) {
                existingChart.destroy();
            }
        }

        if (data.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fillStyle = '#95a5a6';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No expense data', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        window.expenseCategoryChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Bank Integration Methods
    initializePlaid() {
        // In a real implementation, you would initialize Plaid Link here
        // For demo purposes, we'll simulate the functionality
        console.log('Plaid initialized for demo');
    }

    renderBankAccounts() {
        const container = document.getElementById('accounts-grid');
        const totalBalanceElement = document.getElementById('total-balance-amount');
        const accountCountElement = document.getElementById('connected-accounts-count');
        const lastSyncElement = document.getElementById('last-sync-time');

        if (this.bankAccounts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-university"></i>
                    <h3>No bank accounts connected</h3>
                    <p>Connect your bank accounts to automatically import transactions and track your real-time balance.</p>
                </div>
            `;
            totalBalanceElement.textContent = '$0.00';
            accountCountElement.textContent = '0';
            lastSyncElement.textContent = 'Never';
            return;
        }

        const totalBalance = this.bankAccounts.reduce((sum, account) => sum + account.balance, 0);
        const connectedCount = this.bankAccounts.filter(account => account.status === 'connected').length;
        const lastSync = this.bankAccounts.length > 0 ? 
            new Date(Math.max(...this.bankAccounts.map(account => new Date(account.lastSync)))) : null;

        totalBalanceElement.textContent = this.formatCurrency(totalBalance);
        accountCountElement.textContent = connectedCount.toString();
        lastSyncElement.textContent = lastSync ? this.formatDate(lastSync.toISOString()) : 'Never';

        container.innerHTML = this.bankAccounts.map(account => {
            return `
                <div class="account-card ${account.status}">
                    <div class="account-header">
                        <div class="account-info">
                            <h4>${account.name}</h4>
                            <p>${account.institution}</p>
                        </div>
                        <div class="account-balance">
                            <div class="balance">${this.formatCurrency(account.balance)}</div>
                            <div class="account-type">${account.type}</div>
                        </div>
                    </div>
                    <div class="account-status">
                        <div class="status-indicator ${account.status}"></div>
                        <span class="sync-status ${account.status}">
                            ${account.status === 'connected' ? 'Connected' : 
                              account.status === 'syncing' ? 'Syncing...' : 'Error'}
                        </span>
                        <span class="last-sync">Last sync: ${this.formatDate(account.lastSync)}</span>
                    </div>
                    <div class="account-actions">
                        <button class="btn btn-secondary" onclick="app.syncAccount('${account.id}')">
                            <i class="fas fa-sync-alt"></i> Sync
                        </button>
                        <button class="btn btn-danger" onclick="app.disconnectAccount('${account.id}')">
                            <i class="fas fa-unlink"></i> Disconnect
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    openBankAccountModal() {
        this.currentConnectionStep = 1;
        this.selectedBank = null;
        this.showConnectionStep(1);
        this.populateBankList();
        document.getElementById('bank-account-modal').style.display = 'block';
    }

    populateBankList() {
        const bankList = document.getElementById('bank-list');
        const popularBanks = [
            { name: 'Chase Bank', logo: 'C', institutionId: 'chase' },
            { name: 'Bank of America', logo: 'B', institutionId: 'bofa' },
            { name: 'Wells Fargo', logo: 'W', institutionId: 'wells' },
            { name: 'Citibank', logo: 'C', institutionId: 'citi' },
            { name: 'Capital One', logo: 'C', institutionId: 'capitalone' },
            { name: 'PNC Bank', logo: 'P', institutionId: 'pnc' },
            { name: 'US Bank', logo: 'U', institutionId: 'usbank' },
            { name: 'TD Bank', logo: 'T', institutionId: 'td' }
        ];

        bankList.innerHTML = popularBanks.map(bank => `
            <div class="bank-item" data-institution-id="${bank.institutionId}">
                <div class="bank-logo">${bank.logo}</div>
                <div class="bank-name">${bank.name}</div>
            </div>
        `).join('');

        // Add click handlers
        document.querySelectorAll('.bank-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.bank-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                this.selectedBank = {
                    name: item.querySelector('.bank-name').textContent,
                    institutionId: item.dataset.institutionId
                };
                document.getElementById('next-step-btn').style.display = 'inline-block';
            });
        });
    }

    searchBanks(query) {
        // In a real implementation, this would search through Plaid's institution list
        // For demo purposes, we'll filter the existing list
        const bankItems = document.querySelectorAll('.bank-item');
        bankItems.forEach(item => {
            const bankName = item.querySelector('.bank-name').textContent.toLowerCase();
            if (bankName.includes(query.toLowerCase())) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    showConnectionStep(step) {
        document.querySelectorAll('.connection-step').forEach(stepElement => {
            stepElement.classList.remove('active');
        });
        document.getElementById(`step-${step}`).classList.add('active');
        this.currentConnectionStep = step;

        // Update button visibility
        const nextBtn = document.getElementById('next-step-btn');
        if (step === 1) {
            nextBtn.style.display = this.selectedBank ? 'inline-block' : 'none';
        } else if (step === 2) {
            nextBtn.style.display = 'none';
        } else if (step === 3) {
            nextBtn.style.display = 'none';
        } else if (step === 4) {
            nextBtn.style.display = 'none';
        } else if (step === 5) {
            nextBtn.style.display = 'none';
        }
    }

    nextConnectionStep() {
        if (this.currentConnectionStep < 5) {
            this.showConnectionStep(this.currentConnectionStep + 1);
        }
    }

    proceedToBankLogin() {
        // Simulate bank login process
        this.showConnectionStep(4);
        
        // Simulate connection progress
        setTimeout(() => {
            this.showConnectionStep(3);
            this.simulateAccountSelection();
        }, 2000);
    }

    simulateAccountSelection() {
        const accountsToConnect = document.getElementById('accounts-to-connect');
        const mockAccounts = [
            { name: 'Chase Total Checking', type: 'checking', balance: 2543.67, accountId: 'acc_1' },
            { name: 'Chase Freedom Credit Card', type: 'credit', balance: -1256.43, accountId: 'acc_2' },
            { name: 'Chase Savings', type: 'savings', balance: 8750.00, accountId: 'acc_3' }
        ];

        accountsToConnect.innerHTML = mockAccounts.map(account => `
            <div class="account-option" data-account-id="${account.accountId}">
                <input type="checkbox" id="acc_${account.accountId}" checked>
                <div>
                    <strong>${account.name}</strong>
                    <div>${account.type.charAt(0).toUpperCase() + account.type.slice(1)} • ${this.formatCurrency(account.balance)}</div>
                </div>
            </div>
        `).join('');

        // Add continue button
        setTimeout(() => {
            const continueBtn = document.createElement('button');
            continueBtn.className = 'btn btn-primary';
            continueBtn.innerHTML = '<i class="fas fa-check"></i> Connect Selected Accounts';
            continueBtn.onclick = () => this.completeBankConnection(mockAccounts);
            accountsToConnect.appendChild(continueBtn);
        }, 1000);
    }

    completeBankConnection(accounts) {
        this.showConnectionStep(5);
        
        // Add the connected accounts
        accounts.forEach(account => {
            const newAccount = {
                id: account.accountId,
                name: account.name,
                institution: this.selectedBank.name,
                type: account.type,
                balance: account.balance,
                status: 'connected',
                lastSync: new Date().toISOString()
            };
            this.bankAccounts.push(newAccount);
        });

        this.saveData();
        
        // Simulate importing transactions
        this.simulateTransactionImport(accounts);
        
        setTimeout(() => {
            this.closeModal('bank-account-modal');
            this.renderBankAccounts();
            this.updateDashboard();
            this.renderTransactions();
            this.setupCharts();
        }, 2000);
    }

    simulateTransactionImport(accounts) {
        // Simulate importing recent transactions from bank accounts
        const mockTransactions = [
            {
                id: Date.now() + Math.random(),
                type: 'expense',
                amount: 45.67,
                description: 'Starbucks Coffee',
                categoryId: 1, // Food & Dining
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                source: 'bank',
                accountId: accounts[0].accountId
            },
            {
                id: Date.now() + Math.random() + 1,
                type: 'expense',
                amount: 125.43,
                description: 'Shell Gas Station',
                categoryId: 2, // Transportation
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                source: 'bank',
                accountId: accounts[0].accountId
            },
            {
                id: Date.now() + Math.random() + 2,
                type: 'income',
                amount: 3200.00,
                description: 'Salary Deposit',
                categoryId: 7, // Salary
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                source: 'bank',
                accountId: accounts[0].accountId
            }
        ];

        mockTransactions.forEach(transaction => {
            // Only add if not already exists
            if (!this.transactions.find(t => t.description === transaction.description && t.amount === transaction.amount)) {
                this.transactions.push(transaction);
            }
        });

        this.saveData();
    }

    syncAccount(accountId) {
        const account = this.bankAccounts.find(acc => acc.id === accountId);
        if (account) {
            account.status = 'syncing';
            this.renderBankAccounts();
            
            // Simulate sync process
            setTimeout(() => {
                account.status = 'connected';
                account.lastSync = new Date().toISOString();
                account.balance = Math.random() * 10000; // Simulate balance change
                this.saveData();
                this.renderBankAccounts();
                
                // Simulate importing new transactions
                this.simulateTransactionImport([account]);
                this.renderTransactions();
                this.updateDashboard();
                this.setupCharts();
            }, 2000);
        }
    }

    syncAllAccounts() {
        this.bankAccounts.forEach(account => {
            if (account.status === 'connected') {
                this.syncAccount(account.id);
            }
        });
    }

    disconnectAccount(accountId) {
        if (confirm('Are you sure you want to disconnect this bank account?')) {
            this.bankAccounts = this.bankAccounts.filter(acc => acc.id !== accountId);
            this.saveData();
            this.renderBankAccounts();
        }
    }
}

// Initialize the application
const app = new FinanceTracker();
