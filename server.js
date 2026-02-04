const express = require('express');
const { PlaidApi, PlaidEnvironments, Configuration, LinkTokenCreateRequest, TransactionsGetRequest } = require('plaid');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"]
        }
    }
}));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

app.use(express.json());
app.use(express.static('public'));

// Plaid Configuration
const configuration = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
            'PLAID-SECRET': process.env.PLAID_SECRET,
            'Plaid-Version': '2020-09-14',
        },
    },
});

const plaidClient = new PlaidApi(configuration);

// In-memory storage for demo (use a real database in production)
const users = new Map();
const userTokens = new Map();

// Utility functions
function generateUserId() {
    return Math.random().toString(36).substr(2, 9);
}

function generateAccessToken() {
    return 'access-' + Math.random().toString(36).substr(2, 9);
}

// API Routes

// Create link token for Plaid Link
app.post('/api/create-link-token', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const request = new LinkTokenCreateRequest({
            user: {
                clientUserId: userId,
            },
            clientName: 'Professional Finance Tracker',
            products: ['transactions', 'accounts'],
            countryCodes: ['US'],
            language: 'en',
            webhook: process.env.PLAID_WEBHOOK_URL,
        });

        const response = await plaidClient.linkTokenCreate(request);
        
        res.json({
            linkToken: response.data.link_token,
            expiration: response.data.expiration,
        });
    } catch (error) {
        console.error('Error creating link token:', error);
        res.status(500).json({ 
            error: 'Failed to create link token',
            details: error.message 
        });
    }
});

// Exchange public token for access token
app.post('/api/exchange-token', async (req, res) => {
    try {
        const { publicToken, userId } = req.body;
        
        if (!publicToken || !userId) {
            return res.status(400).json({ error: 'Public token and user ID are required' });
        }

        const request = {
            public_token: publicToken,
        };

        const response = await plaidClient.itemPublicTokenExchange(request);
        const accessToken = response.data.access_token;
        const itemId = response.data.item_id;

        // Store access token for user
        userTokens.set(userId, {
            accessToken,
            itemId,
            createdAt: new Date().toISOString()
        });

        // Initialize user data if not exists
        if (!users.has(userId)) {
            users.set(userId, {
                id: userId,
                accounts: [],
                transactions: [],
                lastSync: null
            });
        }

        res.json({
            accessToken,
            itemId,
            success: true
        });
    } catch (error) {
        console.error('Error exchanging token:', error);
        res.status(500).json({ 
            error: 'Failed to exchange token',
            details: error.message 
        });
    }
});

// Get accounts for a user
app.get('/api/accounts/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userTokenData = userTokens.get(userId);

        if (!userTokenData) {
            return res.status(404).json({ error: 'User not found or not connected' });
        }

        const request = {
            access_token: userTokenData.accessToken,
        };

        const response = await plaidClient.accountsGet(request);
        
        // Update user accounts
        const userData = users.get(userId);
        if (userData) {
            userData.accounts = response.data.accounts.map(account => ({
                id: account.account_id,
                name: account.name,
                type: account.type,
                subtype: account.subtype,
                balance: account.balances.current,
                institution: account.official_name || 'Unknown Bank'
            }));
            users.set(userId, userData);
        }

        res.json({
            accounts: response.data.accounts,
            success: true
        });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ 
            error: 'Failed to fetch accounts',
            details: error.message 
        });
    }
});

// Get transactions for a user
app.get('/api/transactions/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;
        
        const userTokenData = userTokens.get(userId);

        if (!userTokenData) {
            return res.status(404).json({ error: 'User not found or not connected' });
        }

        // Default to last 30 days if no dates provided
        const defaultStartDate = new Date();
        defaultStartDate.setDate(defaultStartDate.getDate() - 30);
        
        const request = new TransactionsGetRequest({
            access_token: userTokenData.accessToken,
            start_date: startDate || defaultStartDate.toISOString().split('T')[0],
            end_date: endDate || new Date().toISOString().split('T')[0],
        });

        const response = await plaidClient.transactionsGet(request);
        
        // Update user transactions
        const userData = users.get(userId);
        if (userData) {
            userData.transactions = response.data.transactions.map(transaction => ({
                id: transaction.transaction_id,
                amount: transaction.amount,
                description: transaction.name,
                date: transaction.date,
                type: transaction.amount > 0 ? 'income' : 'expense',
                categoryId: this.getCategoryIdFromPlaidCategory(transaction.category),
                accountId: transaction.account_id,
                source: 'bank'
            }));
            userData.lastSync = new Date().toISOString();
            users.set(userId, userData);
        }

        res.json({
            transactions: response.data.transactions,
            success: true
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ 
            error: 'Failed to fetch transactions',
            details: error.message 
        });
    }
});

// Sync all user data
app.post('/api/sync/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Fetch fresh accounts and transactions
        const accountsResponse = await fetch(`${req.protocol}://${req.get('host')}/api/accounts/${userId}`);
        const transactionsResponse = await fetch(`${req.protocol}://${req.get('host')}/api/transactions/${userId}`);

        if (!accountsResponse.ok || !transactionsResponse.ok) {
            throw new Error('Failed to sync data');
        }

        res.json({
            success: true,
            message: 'Data synced successfully'
        });
    } catch (error) {
        console.error('Error syncing data:', error);
        res.status(500).json({ 
            error: 'Failed to sync data',
            details: error.message 
        });
    }
});

// Get user data
app.get('/api/user/:userId', (req, res) => {
    const { userId } = req.params;
    const userData = users.get(userId);
    
    if (!userData) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({
        user: userData,
        success: true
    });
});

// Utility function to map Plaid categories to our categories
function getCategoryIdFromPlaidCategory(plaidCategories) {
    const categoryMap = {
        'Food and Drink': 1,
        'Transportation': 2,
        'Shops': 3,
        'Recreation': 4,
        'Service': 5,
        'Healthcare': 6,
        'Transfer': 7,
        'Travel': 2
    };

    const primaryCategory = plaidCategories[0];
    return categoryMap[primaryCategory] || 1; // Default to Food & Dining
}

// Webhook endpoint for Plaid
app.post('/api/webhook', (req, res) => {
    const { webhook_type, webhook_code, item_id } = req.body;
    
    console.log('Received webhook:', webhook_type, webhook_code);
    
    // Handle different webhook types
    if (webhook_type === 'TRANSACTIONS') {
        if (webhook_code === 'INITIAL_UPDATE' || webhook_code === 'HISTORICAL_UPDATE') {
            // Trigger sync for the user
            console.log('Transaction update received for item:', item_id);
        }
    }
    
    res.json({ status: 'ok' });
});

// Scheduled sync job (runs every hour)
cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled sync...');
    
    for (const [userId, userData] of users.entries()) {
        try {
            // Trigger sync for each user
            const userTokenData = userTokens.get(userId);
            if (userTokenData) {
                // This would trigger a sync in a real implementation
                console.log(`Syncing data for user: ${userId}`);
            }
        } catch (error) {
            console.error(`Error syncing user ${userId}:`, error);
        }
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.listen(PORT, () => {
    console.log(`🚀 Professional Finance Tracker API running on port ${PORT}`);
    console.log(`📊 Plaid Environment: ${process.env.PLAID_ENV || 'sandbox'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
