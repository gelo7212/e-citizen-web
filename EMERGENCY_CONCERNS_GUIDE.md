# Emergency Concerns - Implementation Guide

## Overview
A dedicated page for managing **high-severity incidents only** in the admin incident management system.

## Features

### 📊 Statistics Dashboard
- **Total Emergencies**: Count of all high-severity incidents
- **Unacknowledged**: Incidents not yet acknowledged (status: open)
- **In Progress**: Currently being handled (status: in_progress)
- **Resolved**: Completed emergencies (status: resolved)
- **Avg Response Time**: Average time to first response

### 🎯 Filtering & Sorting
- **Status Filter**: All, Unacknowledged, Acknowledged, In Progress
- **Sort Options**: Most Recent, Oldest First, By Status Priority
- Real-time filtering and sorting without page reload

### 🚨 Emergency Alert Banner
- Displays when there are unacknowledged incidents
- Shows count of incidents requiring immediate action
- Color-coded with warning icons

### 📋 Incident Cards
Each emergency incident is displayed with:
- **Status Icon**: Visual indicator of current status
- **Title & Description**: Quick overview
- **Badges**: Severity, Status, Category
- **Location Information**: Where the incident occurred
- **Timestamp**: When reported
- **Reporter Info**: Who reported it
- **Quick Access**: Link to detailed incident view

### 🔄 Auto-Refresh
- Updates automatically every 30 seconds
- Ensures latest incident status is always displayed
- Can be manually refreshed by navigating back

## Pages & Routes

### Main Emergency Page
**Route**: `/admin/city/incidents/emergency`
**Component**: `app/admin/city/incidents/emergency/page.tsx`

### Related Pages
- **All Incidents**: `/admin/city/incidents`
- **Incident Detail**: `/admin/city/incidents/[id]`

## Status Indicators

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| Open | 🔴 | Red | Unacknowledged, urgent action needed |
| For Review | ⏳ | Yellow | Awaiting review/acknowledgment |
| Acknowledged | 👁️ | Blue | Reviewed, action planned |
| In Progress | ⚙️ | Purple | Currently being handled |
| Resolved | ✅ | Green | Completed |

## Severity Levels

### High Severity (Emergency Concerns)
- Fires, accidents, violence
- Infrastructure threats
- Mass incidents
- Any incident marked as HIGH severity
- **Badge**: 🔴 High Severity (Red)

## Statistics Display

### Real-time Metrics
```
┌─────────────────────────────────────────────────────────┐
│  🚨 Total | ⚠️ Unacknowledged | ⚙️ In Progress | ✅ Resolved │
│    45    |        12         |      8       |     25    │
└─────────────────────────────────────────────────────────┘
```

## Filtering Examples

### View Unacknowledged Emergencies
1. Click "Status Filter" dropdown
2. Select "Unacknowledged"
3. List updates to show only open incidents

### Sort by Oldest First
1. Click "Sort By" dropdown
2. Select "Oldest First"
3. View incidents from most delayed to recent

### Sort by Status Priority
1. Click "Sort By" dropdown
2. Select "By Status"
3. View incidents ordered: Open → For Review → Acknowledged → In Progress

## Design Elements

### Color Scheme
- **Red**: Emergency/High Severity (#DC2626)
- **Orange**: Unacknowledged (#EA580C)
- **Purple**: In Progress (#7C3AED)
- **Green**: Resolved (#16A34A)
- **Blue**: Acknowledged (#2563EB)

### Typography
- **Header**: 4xl, Bold (text-4xl font-bold)
- **Card Titles**: xl, Bold (text-xl font-bold)
- **Descriptions**: sm, Regular
- **Badges**: xs, Semibold

### Spacing & Layout
- **Main Grid**: 5 columns on large screens, responsive
- **Incident Cards**: Full width, stacked vertically
- **Padding**: 8 units (p-8) for main container
- **Gap**: 4 units between cards

## Responsive Design

### Desktop (lg and above)
- 5-column statistics grid
- Full incident card layout with all details visible
- Side-by-side filters and info

### Tablet (md)
- 2-column statistics grid
- Incident cards remain full width
- Stacked filters

### Mobile (sm)
- 1-column statistics grid
- Full width incident cards
- Vertical filter stack

## Integration Points

### API Endpoint Used
```typescript
getIncidentsByCity(cityCode, {
  severity: 'high',
  status: 'open,acknowledged,in_progress,for_review',
  limit: 100,
  skip: 0,
  sortField: 'createdAt',
  sortOrder: 'desc',
})
```

### Data Types
- `Incident`: Complete incident object
- `EmergencyStats`: Statistics interface

## Navigation

### From Emergency Page
- **← Back to All Incidents**: Navigate to `/admin/city/incidents`
- **Click Card**: View detailed incident at `/admin/city/incidents/[id]`

### To Emergency Page
- **From All Incidents Page**: Add link button
- **From Admin Dashboard**: Quick access link
- **From Sidebar Navigation**: New menu item

## User Actions

### Primary Actions
1. View emergency details
2. Acknowledge incidents
3. Update incident status
4. Assign departments/rescuers
5. Add notes/comments

### Secondary Actions
1. Filter by status
2. Sort incidents
3. Search (if added)
4. Export report (if added)

## Performance Optimization

### Current Optimizations
- Single API call with filters applied server-side
- Auto-refresh every 30 seconds (configurable)
- Responsive grid layout
- Loading skeletons for better UX

### Potential Future Optimizations
- Pagination for large datasets
- Search functionality
- Advanced filtering options
- Incident export functionality
- WebSocket real-time updates

## Installation Steps

1. **Create the directory structure**:
   ```
   app/admin/city/incidents/emergency/
   ```

2. **Add the page.tsx file**:
   ```
   app/admin/city/incidents/emergency/page.tsx
   ```

3. **Update navigation** (if sidebar exists):
   - Add link to `/admin/city/incidents/emergency`

4. **Update incident list page** (optional):
   - Add prominent link to emergency page

## Testing Checklist

- [ ] Page loads with authentication
- [ ] Emergency incidents display correctly
- [ ] Statistics calculate accurately
- [ ] Status filtering works
- [ ] Sorting functions properly
- [ ] Click incident navigates to detail page
- [ ] Auto-refresh updates data
- [ ] Responsive design works on all screen sizes
- [ ] Empty state displays when no emergencies
- [ ] Error handling shows error messages
- [ ] Loading state displays properly

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for instant updates
2. **Search**: Filter incidents by title, description
3. **Advanced Filters**: Date range, location, reporter
4. **Batch Actions**: Acknowledge/update multiple incidents
5. **Export**: Download emergency reports
6. **Notifications**: Alert admins of new emergencies
7. **Analytics**: Graphs and charts of emergency trends
8. **SLA Tracking**: Response time tracking and alerts
9. **Escalation**: Auto-escalate old incidents
10. **Mobile App**: Native mobile interface
