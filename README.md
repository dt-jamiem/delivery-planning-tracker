# Delivery Planning Tracker

A standalone application extracted from the jira-dashboard project, focused specifically on capacity planning and delivery tracking.

## Features

- **Team Capacity Utilization**: Track team capacity and workload across engineering teams
- **Team Workload Distribution**: View open tickets and estimated effort by team and individual
- **Work Categories**: Organize work into BAU, Deliver, and Improve buckets
- **Ticket Flow Trends**: Visualize ticket creation and resolution trends over time
- **Capacity Insights**: Get actionable insights on workload trends and team utilization

## Project Structure

```
delivery-planning-tracker/
├── backend/          # Node.js/Express API server
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/         # React application
    ├── src/
    │   ├── components/
    │   │   ├── CapacityPlanning.js
    │   │   └── CapacityPlanning.css
    │   ├── App.js
    │   ├── App.css
    │   ├── index.js
    │   └── index.css
    ├── public/
    │   └── index.html
    └── package.json
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure your Jira credentials in `.env`:
   ```
   JIRA_URL=https://your-domain.atlassian.net
   JIRA_USERNAME=your-email@example.com
   JIRA_API_TOKEN=your-api-token-here
   PORT=5000
   ```

   To generate a Jira API token:
   - Go to https://id.atlassian.com/manage-profile/security/api-tokens
   - Click "Create API token"
   - Copy the token and paste it in your `.env` file

5. Start the backend server:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

   The API will be running at http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

   The application will open at http://localhost:3000

4. Build for production:
   ```bash
   npm run build
   ```

## API Endpoints

### GET /api/health
Health check endpoint to verify the API is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Delivery Planning Tracker API is running"
}
```

### GET /api/capacity-planning
Fetches capacity planning data including team workload, ticket flow, and capacity metrics.

**Query Parameters:**
- `days` (optional): Number of days to look back (default: 30)

**Response:**
```json
{
  "summary": {
    "totalOpenTickets": 150,
    "ticketsCreated": 45,
    "ticketsResolved": 38,
    "avgResolutionTime": 5,
    "velocity": 38,
    "period": 30,
    "workingDays": 21,
    "hoursPerDay": 6
  },
  "teamCapacity": { ... },
  "assigneeWorkload": [ ... ],
  "ticketFlow": [ ... ],
  "parentGrouping": {
    "bau": [ ... ],
    "deliver": [ ... ],
    "improve": [ ... ]
  }
}
```

## Configuration

### Team Capacity Configuration

Team capacity is configured in `backend/server.js`. To modify teams and their capacity:

```javascript
const teamCapacity = {
  'Team Name': {
    engineers: 4,
    members: ['Member 1', 'Member 2', 'Member 3', 'Member 4']
  }
};
```

### Work Estimation Rules

The system uses default estimates for unestimated tickets:

**User Stories & Tasks:**
- To Do: 8 hours
- In Progress: 4 hours

**DTI Higher Complexity** (Build/Deployment Issues, Connectivity, Branch Request):
- To Do: 6 hours
- In Progress: 3 hours

**DTI Standard** (All other DTI request types):
- To Do: 4 hours
- In Progress: 2 hours

**Done tickets:** 0 hours

## Technology Stack

### Backend
- Node.js
- Express.js
- Axios (for Jira API calls)
- dotenv (for environment configuration)

### Frontend
- React 18
- Axios (for API calls)
- CSS3 (custom styling)

## Development

### Backend Development
```bash
cd backend
npm run dev
```

### Frontend Development
```bash
cd frontend
npm start
```

## Troubleshooting

### Backend Issues

**Error: "Failed to fetch capacity planning data"**
- Verify your Jira credentials in `.env`
- Check that your API token is valid
- Ensure your Jira user has permission to access the projects

**Error: "ECONNREFUSED"**
- Make sure the backend server is running on port 5000
- Check if another process is using port 5000

### Frontend Issues

**Error: "Proxy error"**
- Ensure the backend server is running
- Check the proxy configuration in `frontend/package.json`

**Empty or no data displayed**
- Check browser console for errors
- Verify the backend API is returning data by visiting http://localhost:5000/api/health

## License

Extracted from the jira-dashboard project for standalone use.
