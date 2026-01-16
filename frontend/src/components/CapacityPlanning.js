import React, { useState } from 'react';
import './CapacityPlanning.css';

function CapacityPlanning({ data }) {
  const [expandedGroups, setExpandedGroups] = useState({});

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

  return (
    <div className="capacity-planning">
      <h2>Capacity Planning</h2>
      <p className="period-note">Last {summary.period} days</p>

      {/* Guess Estimate Rules Summary */}
      <div className="guess-rules-summary">
        <h3>Guess Estimate Rules for Unestimated Tickets</h3>
        <div className="rules-grid">
          <div className="rule-card">
            <div className="rule-header">User Stories & Tasks</div>
            <div className="rule-content">
              <div className="rule-row">
                <span className="status-badge todo">To Do</span>
                <span className="estimate-value">8 hours</span>
              </div>
              <div className="rule-row">
                <span className="status-badge inprogress">In Progress</span>
                <span className="estimate-value">4 hours</span>
              </div>
            </div>
            <div className="rule-note">Any project</div>
          </div>

          <div className="rule-card">
            <div className="rule-header">DTI Higher Complexity</div>
            <div className="rule-content">
              <div className="rule-row">
                <span className="status-badge todo">To Do</span>
                <span className="estimate-value">6 hours</span>
              </div>
              <div className="rule-row">
                <span className="status-badge inprogress">In Progress</span>
                <span className="estimate-value">3 hours</span>
              </div>
            </div>
            <div className="rule-note">Build/Deployment Issues, Connectivity, Branch Request</div>
          </div>

          <div className="rule-card">
            <div className="rule-header">DTI Standard</div>
            <div className="rule-content">
              <div className="rule-row">
                <span className="status-badge todo">To Do</span>
                <span className="estimate-value">4 hours</span>
              </div>
              <div className="rule-row">
                <span className="status-badge inprogress">In Progress</span>
                <span className="estimate-value">2 hours</span>
              </div>
            </div>
            <div className="rule-note">All other DTI request types</div>
          </div>
        </div>
        <div className="rules-footer">
          Tickets with existing estimates use actual values • Done tickets = 0 hours
        </div>
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
                        <span key={idx} className="member-badge">{member}</span>
                      ))}
                    </div>
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

      {/* Work Categories */}
      {parentGrouping && (
        <>
          {renderGroupingSection(parentGrouping.bau, 'Bucket 1: BAU')}
          {renderGroupingSection(parentGrouping.deliver, 'Bucket 2: Deliver')}
          {renderGroupingSection(parentGrouping.improve, 'Bucket 3: Improve')}
        </>
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

      {/* Key Insights */}
      <div className="capacity-section">
        <h3>Capacity Insights</h3>
        <div className="capacity-insights">
          <div className={`insight-card ${flowTrend === 'increasing' ? 'warning' : 'positive'}`}>
            <div className="insight-label">Workload Trend</div>
            <div className="insight-value">
              {flowTrend === 'increasing' && 'Backlog Growing'}
              {flowTrend === 'decreasing' && 'Backlog Clearing'}
              {flowTrend === 'stable' && 'Stable Capacity'}
            </div>
            <div className="insight-detail">
              {netFlow > 0 && `${netFlow} more tickets created than resolved`}
              {netFlow < 0 && `${Math.abs(netFlow)} more tickets resolved than created`}
              {netFlow === 0 && 'Balanced ticket creation and resolution'}
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-label">Team Utilization</div>
            <div className="insight-value">
              {assigneeWorkload.filter(a => a.name !== 'Unassigned').length} active members
            </div>
            <div className="insight-detail">
              Average {Math.round(summary.totalOpenTickets / Math.max(assigneeWorkload.filter(a => a.name !== 'Unassigned').length, 1))} tickets per person
            </div>
          </div>

          <div className={`insight-card ${summary.avgResolutionTime > 7 ? 'warning' : 'positive'}`}>
            <div className="insight-label">Resolution Speed</div>
            <div className="insight-value">{summary.avgResolutionTime} days average</div>
            <div className="insight-detail">
              {summary.avgResolutionTime <= 5 && 'Meeting target (≤5 days)'}
              {summary.avgResolutionTime > 5 && summary.avgResolutionTime <= 7 && 'Slightly above target'}
              {summary.avgResolutionTime > 7 && 'Exceeds target - may need attention'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CapacityPlanning;
