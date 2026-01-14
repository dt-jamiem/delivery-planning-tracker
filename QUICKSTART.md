# Quick Start Guide

This guide will help you get the Delivery Planning Tracker up and running in minutes.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- Jira API credentials

## Quick Setup

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your Jira credentials
# JIRA_URL=https://your-domain.atlassian.net
# JIRA_USERNAME=your-email@example.com
# JIRA_API_TOKEN=your-api-token-here

# Start the backend
npm start
```

The backend will be running at http://localhost:5000

### 2. Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start the frontend
npm start
```

The frontend will automatically open at http://localhost:3000

## Getting Your Jira API Token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a name (e.g., "Delivery Planning Tracker")
4. Copy the generated token
5. Paste it into your `backend/.env` file as `JIRA_API_TOKEN`

## Verify It's Working

1. Check the backend health endpoint: http://localhost:5000/api/health
2. Check the frontend loads at: http://localhost:3000
3. The data should load automatically after a few seconds

## Common Issues

**Backend won't start:**
- Make sure port 5000 is not in use
- Verify your `.env` file exists and has correct values

**Frontend shows errors:**
- Make sure the backend is running first
- Check browser console for specific errors

**No data loading:**
- Verify Jira credentials are correct
- Check that your Jira user has access to the projects
- Look at backend console for error messages

## Next Steps

- Review the main README.md for detailed configuration options
- Customize team capacity in `backend/server.js`
- Adjust JQL queries in `backend/server.js` to match your Jira projects
