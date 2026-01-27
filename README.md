# Delivery Planning Tracker

A standalone application extracted from the jira-dashboard project, focused specifically on capacity planning and delivery tracking.

## Features

### Tab-Based Navigation
- **Overview Tab**: High-level capacity insights, team utilization, and workload distribution
- **Buckets Tab**: Detailed work breakdown by BAU, Deliver, and Improve categories
- **Trends Tab**: Historical ticket flow and effort trend analysis

### Key Metrics
- **Capacity Insights**: Four key metrics displayed at the top of the Overview tab:
  - Average Weekly Change: Track the rate of change in estimated effort (hours/week)
  - DTI Backlog Size: Full-time equivalent (FTE) engineers needed for 30 days to clear DTI requests
  - Delivery Backlog: FTE engineers needed for 30 days to clear delivery work
  - Initiatives Backlog: FTE engineers needed for 30 days to clear improvement initiatives
- **Team Capacity Utilization**: Track team capacity and workload across engineering teams
  - Each team tile includes a Jira link button that opens a filtered view of all tickets for that team
  - JQL queries match the backend's team assignment logic for accurate filtering
- **Team Workload Distribution**: View open tickets and estimated effort by team and individual
- **Work Categories**: Organize work into BAU, Deliver, and Improve buckets
- **Ticket Flow Trends**: Visualize ticket creation and resolution trends over time
- **Effort Trend Analysis**: Weekly breakdown of effort added vs removed with net change tracking

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
   PORT=5100
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

   The API will be running at http://localhost:5100

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

   The application will open at http://localhost:3100

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
Fetches capacity planning data including team workload, ticket flow, effort trends, and capacity metrics.

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
    "hoursPerDay": 6,
    "avgWeeklyEffortChange": 15
  },
  "teamCapacity": { ... },
  "assigneeWorkload": [ ... ],
  "ticketFlow": [ ... ],
  "effortTrend": [
    {
      "week": "Week 1",
      "label": "2025-01-09 to 2025-01-16",
      "startDate": "2025-01-09",
      "endDate": "2025-01-16",
      "effortAdded": 120,
      "effortRemoved": 80,
      "netEffortChange": 40,
      "ticketsCreated": 15,
      "ticketsResolved": 10
    }
  ],
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

**Current Team Configuration:**
- **DBA**: 2 engineers (Garvin Wong, Adrian Mazur)
- **DevOps**: 4 engineers (Phill Dellow, Vakhtangi Mestvirishvili, Robert Higgins, Alex Eastlake)
- **Technology Operations**: 3 engineers (Mark Fairmaid, Ann Winston, Graham Wilson)
- **Private Cloud**: 5 engineers (Keith Wijey-Wardna, Mike Cave, Andrew Sumner, Sundaresan Thandvan, Suresh Kaniyappa)

### Team Assignment Rules

The system automatically assigns tickets to teams based on the following logic (applied in priority order):

**Priority 1 - DBA Team Assignment:**
- **All tickets assigned to Garvin Wong or Adrian Mazur are automatically assigned to the DBA team**, regardless of which project they belong to
- This ensures all DBA-related work is tracked under the DBA team capacity

**Priority 2 - Project-Based Assignment:**
- **DTI Project**: Uses the Team custom field (`customfield_10001`)
- **INFRA Project**: Assigned to Technology Operations team
- **DevOps Project**: Assigned to DevOps team

**Priority 3 - Assignee-Based Fallback:**
- If a ticket doesn't have a team field set (or would be assigned to "Other"), the system checks if the assignee is a member of any configured team
- **If the assignee is a team member, the ticket is automatically assigned to their team**
- This ensures work assigned to team members is always tracked under their team's capacity, regardless of project or missing team fields

**Priority 4 - Other:**
- Only tickets with unassigned or non-team-member assignees are categorized as "Other"

**Benefits:**
- Accurate capacity tracking by ensuring work follows team members
- Prevents team member work from being misclassified as "Other"
- Maintains team accountability regardless of project structure

**Validation:**
The system includes built-in validation to ensure no ticket is counted in multiple teams. Each API request logs validation results confirming unique ticket assignment.

### Work Estimation Rules

The system uses default estimates for unestimated tickets:

**User Stories:**
- To Do: 10 hours
- In Progress: 5 hours

**Tasks:**
- To Do: 8 hours
- In Progress: 4 hours

**DTI Higher Complexity** (Build/Deployment Issues, Connectivity, Branch Request):
- To Do: 6 hours
- In Progress: 3 hours

**DTI Standard** (All other DTI request types):
- To Do: 4 hours
- In Progress: 2 hours

**Done tickets:** 0 hours

### Discovery Idea Grouping

The system groups epics under their parent Discovery Ideas (TR project items) based on Jira issue links. Discovery Ideas are categorized as:

**Recognized Issue Types:**
- **Deliver** / **Delivery**: Delivery initiatives
- **Initiative**: Strategic initiatives
- **Improve**: Improvement initiatives

Only epics linked to TR project items with these issue types will be grouped under Discovery Ideas in the capacity planning view. Epics without such links will appear in the "Other" category.

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
- Make sure the backend server is running on port 5100
- Check if another process is using port 5100

### Frontend Issues

**Error: "Proxy error"**
- Ensure the backend server is running
- Check the proxy configuration in `frontend/package.json`

**Empty or no data displayed**
- Check browser console for errors
- Verify the backend API is returning data by visiting http://localhost:5100/api/health

## License

Extracted from the jira-dashboard project for standalone use.
