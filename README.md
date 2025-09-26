# Meta Ad Account Checker

A minimal web application that allows users to log in with Facebook Login (Meta OAuth) and view all their accessible ad accounts.

## Features

- Facebook Login with OAuth 2.0
- View all accessible ad accounts with detailed information
- Encrypted token storage in PostgreSQL
- Automatic data caching with manual sync option
- Secure session management

## Tech Stack

- **Backend**: Node.js with Express
- **Frontend**: Next.js with React and TypeScript
- **Database**: PostgreSQL
- **Styling**: Tailwind CSS
- **Authentication**: Meta OAuth 2.0

## Prerequisites

- Node.js 16+ installed
- PostgreSQL database running
- Meta App created at [developers.facebook.com](https://developers.facebook.com)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Backend
cd meta-ad-checker/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a new app or use existing one
3. Add Facebook Login product
4. Set the OAuth Redirect URI to: `http://localhost:3001/auth/callback`
5. Request the following permissions: `public_profile`, `ads_read`, `business_management`, `pages_show_list`

### 3. Set Up Database

Create a PostgreSQL database:

```sql
CREATE DATABASE meta_ad_checker;
```

### 4. Configure Environment Variables

Copy the `.env.example` file in the backend directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Meta OAuth Configuration
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
OAUTH_REDIRECT_URI=http://localhost:3001/auth/callback

# Database Configuration
DB_URL=postgresql://user:password@localhost:5432/meta_ad_checker

# Server Configuration
PORT=3001
SESSION_SECRET=generate_a_random_32_char_string
ENCRYPTION_KEY=generate_another_32_char_string

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 5. Run the Application

Start the backend server:

```bash
cd backend
npm run dev
```

In a new terminal, start the frontend:

```bash
cd frontend
npm run dev
```

### 6. Access the Application

Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## API Endpoints

- `GET /auth/login` - Initiates Facebook OAuth flow
- `GET /auth/callback` - OAuth callback handler
- `POST /auth/logout` - Logs out the user
- `GET /auth/me` - Returns current user info
- `GET /api/ad-accounts` - Fetches all ad accounts
- `POST /api/sync` - Refreshes ad account data

## Security Features

- Tokens are encrypted before storage using AES encryption
- Session-based authentication with httpOnly cookies
- CORS protection configured for frontend URL only
- Helmet.js for security headers
- SQL injection protection via parameterized queries

## Data Fields Displayed

For each ad account, the following information is shown:
- Account Name
- Account ID
- Status (Active, Disabled, etc.)
- Currency
- Timezone
- Role/Access Level
- Spend Cap
- Amount Spent
- Balance
- Owner
- Funding Source

## Development Notes

- The app caches ad account data for 5 minutes to reduce API calls
- Use the "Sync Accounts" button to manually refresh data
- All monetary values are displayed in the account's currency
- Session expires after 24 hours

## Troubleshooting

1. **OAuth Error**: Ensure your Meta App ID and Secret are correct
2. **Database Connection**: Verify PostgreSQL is running and credentials are correct
3. **CORS Issues**: Make sure the frontend URL in backend .env matches your Next.js URL
4. **Token Expired**: User needs to log in again to refresh their token