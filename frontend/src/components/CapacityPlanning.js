import React, { useState } from 'react';
import './CapacityPlanning.css';

function CapacityPlanning({ data }) {
  const [expandedGroups, setExpandedGroups] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

  if (!data) {
    return (
      <div className="capacity-planning">
        <h2>Capacity Planning</h2>
        <div className="loading-placeholder">
          <p>Loading capacity data...</p>
        </div>
      </div>
    );
  }

  const { summary, assigneeWorkload, ticketFlow, parentGrouping, teamCapacity, effortTrend } = data;

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Helper function to identify partial capacity members (< 100% FTE)
  const partialCapacityMembers = [
    'Alex Eastlake',    // Private Cloud - 50%
    'Mark Fairmaid'     // Technology Operations - 50%
  ];

  const isPartialCapacity = (memberName) => {
    return partialCapacityMembers.includes(memberName);
  };

  // Generate Jira URL for team filter - matches backend team assignment logic
  const generateJiraTeamUrl = (teamName, members) => {
    const baseUrl = 'https://datatorque.atlassian.net/issues/';

    // Build assignee list for team members
    const assigneeList = members.map(m => `"${m}"`).join(', ');

    let jql = '';

    // Build team-specific JQL matching backend priority logic
    // Use project keys: TG (Technology Group), TR (Technology Roadmap)
    if (teamName === 'DBA') {
      // DBA: Team UUID OR assigned to DBA members
      jql = `("Team[Team]" = a092fa48-f541-4358-90b8-ba6caccceb72 OR (project IN (TG, TechOps, DEVOPS, DBA, DTI, INFRA, TR) AND assignee IN (${assigneeList}))) AND statusCategory != Done AND issuetype NOT IN (Epic, subTaskIssueTypes())`;
    } else if (teamName === 'DevOps') {
      // DevOps: Based on baseJQL projects + Team field + assignee fallback (excluding DBA members but allowing unassigned)
      // Note: Add both "Phill Dellow" and "Phillip Dellow" to catch name variations
      const devOpsAssignees = `"Phill Dellow", "Phillip Dellow", "Vakhtangi Mestvirishvili", "Robert Higgins", "Alex Eastlake"`;
      jql = `((project = DEVOPS OR "Team" = "DevOps" OR (project IN (TG, TechOps, DEVOPS, DBA, DTI, INFRA, TR) AND assignee IN (${devOpsAssignees})) OR (project IN (TG, TechOps, DEVOPS, DBA, DTI, INFRA, TR) AND "Team[Team]" = "9b7aba3a-a76b-46b8-8a3b-658baad7c1a3")) AND (assignee IS EMPTY OR assignee NOT IN ("Garvin Wong", "Adrian Mazur"))) AND issuetype NOT IN (Epic, subTaskIssueTypes()) AND statusCategory != Done`;
    } else if (teamName === 'Technology Operations') {
      // Tech Ops: INFRA project OR Team=Tech Ops OR assigned to Tech Ops members (excluding DBA members but allowing unassigned)
      jql = `((project = INFRA OR "Team" = "Technology Operations" OR (project IN (TG, TechOps, DEVOPS, DBA, DTI, INFRA, TR) AND assignee IN (${assigneeList})) OR (project IN (TG, TechOps, DEVOPS, DBA, DTI, INFRA, TR) AND "Team[Team]" = "01c3b859-1307-41e3-8a88-24c701dd1713")) AND (assignee IS EMPTY OR assignee NOT IN ("Garvin Wong", "Adrian Mazur"))) AND issuetype NOT IN (Epic, subTaskIssueTypes()) AND statusCategory != Done`;
    } else if (teamName === 'Private Cloud') {
      // Private Cloud: Team UUID OR assigned to team members
      jql = `("Team[Team]" = d38d3529-7bff-4e2c-a747-1e7f2d6e61e9 OR (project IN (TG, TechOps, DEVOPS, DBA, DTI, INFRA, TR) AND assignee IN (${assigneeList}))) AND statusCategory != Done AND issuetype NOT IN (Epic, subTaskIssueTypes())`;
    } else {
      // Fallback: assignee filter across all projects
      jql = `(project IN (TG, TechOps, DEVOPS, DBA, DTI, INFRA, TR) AND assignee IN (${assigneeList})) AND issuetype NOT IN (Epic, subTaskIssueTypes()) AND statusCategory != Done`;
    }

    return `${baseUrl}?jql=${encodeURIComponent(jql)}`;
  };

  // Helper function to render a parent grouping table section
  const renderGroupingSection = (groups, sectionTitle) => {
    if (!groups || groups.length === 0) return null;

    const maxParentWorkload = Math.max(...groups.map(g => g.totalHours || 0), 1);

    return (
      <div className="capacity-section">
        <h3>{sectionTitle}</h3>
        <div className="parent-grouping-table">
          <div className="parent-grouping-header">
            <div className="parent-col-name">Epic / Type</div>
            <div className="parent-col-type">Group Type</div>
            <div className="parent-col-tickets">Open Tickets</div>
            <div className="parent-col-estimated">Estimated (Hrs)</div>
            <div className="parent-col-guess">Guess (Hrs)</div>
            <div className="parent-col-total">Potential Total (Hrs)</div>
            <div className="parent-col-days">Potential Effort (Days)</div>
            <div className="parent-col-chart">Load</div>
          </div>
          {groups.map((group, index) => {
            const hasChildren = group.children && group.children.length > 0;
            const isExpanded = expandedGroups[group.key];

            return (
              <React.Fragment key={index}>
                {/* Parent/Group Row */}
                <div
                  className={`parent-grouping-row ${hasChildren ? 'parent-group clickable' : ''}`}
                  onClick={() => hasChildren && toggleGroup(group.key)}
                  style={{ cursor: hasChildren ? 'pointer' : 'default' }}
                >
                  <div className="parent-col-name">
                    {hasChildren && (
                      <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                    )}
                    {group.name}
                  </div>
                  <div className="parent-col-type">{group.type}</div>
                  <div className="parent-col-tickets">{group.tickets}</div>
                  <div className="parent-col-estimated">
                    {group.estimateHours > 0 ? group.estimateHours : '-'}
                  </div>
                  <div className="parent-col-guess">
                    {group.defaultHours > 0 ? group.defaultHours : '-'}
                  </div>
                  <div className="parent-col-total">
                    {group.totalHours > 0 ? group.totalHours : '-'}
                  </div>
                  <div className="parent-col-days">
                    {group.totalHours > 0 ? (group.totalHours / 6).toFixed(1) : '-'}
                  </div>
                  <div className="parent-col-chart">
                    <div className="parent-bar-container">
                      <div
                        className="parent-bar"
                        style={{ width: `${group.totalHours > 0 ? (group.totalHours / maxParentWorkload) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Child Rows */}
                {hasChildren && isExpanded && group.children.map((child, childIndex) => {
                  const childHasChildren = child.children && child.children.length > 0;
                  const isChildExpanded = expandedGroups[child.key];

                  return (
                    <React.Fragment key={`${index}-${childIndex}`}>
                      <div
                        className={`parent-grouping-row child-row ${childHasChildren ? 'clickable' : ''}`}
                        onClick={() => childHasChildren && toggleGroup(child.key)}
                        style={{ cursor: childHasChildren ? 'pointer' : 'default' }}
                      >
                        <div className="parent-col-name child-indent">
                          {childHasChildren && (
                            <span className="expand-icon">{isChildExpanded ? '▼' : '▶'}</span>
                          )}
                          {child.name}
                        </div>
                        <div className="parent-col-type">{child.type}</div>
                        <div className="parent-col-tickets">{child.tickets}</div>
                        <div className="parent-col-estimated">
                          {child.estimateHours > 0 ? child.estimateHours : '-'}
                        </div>
                        <div className="parent-col-guess">
                          {child.defaultHours > 0 ? child.defaultHours : '-'}
                        </div>
                        <div className="parent-col-total">
                          {child.totalHours > 0 ? child.totalHours : '-'}
                        </div>
                        <div className="parent-col-days">
                          {child.totalHours > 0 ? (child.totalHours / 6).toFixed(1) : '-'}
                        </div>
                        <div className="parent-col-chart">
                          <div className="parent-bar-container">
                            <div
                              className="parent-bar"
                              style={{ width: `${child.totalHours > 0 ? (child.totalHours / maxParentWorkload) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Grandchild Rows */}
                      {childHasChildren && isChildExpanded && child.children.map((grandchild, grandchildIndex) => (
                        <div key={`${index}-${childIndex}-${grandchildIndex}`} className="parent-grouping-row grandchild-row">
                          <div className="parent-col-name grandchild-indent">{grandchild.name}</div>
                          <div className="parent-col-type">{grandchild.type}</div>
                          <div className="parent-col-tickets">{grandchild.tickets}</div>
                          <div className="parent-col-estimated">
                            {grandchild.estimateHours > 0 ? grandchild.estimateHours : '-'}
                          </div>
                          <div className="parent-col-guess">
                            {grandchild.defaultHours > 0 ? grandchild.defaultHours : '-'}
                          </div>
                          <div className="parent-col-total">
                            {grandchild.totalHours > 0 ? grandchild.totalHours : '-'}
                          </div>
                          <div className="parent-col-days">
                            {grandchild.totalHours > 0 ? (grandchild.totalHours / 6).toFixed(1) : '-'}
                          </div>
                          <div className="parent-col-chart">
                            <div className="parent-bar-container">
                              <div
                                className="parent-bar"
                                style={{ width: `${grandchild.totalHours > 0 ? (grandchild.totalHours / maxParentWorkload) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  // Calculate max values for bar chart scaling (using total hours including defaults)
  const maxWorkload = Math.max(...assigneeWorkload.map(a => a.totalHours || 0), 1);

  // Find peak created/resolved for flow chart
  const maxCreated = Math.max(...ticketFlow.map(d => d.created), 1);
  const maxResolved = Math.max(...ticketFlow.map(d => d.resolved), 1);
  const maxFlow = Math.max(maxCreated, maxResolved);

  // Calculate net flow (created - resolved)
  const netFlow = summary.ticketsCreated - summary.ticketsResolved;
  const flowTrend = netFlow > 0 ? 'increasing' : netFlow < 0 ? 'decreasing' : 'stable';

  // Calculate backlog FTE for different work types (30 days * 6 hours per day = 180 hours)
  const hoursPerFTE30Days = 30 * 6;

  // DTI backlog (BAU)
  let dtiBacklogHours = 0;
  let dtiTicketCount = 0;
  if (parentGrouping && parentGrouping.bau) {
    const dtiRequests = parentGrouping.bau.find(group => group.name === 'DTI Requests' || group.key === 'DTI Requests');
    if (dtiRequests) {
      dtiBacklogHours = dtiRequests.totalHours || 0;
      dtiTicketCount = dtiRequests.tickets || 0;
    }
  }
  const dtiFTENeeded = dtiBacklogHours > 0 ? (dtiBacklogHours / hoursPerFTE30Days).toFixed(1) : 0;

  // Delivery backlog
  let deliveryBacklogHours = 0;
  let deliveryTicketCount = 0;
  if (parentGrouping && parentGrouping.deliver) {
    parentGrouping.deliver.forEach(group => {
      deliveryBacklogHours += group.totalHours || 0;
      deliveryTicketCount += group.tickets || 0;
    });
  }
  const deliveryFTENeeded = deliveryBacklogHours > 0 ? (deliveryBacklogHours / hoursPerFTE30Days).toFixed(1) : 0;

  // Initiatives backlog (Improve)
  let initiativesBacklogHours = 0;
  let initiativesTicketCount = 0;
  if (parentGrouping && parentGrouping.improve) {
    parentGrouping.improve.forEach(group => {
      initiativesBacklogHours += group.totalHours || 0;
      initiativesTicketCount += group.tickets || 0;
    });
  }
  const initiativesFTENeeded = initiativesBacklogHours > 0 ? (initiativesBacklogHours / hoursPerFTE30Days).toFixed(1) : 0;

  return (
    <div className="capacity-planning">
      <h2>Capacity Planning</h2>
      <p className="period-note">Last {summary.period} days</p>

      {/* Tab Navigation */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'buckets' ? 'active' : ''}`}
          onClick={() => setActiveTab('buckets')}
        >
          Buckets
        </button>
        <button
          className={`tab-button ${activeTab === 'initiatives' ? 'active' : ''}`}
          onClick={() => setActiveTab('initiatives')}
        >
          Initiatives Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          Trends
        </button>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="tab-content">

      {/* Capacity Insights */}
      <div className="capacity-section">
        <h3>Capacity Insights</h3>
        <div className="capacity-insights">
          <div className={`insight-card ${summary.avgWeeklyEffortChange > 0 ? 'warning' : summary.avgWeeklyEffortChange < 0 ? 'positive' : ''}`}>
            <div className="insight-label">Average Weekly Change</div>
            <div className="insight-value">
              {summary.avgWeeklyEffortChange > 0 ? '+' : ''}{summary.avgWeeklyEffortChange}h/week
            </div>
            <div className="insight-detail">
              {summary.avgWeeklyEffortChange > 0 && '📈 Effort increasing'}
              {summary.avgWeeklyEffortChange < 0 && '📉 Effort decreasing'}
              {summary.avgWeeklyEffortChange === 0 && '➡️ Effort stable'}
            </div>
          </div>

          <div className={`insight-card ${dtiFTENeeded > 2 ? 'warning' : 'positive'}`}>
            <div className="insight-label">DTI Backlog Size</div>
            <div className="insight-value">
              {dtiFTENeeded} FTE for 30 days
            </div>
            <div className="insight-detail">
              {dtiTicketCount} tickets totaling {dtiBacklogHours}h to clear DTI backlog
            </div>
          </div>

          <div className={`insight-card ${deliveryFTENeeded > 3 ? 'warning' : 'positive'}`}>
            <div className="insight-label">Delivery Backlog</div>
            <div className="insight-value">
              {deliveryFTENeeded} FTE for 30 days
            </div>
            <div className="insight-detail">
              {deliveryTicketCount} tickets totaling {deliveryBacklogHours}h to clear delivery work
            </div>
          </div>

          <div className={`insight-card ${initiativesFTENeeded > 3 ? 'warning' : 'positive'}`}>
            <div className="insight-label">Initiatives Backlog</div>
            <div className="insight-value">
              {initiativesFTENeeded} FTE for 30 days
            </div>
            <div className="insight-detail">
              {initiativesTicketCount} tickets totaling {initiativesBacklogHours}h to clear initiatives
            </div>
          </div>
        </div>
      </div>

      {/* Guess Estimate Rules Info */}
      <div className="info-note">
        <p>
          <strong>Estimate Notes:</strong> Tickets with existing estimates use actual values.
          For unestimated tickets, default estimates are applied: Security Alerts under INFRA-78, INFRA-79, or INFRA-157 (4h To Do, 2h In Progress),
          User Stories (10h To Do, 5h In Progress), Tasks (8h To Do, 4h In Progress),
          DTI Higher Complexity requests like Build/Deployment Issues (6h To Do, 3h In Progress),
          and DTI Standard requests (4h To Do, 2h In Progress). Done tickets = 0 hours.
        </p>
      </div>

      {/* Team Capacity Utilization */}
      {teamCapacity && Object.keys(teamCapacity).length > 0 && (
        <div className="capacity-section">
          <h3>Team Capacity Utilization ({summary.workingDays} working days @ {summary.hoursPerDay}h/day)</h3>
          <p className="capacity-note">Available capacity calculated for a 30-day period based on 6 productive hours per day per engineer</p>
          <div className="team-capacity-grid">
            {Object.entries(teamCapacity).map(([teamName, metrics]) => {
              const utilizationColor = metrics.utilizationPercent > 100 ? '#FF6B6B' :
                                      metrics.utilizationPercent > 80 ? '#FFA500' :
                                      '#A9DE33';

              return (
                <div key={teamName} className="team-capacity-card">
                  <div className="team-capacity-header">
                    <h4>{teamName}</h4>
                    <div className="team-engineers">{metrics.engineers} Engineers</div>
                  </div>

                  <div className="team-capacity-metrics">
                    <div className="capacity-metric">
                      <div className="capacity-metric-label">Available Capacity</div>
                      <div className="capacity-metric-value">{metrics.availableCapacityHours}h</div>
                    </div>
                    <div className="capacity-metric">
                      <div className="capacity-metric-label">Current Workload</div>
                      <div className="capacity-metric-value">{metrics.workloadHours}h</div>
                    </div>
                    <div className="capacity-metric">
                      <div className="capacity-metric-label">Open Tickets</div>
                      <div className="capacity-metric-value">{metrics.openTickets}</div>
                    </div>
                  </div>

                  <div className="capacity-utilization-bar">
                    <div
                      className="capacity-utilization-fill"
                      style={{
                        width: `${Math.min(metrics.utilizationPercent, 100)}%`,
                        backgroundColor: utilizationColor
                      }}
                    ></div>
                  </div>

                  <div className="capacity-utilization-label" style={{ color: utilizationColor }}>
                    <strong>{metrics.utilizationPercent}%</strong> Utilization
                    {metrics.utilizationPercent > 100 && (
                      <span className="over-capacity"> ({metrics.utilizationPercent - 100}% over capacity)</span>
                    )}
                  </div>

                  <div className="team-members">
                    <strong>Team Members:</strong>
                    <div className="members-list">
                      {metrics.members.map((member, idx) => (
                        <span
                          key={idx}
                          className={`member-badge ${isPartialCapacity(member) ? 'partial-capacity' : ''}`}
                          title={isPartialCapacity(member) ? `${member} (50% capacity)` : member}
                        >
                          {member}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="team-jira-link">
                    <a
                      href={generateJiraTeamUrl(teamName, metrics.members)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="jira-link-button"
                    >
                      View {teamName} tickets in Jira →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Team Workload */}
      <div className="capacity-section">
        <h3>Team Workload Distribution</h3>
        <div className="workload-table">
          <div className="workload-header">
            <div className="workload-col-assignee">Team / Assignee</div>
            <div className="workload-col-tickets">Open Tickets</div>
            <div className="workload-col-estimated">Estimated (Hrs)</div>
            <div className="workload-col-guess">Guess (Hrs)</div>
            <div className="workload-col-total">Potential Total (Hrs)</div>
            <div className="workload-col-days">Potential Effort (Days)</div>
            <div className="workload-col-chart">Load</div>
          </div>
          {assigneeWorkload.map((item, index) => {
            const isTeam = item.isTeam;
            const hasChildren = isTeam && item.children && item.children.length > 0;
            const isExpanded = expandedGroups[`team-${item.name}`];

            return (
              <React.Fragment key={index}>
                {/* Team/Assignee Row */}
                <div
                  className={`workload-row ${isTeam ? 'team-row' : ''} ${hasChildren ? 'clickable' : ''}`}
                  onClick={() => hasChildren && toggleGroup(`team-${item.name}`)}
                  style={{ cursor: hasChildren ? 'pointer' : 'default' }}
                >
                  <div className="workload-col-assignee" style={{ fontWeight: isTeam ? 600 : 'normal' }}>
                    {hasChildren && (
                      <span className="expand-icon" style={{ marginRight: '0.5rem' }}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    )}
                    {item.name}
                  </div>
                  <div className="workload-col-tickets">
                    {item.openTickets}
                    {item.ticketsWithEstimate > 0 && (
                      <span className="estimated-count"> ({item.ticketsWithEstimate})</span>
                    )}
                  </div>
                  <div className="workload-col-estimated">
                    {item.estimateHours > 0 ? item.estimateHours : '-'}
                  </div>
                  <div className="workload-col-guess">
                    {item.defaultHours > 0 ? item.defaultHours : '-'}
                  </div>
                  <div className="workload-col-total">
                    {item.totalHours > 0 ? item.totalHours : '-'}
                  </div>
                  <div className="workload-col-days">
                    {item.totalHours > 0 ? (item.totalHours / 6).toFixed(1) : '-'}
                  </div>
                  <div className="workload-col-chart">
                    <div className="workload-bar-container">
                      <div
                        className="workload-bar"
                        style={{ width: `${item.totalHours > 0 ? (item.totalHours / maxWorkload) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Child Assignee Rows */}
                {hasChildren && isExpanded && item.children.map((child, childIndex) => (
                  <div key={`${index}-${childIndex}`} className="workload-row child-row">
                    <div className="workload-col-assignee" style={{ paddingLeft: '2rem', color: '#6B778C' }}>
                      {child.name}
                    </div>
                    <div className="workload-col-tickets">
                      {child.openTickets}
                      {child.ticketsWithEstimate > 0 && (
                        <span className="estimated-count"> ({child.ticketsWithEstimate})</span>
                      )}
                    </div>
                    <div className="workload-col-estimated">
                      {child.estimateHours > 0 ? child.estimateHours : '-'}
                    </div>
                    <div className="workload-col-guess">
                      {child.defaultHours > 0 ? child.defaultHours : '-'}
                    </div>
                    <div className="workload-col-total">
                      {child.totalHours > 0 ? child.totalHours : '-'}
                    </div>
                    <div className="workload-col-days">
                      {child.totalHours > 0 ? (child.totalHours / 6).toFixed(1) : '-'}
                    </div>
                    <div className="workload-col-chart">
                      <div className="workload-bar-container">
                        <div
                          className="workload-bar"
                          style={{ width: `${child.totalHours > 0 ? (child.totalHours / maxWorkload) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            );
          })}
        </div>
      </div>
        </div>
      )}

      {/* Buckets Tab Content */}
      {activeTab === 'buckets' && (
        <div className="tab-content">
          {/* Work Categories */}
          {parentGrouping && (
            <>
              {renderGroupingSection(parentGrouping.bau, 'Bucket 1: BAU')}
              {renderGroupingSection(parentGrouping.deliver, 'Bucket 2: Deliver')}
              {renderGroupingSection(parentGrouping.improve, 'Bucket 3: Improve')}
            </>
          )}
        </div>
      )}

      {/* Initiatives Overview Tab Content */}
      {activeTab === 'initiatives' && (
        <div className="tab-content">
          {/* Initiatives Summary */}
          <div className="capacity-section">
            <h3>Initiatives Summary</h3>
            <div className="capacity-insights">
              <div className="insight-card">
                <div className="insight-label">Total Initiatives</div>
                <div className="insight-value">{parentGrouping?.improve?.length || 0}</div>
                <div className="insight-subtitle">Active initiatives in progress</div>
              </div>
              <div className="insight-card">
                <div className="insight-label">Total Open Tickets</div>
                <div className="insight-value">{initiativesTicketCount}</div>
                <div className="insight-subtitle">Across all initiatives</div>
              </div>
              <div className="insight-card">
                <div className="insight-label">Total Estimated Effort</div>
                <div className="insight-value">{initiativesBacklogHours}h</div>
                <div className="insight-subtitle">≈ {(initiativesBacklogHours / 6).toFixed(0)} working days</div>
              </div>
              <div className={`insight-card ${initiativesFTENeeded > 0 ? 'warning' : ''}`}>
                <div className="insight-label">FTE Required (30 days)</div>
                <div className="insight-value">{initiativesFTENeeded}</div>
                <div className="insight-subtitle">Full-time engineers needed</div>
              </div>
            </div>
          </div>

          {/* Initiatives Detail */}
          {parentGrouping && parentGrouping.improve && renderGroupingSection(parentGrouping.improve, 'Initiatives Breakdown')}

          {/* Empty State */}
          {(!parentGrouping || !parentGrouping.improve || parentGrouping.improve.length === 0) && (
            <div className="capacity-section">
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6B778C' }}>
                <p>No initiatives currently tracked.</p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Initiatives are improvement projects linked to Technology Roadmap items.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trends Tab Content */}
      {activeTab === 'trends' && (
        <div className="tab-content">
          {/* Effort Trend Chart */}
          {effortTrend && effortTrend.length > 0 && (
            <div className="capacity-section">
              <h3>Estimated Effort Trend (Weekly)</h3>
              <div className="effort-trend-summary">
                <div className={`effort-rate-card ${summary.avgWeeklyEffortChange > 0 ? 'increasing' : summary.avgWeeklyEffortChange < 0 ? 'decreasing' : 'stable'}`}>
                  <div className="effort-rate-label">Average Weekly Change</div>
                  <div className="effort-rate-value">
                    {summary.avgWeeklyEffortChange > 0 ? '+' : ''}{summary.avgWeeklyEffortChange}h/week
                  </div>
                  <div className="effort-rate-indicator">
                    {summary.avgWeeklyEffortChange > 0 && '📈 Effort increasing'}
                    {summary.avgWeeklyEffortChange < 0 && '📉 Effort decreasing'}
                    {summary.avgWeeklyEffortChange === 0 && '➡️ Effort stable'}
                  </div>
                </div>
              </div>
              <div className="effort-trend-table">
                <div className="effort-trend-header">
                  <div className="effort-col-week">Week Period</div>
                  <div className="effort-col-added">Effort Added (h)</div>
                  <div className="effort-col-removed">Effort Removed (h)</div>
                  <div className="effort-col-net">Net Change (h)</div>
                  <div className="effort-col-tickets">Tickets (Created/Resolved)</div>
                </div>
                {effortTrend.map((week, index) => (
                  <div key={index} className="effort-trend-row">
                    <div className="effort-col-week">{week.label}</div>
                    <div className="effort-col-added">
                      <span className="effort-added">+{week.effortAdded}</span>
                    </div>
                    <div className="effort-col-removed">
                      <span className="effort-removed">-{week.effortRemoved}</span>
                    </div>
                    <div className="effort-col-net">
                      <span className={week.netEffortChange > 0 ? 'net-positive' : week.netEffortChange < 0 ? 'net-negative' : 'net-neutral'}>
                        {week.netEffortChange > 0 ? '+' : ''}{week.netEffortChange}
                      </span>
                    </div>
                    <div className="effort-col-tickets">
                      {week.ticketsCreated} / {week.ticketsResolved}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ticket Flow Chart */}
          <div className="capacity-section">
            <h3>Ticket Flow Trend</h3>
            <div className="flow-chart">
              <div className="flow-legend">
                <div className="flow-legend-item">
                  <span className="flow-legend-color created"></span>
                  <span>Created</span>
                </div>
                <div className="flow-legend-item">
                  <span className="flow-legend-color resolved"></span>
                  <span>Resolved</span>
                </div>
              </div>
              <svg className="flow-svg" viewBox="0 0 800 200" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((factor, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1={200 - (factor * 180)}
                    x2="800"
                    y2={200 - (factor * 180)}
                    stroke="#e0e0e0"
                    strokeWidth="1"
                  />
                ))}

                {/* Created line */}
                <polyline
                  fill="none"
                  stroke="#A9DE33"
                  strokeWidth="2"
                  points={ticketFlow.map((point, i) => {
                    const x = (i / (ticketFlow.length - 1)) * 800;
                    const y = 200 - ((point.created / maxFlow) * 180);
                    return `${x},${y}`;
                  }).join(' ')}
                />

                {/* Resolved line */}
                <polyline
                  fill="none"
                  stroke="#44546A"
                  strokeWidth="2"
                  points={ticketFlow.map((point, i) => {
                    const x = (i / (ticketFlow.length - 1)) * 800;
                    const y = 200 - ((point.resolved / maxFlow) * 180);
                    return `${x},${y}`;
                  }).join(' ')}
                />
              </svg>
              <div className="flow-x-axis">
                <span>{ticketFlow[0]?.date}</span>
                <span>{ticketFlow[Math.floor(ticketFlow.length / 2)]?.date}</span>
                <span>{ticketFlow[ticketFlow.length - 1]?.date}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CapacityPlanning;
