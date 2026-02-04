# Professional Finance Tracker

A professional-grade finance tracking application with real-time bank integration, secure data handling, and comprehensive financial management features.

## Features

### 📊 Dashboard
- **Financial Overview**: View total income, expenses, balance, and savings rate
- **Interactive Charts**: Visual representation of income vs expenses and expense categories
- **Recent Transactions**: Quick view of your latest financial activities
- **Period Filtering**: View data for current month, year, or all time

### 💰 Transaction Management
- **Add/Edit/Delete**: Complete CRUD operations for transactions
- **Categories**: Organize transactions by customizable categories
- **Search & Filter**: Find transactions by description, category, type, or date range
- **Income & Expenses**: Track both income and expense transactions

### 🏦 Budget Tracking
- **Budget Creation**: Set monthly, weekly, or yearly budgets for categories
- **Progress Visualization**: Visual progress bars showing budget usage
- **Overspending Alerts**: Color-coded indicators when budgets are exceeded
- **Multiple Periods**: Support for different budget periods

### 🏷️ Category Management
- **Custom Categories**: Create and manage your own income/expense categories
- **Color Coding**: Visual distinction with custom colors
- **Category Statistics**: View transaction counts and totals per category
- **Type Separation**: Separate income and expense categories

### 🏦 Bank Integration (Professional Feature)
- **Real-time Bank Connection**: Connect to 11,000+ financial institutions via Plaid
- **Automatic Transaction Import**: Sync transactions from your bank accounts
- **Secure Authentication**: Bank-level security with 256-bit SSL encryption
- **Multi-Account Support**: Connect checking, savings, credit cards, and investment accounts
- **Live Balance Updates**: Real-time account balance monitoring
- **Transaction Categorization**: Automatic categorization of imported transactions

## Quick Start (Frontend Only)

For a quick demo without bank integration:

1. **Open the Application**: Simply open `index.html` in your web browser
2. **Add Categories**: Start by creating categories for your income and expenses
3. **Set Budgets**: Define budgets for your expense categories
4. **Record Transactions**: Add your financial transactions manually
5. **Monitor Progress**: Use the dashboard to track your financial health

## Professional Setup (With Bank Integration)

For the full professional experience with real bank integration:

### Prerequisites
- Node.js 16+ installed
- Plaid account (free sandbox available)
- Modern web browser

### Installation

1. **Clone and Setup**:
   ```bash
   git clone <your-repo>
   cd finance-tracker
   npm install
   ```

2. **Configure Plaid**:
   - Sign up for a free Plaid account at [plaid.com](https://plaid.com)
   - Copy `env.example` to `.env`
   - Add your Plaid credentials:
     ```env
     PLAID_CLIENT_ID=your_client_id
     PLAID_SECRET=your_secret
     PLAID_ENV=sandbox
     ```

3. **Start the Server**:
   ```bash
   npm start
   ```

4. **Access the Application**:
   - Open `http://localhost:3000` in your browser
   - Start connecting your bank accounts!

### Plaid Setup Guide

1. **Create Plaid Account**:
   - Visit [dashboard.plaid.com](https://dashboard.plaid.com)
   - Sign up for a free developer account
   - Create a new application

2. **Get Credentials**:
   - Copy your Client ID and Secret from the dashboard
   - Add them to your `.env` file

3. **Test in Sandbox**:
   - Use Plaid's sandbox environment for testing
   - Test credentials are provided in the Plaid dashboard

4. **Go Live**:
   - Request production access when ready
   - Update `PLAID_ENV=production` in your `.env`

## Usage Guide

### Adding Your First Transaction
1. Click the "Add Transaction" button
2. Select transaction type (Income/Expense)
3. Enter amount and description
4. Choose a category
5. Set the date
6. Click Save

### Creating Budgets
1. Go to the Budget section
2. Click "Add Budget"
3. Select a category
4. Set the budget amount
5. Choose the period (Monthly/Weekly/Yearly)
6. Click Save

### Managing Categories
1. Go to the Categories section
2. Click "Add Category"
3. Enter category name
4. Select type (Income/Expense)
5. Choose a color
6. Click Save

### Connecting Bank Accounts
1. Go to the Accounts section
2. Click "Connect Bank Account"
3. Search and select your bank
4. Complete secure bank login
5. Select which accounts to connect
6. Transactions will be automatically imported

### Syncing Bank Data
- **Manual Sync**: Click "Sync" on individual accounts or "Sync All Accounts"
- **Automatic Sync**: Server runs hourly sync jobs in the background
- **Real-time Updates**: New transactions appear automatically via webhooks

## Data Storage

### Frontend Mode (Local Storage)
- ✅ Your data stays private and secure
- ✅ No internet connection required after initial load
- ✅ Fast performance with instant data access
- ⚠️ Data is tied to your specific browser/device

### Professional Mode (Server + Database)
- ✅ Data synced across devices
- ✅ Automatic backups and redundancy
- ✅ Bank integration and real-time updates
- ✅ Enhanced security with server-side encryption
- ✅ Webhook support for instant transaction updates

## Browser Compatibility

This application works on all modern browsers including:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Features Overview

### Dashboard
- Real-time financial summaries
- Interactive doughnut and pie charts
- Recent transaction list
- Period-based filtering

### Transactions
- Complete transaction management
- Advanced search and filtering
- Category-based organization
- Date range filtering

### Budget
- Visual budget tracking
- Progress indicators
- Overspending alerts
- Multiple period support

### Categories
- Custom category creation
- Color-coded organization
- Transaction statistics
- Income/expense separation

## Technical Details

### Frontend
- **Pure HTML, CSS, and JavaScript**: No frameworks required
- **Charts**: Chart.js library for data visualization
- **Icons**: Font Awesome for beautiful icons
- **Responsive**: Mobile-first responsive design
- **PWA Ready**: Can be installed as a Progressive Web App

### Backend (Professional Mode)
- **Node.js + Express**: Fast, scalable server
- **Plaid Integration**: Official Plaid SDK for bank connections
- **Security**: Helmet.js, CORS, rate limiting
- **Automation**: Scheduled sync jobs with node-cron
- **Webhooks**: Real-time transaction updates
- **Error Handling**: Comprehensive error management

## Default Categories

The app comes with pre-configured categories:

**Expense Categories:**
- Food & Dining
- Transportation
- Shopping
- Entertainment
- Bills & Utilities
- Healthcare

**Income Categories:**
- Salary
- Freelance
- Investment

You can edit or delete these and create your own custom categories.

## Tips for Effective Use

1. **Regular Updates**: Add transactions regularly for accurate tracking
2. **Category Organization**: Use meaningful category names for better insights
3. **Budget Planning**: Set realistic budgets based on your spending patterns
4. **Review Dashboard**: Check your dashboard regularly to monitor financial health
5. **Data Backup**: Consider exporting data periodically (feature can be added)

## Security Features

### Bank-Level Security
- **256-bit SSL encryption** for all data transmission
- **OAuth 2.0** authentication with financial institutions
- **Token-based access** - never store banking credentials
- **PCI DSS compliance** through Plaid's infrastructure
- **Regular security audits** and updates

### Data Protection
- **Encrypted storage** of sensitive financial data
- **Rate limiting** to prevent abuse
- **CORS protection** for API endpoints
- **Input validation** and sanitization
- **Secure session management**

## API Endpoints

When running in professional mode, the following API endpoints are available:

- `POST /api/create-link-token` - Create Plaid Link token
- `POST /api/exchange-token` - Exchange public token for access token
- `GET /api/accounts/:userId` - Get user's bank accounts
- `GET /api/transactions/:userId` - Get user's transactions
- `POST /api/sync/:userId` - Manually sync user data
- `GET /api/user/:userId` - Get user data
- `POST /api/webhook` - Plaid webhook endpoint

## Deployment

### Frontend Deployment
- Upload files to any web hosting service
- No server requirements for basic functionality
- Works with GitHub Pages, Netlify, Vercel, etc.

### Full-Stack Deployment
- Deploy to Heroku, DigitalOcean, AWS, or similar
- Set up environment variables
- Configure domain and SSL certificates
- Set up database (PostgreSQL recommended for production)

## Future Enhancements

### Planned Features
- **Multi-currency support** for international users
- **Investment tracking** with portfolio management
- **Bill reminders** and payment scheduling
- **Receipt scanning** with OCR technology
- **Financial goals** and milestone tracking
- **Advanced analytics** and forecasting
- **Mobile app** (React Native/Flutter)
- **Team/family accounts** with shared budgets

### Integration Opportunities
- **Tax software integration** (TurboTax, H&R Block)
- **Accounting software** (QuickBooks, Xero)
- **Investment platforms** (Robinhood, E*TRADE)
- **Credit monitoring** services
- **Insurance providers** for claims tracking

---

## Support

For questions, issues, or feature requests:
- Create an issue in the GitHub repository
- Check the documentation for common solutions
- Review the Plaid documentation for bank integration help

**Transform your financial management with professional-grade tools!** 💰🚀
