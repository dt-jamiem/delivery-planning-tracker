const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Jira API Configuration
const jiraAPI = axios.create({
  baseURL: `${process.env.JIRA_URL}/rest/api/3`,
  auth: {
    username: process.env.JIRA_EMAIL,
    password: process.env.JIRA_API_TOKEN
  },
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Delivery Planning Tracker API is running' });
});

// Capacity Planning endpoint
app.get('/api/capacity-planning', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const date = new Date();
    date.setDate(date.getDate() - days);
    const dateStr = date.toISOString().split('T')[0];

    // Team capacity configuration
    const teamCapacity = {
      'DBA': {
        engineers: 2,
        members: ['Garvin Wong', 'Adrian Mazur']
      },
      'DevOps': {
        engineers: 6,
        members: ['Andrew Sumner', 'Phill Dellow', 'Vakhtangi Mestvirishvili', 'Sundaresan Thandvan', 'Robert Higgins', 'Alex Eastlake']
      },
      'Technology Operations': {
        engineers: 4,
        members: ['Mark Fairmaid', 'Ann Winston', 'Suresh Kaniyappa', 'Graham Wilson']
      },
      'Private Cloud': {
        engineers: 2,
        members: ['Keith Wijey-Wardna', 'Mike Cave']
      }
    };

    // Calculate available capacity per team
    // Assuming 6 hours productive work per day
    const hoursPerDay = 6;
    const workingDaysInPeriod = Math.floor(days * 5 / 7); // Approximate working days (excluding weekends)

    const teamAvailableCapacity = {};
    Object.keys(teamCapacity).forEach(teamName => {
      const engineers = teamCapacity[teamName].engineers;
      teamAvailableCapacity[teamName] = engineers * workingDaysInPeriod * hoursPerDay;
    });

    console.log(`\nCapacity Calculation:`);
    console.log(`- Period: ${days} days (${workingDaysInPeriod} working days)`);
    console.log(`- Hours per day: ${hoursPerDay}`);
    Object.keys(teamAvailableCapacity).forEach(team => {
      console.log(`- ${team}: ${teamCapacity[team].engineers} engineers × ${workingDaysInPeriod} days × ${hoursPerDay}h = ${teamAvailableCapacity[team]}h available capacity`);
    });

    // Base JQL for capacity planning - aligned with dashboard filters
    const baseJQL = '(Project IN (DEVOPS, TechOps, "Technology Group", "Technology Roadmap") OR (Project = DTI AND "Team[Team]" IN (01c3b859-1307-41e3-8a88-24c701dd1713, 9888ca76-8551-47b3-813f-4bf5df9e9762, 9b7aba3a-a76b-46b8-8a3b-658baad7c1a3, a092fa48-f541-4358-90b8-ba6caccceb72)))';

    // Fetch open tickets for current workload with pagination
    const openTicketsJQL = `${baseJQL} AND statusCategory NOT IN (Done) ORDER BY created DESC`;
    let openIssues = [];
    let nextPageToken = null;
    do {
      const requestBody = {
        jql: openTicketsJQL,
        maxResults: 50,
        fields: ['summary', 'status', 'assignee', 'created', 'updated', 'issuetype', 'priority', 'resolutiondate', 'timeoriginalestimate', 'project', 'parent', 'issuelinks', 'customfield_10001', 'customfield_10010', 'customfield_10083']
      };
      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }
      const response = await jiraAPI.post('/search/jql', requestBody);
      openIssues = openIssues.concat(response.data.issues || []);
      nextPageToken = response.data.nextPageToken;
      console.log(`Fetched ${response.data.issues?.length || 0} open tickets, total so far: ${openIssues.length}, isLast: ${response.data.isLast}`);
      if (response.data.isLast || openIssues.length >= 5000) {
        break;
      }
    } while (nextPageToken);

    // Fetch recently created tickets with pagination
    const recentTicketsJQL = `${baseJQL} AND created >= "${dateStr}" ORDER BY created DESC`;
    let recentIssues = [];
    nextPageToken = null;
    do {
      const requestBody = {
        jql: recentTicketsJQL,
        maxResults: 50,
        fields: ['summary', 'status', 'assignee', 'created', 'updated', 'issuetype', 'priority', 'resolutiondate', 'timeoriginalestimate', 'project', 'customfield_10010']
      };
      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }
      const response = await jiraAPI.post('/search/jql', requestBody);
      recentIssues = recentIssues.concat(response.data.issues || []);
      nextPageToken = response.data.nextPageToken;
      if (response.data.isLast || recentIssues.length >= 5000) {
        break;
      }
    } while (nextPageToken);

    // Fetch recently resolved tickets with pagination
    const resolvedTicketsJQL = `${baseJQL} AND statusCategory IN (Done) AND resolutiondate >= "${dateStr}" ORDER BY resolutiondate DESC`;
    let resolvedIssues = [];
    nextPageToken = null;
    do {
      const requestBody = {
        jql: resolvedTicketsJQL,
        maxResults: 50,
        fields: ['summary', 'status', 'assignee', 'created', 'updated', 'issuetype', 'priority', 'resolutiondate', 'timeoriginalestimate', 'project', 'customfield_10010']
      };
      if (nextPageToken) {
        requestBody.nextPageToken = nextPageToken;
      }
      const response = await jiraAPI.post('/search/jql', requestBody);
      resolvedIssues = resolvedIssues.concat(response.data.issues || []);
      nextPageToken = response.data.nextPageToken;
      if (response.data.isLast || resolvedIssues.length >= 5000) {
        break;
      }
    } while (nextPageToken);

    // Fetch Discovery Ideas from Technology Roadmap
    const discoveryIdeasJQL = 'Project = TR ORDER BY created DESC';
    let discoveryIdeas = [];
    nextPageToken = null;
    try {
      do {
        const requestBody = {
          jql: discoveryIdeasJQL,
          maxResults: 50,
          fields: ['summary', 'status', 'created', 'updated', 'issuetype', 'project', 'issuelinks']
        };
        if (nextPageToken) {
          requestBody.nextPageToken = nextPageToken;
        }
        const response = await jiraAPI.post('/search/jql', requestBody);
        discoveryIdeas = discoveryIdeas.concat(response.data.issues || []);
        nextPageToken = response.data.nextPageToken;
        if (response.data.isLast || discoveryIdeas.length >= 200) {
          break;
        }
      } while (nextPageToken);

      console.log(`TR Query returned ${discoveryIdeas.length} items`);
    } catch (err) {
      console.error('Error fetching TR items:', err.message);
      discoveryIdeas = [];
    }

    console.log(`Capacity Planning: Collected ${openIssues.length} open tickets, ${recentIssues.length} recent tickets, ${resolvedIssues.length} resolved tickets, ${discoveryIdeas.length} discovery ideas`);

    // Helper function to calculate default estimate
    const getDefaultEstimate = (issue) => {
      if (issue.fields.timeoriginalestimate) {
        return 0;
      }

      const projectKey = issue.fields.project?.key;
      const issueTypeName = issue.fields.issuetype?.name;
      const statusCategory = issue.fields.status?.statusCategory?.name;

      const qualifies = projectKey === 'DTI' ||
                       issueTypeName === 'Story' ||
                       issueTypeName === 'Task';

      if (!qualifies) {
        return 0;
      }

      const isSoftwareItem = issueTypeName === 'Story' || issueTypeName === 'Task';
      const requestType = issue.fields.customfield_10010?.requestType?.name;
      const higherComplexityTypes = [
        'Build or Deployment Issues',
        'Connectivity Issue',
        'Branch Request'
      ];
      const isHigherComplexity = projectKey === 'DTI' &&
                                 requestType &&
                                 higherComplexityTypes.includes(requestType);

      if (statusCategory === 'To Do') {
        if (isSoftwareItem) {
          return 8 * 3600;
        }
        return isHigherComplexity ? 6 * 3600 : 4 * 3600;
      } else if (statusCategory === 'In Progress') {
        if (isSoftwareItem) {
          return 4 * 3600;
        }
        return isHigherComplexity ? 3 * 3600 : 2 * 3600;
      } else {
        return 0;
      }
    };

    // Calculate team workload
    const assigneeWorkload = {};
    const individualAssignees = {};

    openIssues.forEach(issue => {
      if (issue.fields.issuetype?.name === 'Epic') {
        return;
      }

      let teamName;
      const assigneeName = issue.fields.assignee?.displayName || 'Unassigned';

      if (issue.fields.project?.key === 'DTI') {
        const teamField = issue.fields.customfield_10001;
        if (teamField && teamField.name) {
          teamName = teamField.name;
        } else if (teamField && typeof teamField === 'string') {
          teamName = teamField;
        } else {
          teamName = 'Unassigned Team';
        }

        if (teamName === 'Unassigned Team') {
          const assigneeName = issue.fields.assignee?.displayName || '';
          if (assigneeName === 'Garvin Wong' || assigneeName === 'Adrian Mazur') {
            teamName = 'DBA';
          }
        }
      } else {
        const projectKey = issue.fields.project?.key;
        const teamField = issue.fields.customfield_10001;

        if (teamField && teamField.name) {
          teamName = teamField.name;
        } else if (teamField && typeof teamField === 'string') {
          teamName = teamField;
        } else if (projectKey === 'INFRA') {
          teamName = 'Technology Operations';
        } else if (projectKey === 'DevOps') {
          teamName = 'DevOps';
        } else {
          teamName = 'Other';
        }
      }

      if (issue.fields.project?.key === 'DTI' && teamName === 'Unassigned Team') {
        teamName = 'Other';
      }

      if (!assigneeWorkload[teamName]) {
        assigneeWorkload[teamName] = {
          openTickets: 0,
          byPriority: {},
          oldestTicket: null,
          avgAge: 0,
          tickets: [],
          estimateSeconds: 0,
          defaultSeconds: 0,
          ticketsWithEstimate: 0,
          ticketsWithDefault: 0
        };
      }
      assigneeWorkload[teamName].openTickets++;

      const priority = issue.fields.priority?.name || 'None';
      assigneeWorkload[teamName].byPriority[priority] = (assigneeWorkload[teamName].byPriority[priority] || 0) + 1;

      const ticketAge = Math.floor((new Date() - new Date(issue.fields.created)) / (1000 * 60 * 60 * 24));
      assigneeWorkload[teamName].tickets.push(ticketAge);

      if (!assigneeWorkload[teamName].oldestTicket || ticketAge > assigneeWorkload[teamName].oldestTicket) {
        assigneeWorkload[teamName].oldestTicket = ticketAge;
      }

      if (issue.fields.timeoriginalestimate) {
        assigneeWorkload[teamName].estimateSeconds += issue.fields.timeoriginalestimate;
        assigneeWorkload[teamName].ticketsWithEstimate++;
      } else {
        const defaultEst = getDefaultEstimate(issue);
        if (defaultEst > 0) {
          assigneeWorkload[teamName].defaultSeconds += defaultEst;
          assigneeWorkload[teamName].ticketsWithDefault++;
        }
      }

      // Track individual assignees
      if (!individualAssignees[teamName]) {
        individualAssignees[teamName] = {};
      }

      if (!individualAssignees[teamName][assigneeName]) {
        individualAssignees[teamName][assigneeName] = {
          openTickets: 0,
          byPriority: {},
          oldestTicket: null,
          avgAge: 0,
          tickets: [],
          estimateSeconds: 0,
          defaultSeconds: 0,
          ticketsWithEstimate: 0,
          ticketsWithDefault: 0
        };
      }

      individualAssignees[teamName][assigneeName].openTickets++;
      individualAssignees[teamName][assigneeName].byPriority[priority] =
        (individualAssignees[teamName][assigneeName].byPriority[priority] || 0) + 1;
      individualAssignees[teamName][assigneeName].tickets.push(ticketAge);

      if (!individualAssignees[teamName][assigneeName].oldestTicket ||
          ticketAge > individualAssignees[teamName][assigneeName].oldestTicket) {
        individualAssignees[teamName][assigneeName].oldestTicket = ticketAge;
      }

      if (issue.fields.timeoriginalestimate) {
        individualAssignees[teamName][assigneeName].estimateSeconds += issue.fields.timeoriginalestimate;
        individualAssignees[teamName][assigneeName].ticketsWithEstimate++;
      } else {
        const defaultEst = getDefaultEstimate(issue);
        if (defaultEst > 0) {
          individualAssignees[teamName][assigneeName].defaultSeconds += defaultEst;
          individualAssignees[teamName][assigneeName].ticketsWithDefault++;
        }
      }
    });

    // Calculate averages and convert to hours
    Object.keys(assigneeWorkload).forEach(teamName => {
      const ages = assigneeWorkload[teamName].tickets;
      if (ages.length > 0) {
        assigneeWorkload[teamName].avgAge = Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
      }
      delete assigneeWorkload[teamName].tickets;

      assigneeWorkload[teamName].estimateHours = Math.round(assigneeWorkload[teamName].estimateSeconds / 3600);
      assigneeWorkload[teamName].defaultHours = Math.round(assigneeWorkload[teamName].defaultSeconds / 3600);
      assigneeWorkload[teamName].totalHours = assigneeWorkload[teamName].estimateHours + assigneeWorkload[teamName].defaultHours;

      delete assigneeWorkload[teamName].estimateSeconds;
      delete assigneeWorkload[teamName].defaultSeconds;
    });

    Object.keys(individualAssignees).forEach(teamName => {
      Object.keys(individualAssignees[teamName]).forEach(assigneeName => {
        const assignee = individualAssignees[teamName][assigneeName];
        const ages = assignee.tickets;
        if (ages.length > 0) {
          assignee.avgAge = Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
        }
        delete assignee.tickets;

        assignee.estimateHours = Math.round(assignee.estimateSeconds / 3600);
        assignee.defaultHours = Math.round(assignee.defaultSeconds / 3600);
        assignee.totalHours = assignee.estimateHours + assignee.defaultHours;

        delete assignee.estimateSeconds;
        delete assignee.defaultSeconds;
      });
    });

    // Calculate resolution metrics
    let totalResolutionTime = 0;
    let resolutionCount = 0;
    resolvedIssues.forEach(issue => {
      if (issue.fields.created && issue.fields.resolutiondate) {
        const created = new Date(issue.fields.created);
        const resolved = new Date(issue.fields.resolutiondate);
        const resolutionTime = Math.floor((resolved - created) / (1000 * 60 * 60 * 24));
        totalResolutionTime += resolutionTime;
        resolutionCount++;
      }
    });

    const avgResolutionTime = resolutionCount > 0 ? Math.round(totalResolutionTime / resolutionCount) : 0;

    // Calculate ticket flow by day
    const ticketFlow = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      ticketFlow[dateKey] = { created: 0, resolved: 0 };
    }

    recentIssues.forEach(issue => {
      const createdDate = issue.fields.created.split('T')[0];
      if (ticketFlow[createdDate]) {
        ticketFlow[createdDate].created++;
      }
    });

    resolvedIssues.forEach(issue => {
      if (issue.fields.resolutiondate) {
        const resolvedDate = issue.fields.resolutiondate.split('T')[0];
        if (ticketFlow[resolvedDate]) {
          ticketFlow[resolvedDate].resolved++;
        }
      }
    });

    const flowData = Object.entries(ticketFlow)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const weeksInPeriod = Math.ceil(days / 7);
    const velocity = weeksInPeriod > 0 ? Math.round(resolvedIssues.length / weeksInPeriod) : 0;

    // Create hierarchical structure
    const sortedAssignees = Object.entries(assigneeWorkload)
      .map(([teamName, teamData]) => {
        const assignees = individualAssignees[teamName] || {};
        const children = Object.entries(assignees)
          .map(([assigneeName, assigneeData]) => ({
            name: assigneeName,
            ...assigneeData,
            isAssignee: true
          }))
          .sort((a, b) => {
            if (b.totalHours !== a.totalHours) {
              return b.totalHours - a.totalHours;
            }
            return b.openTickets - a.openTickets;
          });

        return {
          name: teamName,
          ...teamData,
          isTeam: true,
          children: children
        };
      })
      .sort((a, b) => {
        if (b.totalHours !== a.totalHours) {
          return b.totalHours - a.totalHours;
        }
        return b.openTickets - a.openTickets;
      });

    // Helper function to find Discovery Idea
    const findDiscoveryIdea = (issue) => {
      if (!issue.fields.issuelinks || issue.fields.issuelinks.length === 0) {
        return null;
      }

      for (const link of issue.fields.issuelinks) {
        const linkedIssue = link.inwardIssue || link.outwardIssue;
        if (linkedIssue) {
          const issueType = linkedIssue.fields?.issuetype?.name;
          const projectKey = linkedIssue.key?.split('-')[0];

          if (projectKey === 'TR' && (issueType === 'Deliver' || issueType === 'Delivery' || issueType === 'Initiative' || issueType === 'Improve')) {
            return {
              key: linkedIssue.key,
              summary: linkedIssue.fields.summary
            };
          }
        }
      }
      return null;
    };

    // Fetch Epic details
    const epicKeys = new Set();
    openIssues.forEach(issue => {
      if (issue.fields.parent?.key) {
        epicKeys.add(issue.fields.parent.key);
      }
    });

    const epics = [];
    if (epicKeys.size > 0) {
      const epicKeysArray = Array.from(epicKeys);
      for (let i = 0; i < epicKeysArray.length; i += 100) {
        const batch = epicKeysArray.slice(i, i + 100);
        const epicJQL = `key IN (${batch.join(',')})`;
        try {
          const epicResponse = await jiraAPI.post('/search/jql', {
            jql: epicJQL,
            maxResults: 100,
            fields: ['summary', 'issuetype', 'issuelinks']
          });
          epics.push(...(epicResponse.data.issues || []));
        } catch (err) {
          console.error('Error fetching epic details:', err.message);
        }
      }
    }

    const epicToDiscoveryIdea = {};
    epics.forEach(epic => {
      const discoveryIdea = findDiscoveryIdea(epic);
      if (discoveryIdea) {
        epicToDiscoveryIdea[epic.key] = discoveryIdea;
      }
    });

    openIssues.forEach(issue => {
      const parentEpic = issue.fields.parent?.key;
      if (parentEpic && !epicToDiscoveryIdea[parentEpic]) {
        const discoveryIdea = findDiscoveryIdea(issue);
        if (discoveryIdea) {
          epicToDiscoveryIdea[parentEpic] = discoveryIdea;
        }
      }
    });

    // Group work hierarchically
    const parentGrouping = {};
    openIssues.forEach(issue => {
      const projectKey = issue.fields.project?.key;
      const issueTypeName = issue.fields.issuetype?.name;
      let groupKey, groupName, groupType, parentGroup;

      const parentEpic = issue.fields.parent?.key;

      if (parentEpic && epicToDiscoveryIdea[parentEpic]) {
        groupKey = parentEpic;
        groupName = `${issue.fields.parent.key}: ${issue.fields.parent.fields?.summary || 'Unknown'}`;
        groupType = 'Epic';
        parentGroup = `${epicToDiscoveryIdea[parentEpic].key}: ${epicToDiscoveryIdea[parentEpic].summary}`;
      } else {
        const discoveryIdea = findDiscoveryIdea(issue);
        if (discoveryIdea) {
          if (issue.fields.parent) {
            groupKey = issue.fields.parent.key;
            groupName = `${issue.fields.parent.key}: ${issue.fields.parent.fields?.summary || 'Unknown'}`;
            groupType = 'Epic';
            parentGroup = `${discoveryIdea.key}: ${discoveryIdea.summary}`;
          } else {
            groupKey = issue.key;
            groupName = `${issue.key}: ${issue.fields.summary}`;
            groupType = issueTypeName;
            parentGroup = `${discoveryIdea.key}: ${discoveryIdea.summary}`;
          }
        } else if (projectKey === 'DTI') {
          const teamField = issue.fields.customfield_10001;
          let teamName = 'Unassigned Team';

          if (teamField && teamField.name) {
            teamName = teamField.name;
          } else if (teamField && typeof teamField === 'string') {
            teamName = teamField;
          }

          if (teamName === 'Unassigned Team') {
            const assigneeName = issue.fields.assignee?.displayName || '';
            if (assigneeName === 'Garvin Wong' || assigneeName === 'Adrian Mazur') {
              teamName = 'DBA';
            }
          }

          if (issue.fields.parent) {
            groupKey = issue.fields.parent.key;
            groupName = `${issue.fields.parent.key}: ${issue.fields.parent.fields?.summary || 'Unknown'}`;
            groupType = 'Epic';
            parentGroup = `DTI-Team: ${teamName}`;
          } else {
            groupKey = `DTI-${issueTypeName}`;
            groupName = `DTI: ${issueTypeName}`;
            groupType = 'Issue Type';
            parentGroup = `DTI-Team: ${teamName}`;
          }
        } else if (projectKey === 'INFRA') {
          const teamName = 'Technology Operations';
          if (issue.fields.parent) {
            groupKey = issue.fields.parent.key;
            groupName = `${issue.fields.parent.key}: ${issue.fields.parent.fields?.summary || 'Unknown'}`;
            groupType = 'Epic';
            parentGroup = `INFRA-Team: ${teamName}`;
          } else {
            groupKey = `INFRA-${issueTypeName}`;
            groupName = `INFRA: ${issueTypeName}`;
            groupType = 'Issue Type';
            parentGroup = `INFRA-Team: ${teamName}`;
          }
        } else if (projectKey === 'DevOps') {
          const teamName = 'DevOps';
          if (issue.fields.parent) {
            groupKey = issue.fields.parent.key;
            groupName = `${issue.fields.parent.key}: ${issue.fields.parent.fields?.summary || 'Unknown'}`;
            groupType = 'Epic';
            parentGroup = `DevOps-Team: ${teamName}`;
          } else {
            groupKey = `DevOps-${issueTypeName}`;
            groupName = `DevOps: ${issueTypeName}`;
            groupType = 'Issue Type';
            parentGroup = `DevOps-Team: ${teamName}`;
          }
        } else {
          const teamName = 'Other';
          if (issue.fields.parent) {
            groupKey = issue.fields.parent.key;
            groupName = `${issue.fields.parent.key}: ${issue.fields.parent.fields?.summary || 'Unknown'}`;
            groupType = 'Epic';
            parentGroup = `Other-Team: ${teamName}`;
          } else {
            groupKey = `${projectKey}-${issueTypeName}`;
            groupName = `${projectKey}: ${issueTypeName}`;
            groupType = 'Issue Type';
            parentGroup = `Other-Team: ${teamName}`;
          }
        }
      }

      if (!parentGrouping[groupKey]) {
        parentGrouping[groupKey] = {
          name: groupName,
          type: groupType,
          parentGroup: parentGroup,
          tickets: 0,
          estimateHours: 0,
          defaultHours: 0,
          totalHours: 0
        };
      }

      parentGrouping[groupKey].tickets++;

      if (issue.fields.timeoriginalestimate) {
        parentGrouping[groupKey].estimateHours += Math.round(issue.fields.timeoriginalestimate / 3600);
      } else {
        const defaultEst = getDefaultEstimate(issue);
        if (defaultEst > 0) {
          parentGrouping[groupKey].defaultHours += Math.round(defaultEst / 3600);
        }
      }
      parentGrouping[groupKey].totalHours = parentGrouping[groupKey].estimateHours + parentGrouping[groupKey].defaultHours;
    });

    // Create hierarchical structure
    const hierarchicalGroups = [];
    const groupsByParent = {};

    Object.entries(parentGrouping).forEach(([key, data]) => {
      if (data.parentGroup) {
        if (!groupsByParent[data.parentGroup]) {
          groupsByParent[data.parentGroup] = [];
        }
        groupsByParent[data.parentGroup].push({ key, ...data });
      } else {
        hierarchicalGroups.push({ key, ...data, children: [] });
      }
    });

    Object.entries(groupsByParent).forEach(([parentName, children]) => {
      children.sort((a, b) => b.totalHours - a.totalHours);

      const parentTotals = children.reduce((acc, child) => ({
        tickets: acc.tickets + child.tickets,
        estimateHours: acc.estimateHours + child.estimateHours,
        defaultHours: acc.defaultHours + child.defaultHours,
        totalHours: acc.totalHours + child.totalHours
      }), { tickets: 0, estimateHours: 0, defaultHours: 0, totalHours: 0 });

      hierarchicalGroups.push({
        key: parentName,
        name: parentName,
        type: 'Project Group',
        ...parentTotals,
        children: children
      });
    });

    // Add Discovery Ideas
    discoveryIdeas.forEach(idea => {
      const ideaKey = idea.key;
      const ideaName = `${idea.key}: ${idea.fields.summary}`;
      const ideaType = idea.fields.issuetype?.name || 'Initiative';

      const existingGroup = hierarchicalGroups.find(g => g.name === ideaName || g.key === ideaKey);
      if (existingGroup) {
        existingGroup.type = ideaType;
      } else {
        hierarchicalGroups.push({
          key: ideaKey,
          name: ideaName,
          type: ideaType,
          tickets: 0,
          estimateHours: 0,
          defaultHours: 0,
          totalHours: 0,
          children: []
        });
      }
    });

    // Group teams under project groups
    const dtiTeamGroups = hierarchicalGroups.filter(g => g.key && g.key.startsWith('DTI-Team:'));
    if (dtiTeamGroups.length > 0) {
      dtiTeamGroups.forEach(teamGroup => {
        const index = hierarchicalGroups.findIndex(g => g.key === teamGroup.key);
        if (index > -1) {
          hierarchicalGroups.splice(index, 1);
        }
      });

      dtiTeamGroups.forEach(teamGroup => {
        teamGroup.name = teamGroup.name.replace('DTI-Team: ', '');
        teamGroup.type = 'Team';
      });

      dtiTeamGroups.sort((a, b) => b.totalHours - a.totalHours);

      const dtiTotals = dtiTeamGroups.reduce((acc, team) => ({
        tickets: acc.tickets + team.tickets,
        estimateHours: acc.estimateHours + team.estimateHours,
        defaultHours: acc.defaultHours + team.defaultHours,
        totalHours: acc.totalHours + team.totalHours
      }), { tickets: 0, estimateHours: 0, defaultHours: 0, totalHours: 0 });

      hierarchicalGroups.push({
        key: 'DTI Requests',
        name: 'DTI Requests',
        type: 'Project Group',
        ...dtiTotals,
        children: dtiTeamGroups
      });
    }

    // Similar grouping for INFRA, DevOps, and Other teams
    ['INFRA', 'DevOps', 'Other'].forEach(prefix => {
      const teamGroups = hierarchicalGroups.filter(g => g.key && g.key.startsWith(`${prefix}-Team:`));
      if (teamGroups.length > 0) {
        teamGroups.forEach(teamGroup => {
          const index = hierarchicalGroups.findIndex(g => g.key === teamGroup.key);
          if (index > -1) {
            hierarchicalGroups.splice(index, 1);
          }
        });

        teamGroups.forEach(teamGroup => {
          teamGroup.name = teamGroup.name.replace(`${prefix}-Team: `, '');
          teamGroup.type = 'Team';
        });

        teamGroups.sort((a, b) => b.totalHours - a.totalHours);

        const totals = teamGroups.reduce((acc, team) => ({
          tickets: acc.tickets + team.tickets,
          estimateHours: acc.estimateHours + team.estimateHours,
          defaultHours: acc.defaultHours + team.defaultHours,
          totalHours: acc.totalHours + team.totalHours
        }), { tickets: 0, estimateHours: 0, defaultHours: 0, totalHours: 0 });

        const groupName = prefix === 'INFRA' ? 'Technology Operations' : prefix;
        hierarchicalGroups.push({
          key: groupName,
          name: groupName,
          type: 'Project Group',
          ...totals,
          children: teamGroups
        });
      }
    });

    const filteredGroups = hierarchicalGroups.filter(group => group.type !== 'Issue Type');

    const bauGroups = filteredGroups.filter(group =>
      group.name === 'DTI Requests' || group.key === 'DTI Requests'
    ).sort((a, b) => b.totalHours - a.totalHours);

    const isInitiativeRelated = (group) => {
      if (group.type === 'Initiative') return true;
      if (group.children && group.children.length > 0) {
        return group.children.some(child => child.type === 'Initiative');
      }
      return false;
    };

    const improveGroups = filteredGroups.filter(group =>
      isInitiativeRelated(group)
    ).sort((a, b) => b.totalHours - a.totalHours);

    const deliverGroups = filteredGroups.filter(group => {
      const isBau = group.name === 'DTI Requests' || group.key === 'DTI Requests';
      const isImprove = isInitiativeRelated(group);
      return !isBau && !isImprove;
    }).sort((a, b) => b.totalHours - a.totalHours);

    // Calculate capacity utilization
    const teamCapacityMetrics = {};
    Object.keys(teamCapacity).forEach(teamName => {
      const teamWorkload = assigneeWorkload[teamName];
      const availableCapacity = teamAvailableCapacity[teamName];

      if (teamWorkload) {
        const utilizationPercent = availableCapacity > 0
          ? Math.round((teamWorkload.totalHours / availableCapacity) * 100)
          : 0;

        teamCapacityMetrics[teamName] = {
          engineers: teamCapacity[teamName].engineers,
          members: teamCapacity[teamName].members,
          availableCapacityHours: availableCapacity,
          workloadHours: teamWorkload.totalHours,
          utilizationPercent: utilizationPercent,
          openTickets: teamWorkload.openTickets,
          estimateHours: teamWorkload.estimateHours,
          defaultHours: teamWorkload.defaultHours
        };
      } else {
        teamCapacityMetrics[teamName] = {
          engineers: teamCapacity[teamName].engineers,
          members: teamCapacity[teamName].members,
          availableCapacityHours: availableCapacity,
          workloadHours: 0,
          utilizationPercent: 0,
          openTickets: 0,
          estimateHours: 0,
          defaultHours: 0
        };
      }
    });

    console.log(`\nTeam Capacity Utilization:`);
    Object.keys(teamCapacityMetrics).forEach(team => {
      const metrics = teamCapacityMetrics[team];
      console.log(`- ${team}: ${metrics.workloadHours}h / ${metrics.availableCapacityHours}h = ${metrics.utilizationPercent}% utilization`);
    });

    res.json({
      summary: {
        totalOpenTickets: openIssues.length,
        ticketsCreated: recentIssues.length,
        ticketsResolved: resolvedIssues.length,
        avgResolutionTime: avgResolutionTime,
        velocity: velocity,
        period: days,
        workingDays: workingDaysInPeriod,
        hoursPerDay: hoursPerDay
      },
      teamCapacity: teamCapacityMetrics,
      assigneeWorkload: sortedAssignees,
      ticketFlow: flowData,
      parentGrouping: {
        bau: bauGroups,
        deliver: deliverGroups,
        improve: improveGroups
      }
    });

  } catch (error) {
    console.error('Error fetching capacity planning data:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch capacity planning data',
      details: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Delivery Planning Tracker API running on http://localhost:${PORT}`);
  console.log(`Connecting to Jira: ${process.env.JIRA_URL}`);
});
