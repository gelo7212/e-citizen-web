# SOS Admin Portal - Complete Redesign

## 🚀 Quick Start

### Access the SOS Admin Portal
1. Navigate to `/admin/sos/monitor` for live monitoring
2. Navigate to `/admin/sos/management` for request management

### Features at a Glance

#### 🗺️ Live Monitor (`/admin/sos/monitor`)
- **Real-time Map**: See all active SOS requests on an interactive map
- **KPI Dashboard**: View counts of active, inactive, and resolved SOS requests
- **Alert Panel**: Quick access to most urgent SOS requests
- **Filtering**: Filter by status (all/active/resolved)
- **Auto-refresh**: Automatically updates with configurable intervals

#### 📊 Management (`/admin/sos/management`)
- **Search**: Find SOS requests by ID or user ID
- **Filter**: View requests by status
- **Statistics**: Overall SOS request metrics
- **Details**: See complete request information

---

## 🎯 How to Use

### 1. Live Monitor
```
Route: /admin/sos/monitor
```

**Step-by-step:**
1. Page loads and automatically requests your geolocation
2. If denied, defaults to Manila coordinates
3. Map displays all nearby SOS requests within 120km
4. KPI cards update in real-time
5. Click any SOS in the list or on the map to view details

**Controls:**
- **Filter**: Select "All", "Active Only", or "Resolved Only"
- **Refresh Rate**: Choose 2s, 5s, 10s, or 30s updates
- **Manual Refresh**: Click "🔄 Refresh Now" for immediate update

**Understanding the Map:**
- 🔵 **Blue marker**: Your location
- 🔴 **Red circle**: Active SOS (urgent)
- 🟢 **Green circle**: Resolved SOS
- ⚪ **Gray circle**: Inactive SOS

### 2. SOS Details Modal
**Appears when clicking a SOS request**

**Three tabs available:**

**Info Tab:**
- Complete SOS request information
- Citizen ID and device information
- Current status
- Associated tag/notes
- Created and last updated times

**Location Tab:**
- Exact coordinates (latitude/longitude)
- Link to Google Maps
- Device ID information
- Distance and accuracy details

**Messages Tab:**
- Conversation thread with citizen/rescuers
- Message send functionality
- Message history with timestamps
- Color-coded by sender type

**Actions:**
- Close SOS request
- Return to list

### 3. SOS Management
```
Route: /admin/sos/management
```

**Features:**
- **Quick Stats**: View total, pending, assigned, and resolved counts
- **Search Bar**: Type SOS ID or User ID to filter
- **Status Filter**: Dropdown to filter by request status
- **Data Table**: Complete view of all SOS requests
  - SOS ID (clickable/copyable)
  - User ID
  - Status (color-coded)
  - Location (coordinates)
  - Tag/Notes
  - Created/Updated dates

---

## 🎨 Color Coding

### Status Colors
| Status | Color | Icon |
|--------|-------|------|
| Active | 🔴 Red | 🚨 |
| Assigned | 🔵 Blue | ⚙️ |
| Resolved | 🟢 Green | ✓ |
| Pending | 🟡 Yellow | ⏳ |
| Cancelled | ⚪ Gray | ✗ |

### Urgency Indicators
- **Pulsing badge**: Indicates most urgent alert
- **Red background**: Active SOS in lists
- **Green background**: Resolved SOS

---

## 📱 Mobile Responsiveness

The SOS portal is fully responsive:

- **Mobile (< 768px)**: Single-column layout, stacked components
- **Tablet (768px-1024px)**: Two-column layout
- **Desktop (> 1024px)**: Optimized three-column layout with sidebar

---

## ⚙️ Admin Layout

### Sidebar Navigation
The sidebar automatically shows navigation items based on your role:

**All Admins:**
- Dashboard

**APP_ADMIN:**
- Admin Accounts

**CITY_ADMIN:**
- City Management
- Reports
- Announcements

**SOS_ADMIN:**
- SOS Monitor ⭐ (Primary)
- SOS Management

**SK_YOUTH_ADMIN:**
- Youth Management

**Controls:**
- Click collapse/expand arrow to toggle sidebar
- Click any navigation item to go to that page
- View your role badge in the top bar

---

## 🔄 Data Refresh & Updates

### Auto-Polling
- Default: 5-second intervals
- Configurable: 2s, 5s, 10s, or 30s
- Respects battery and performance

### Manual Refresh
- Click "🔄 Refresh Now" button anytime
- Fetches latest data immediately

### WebSocket (Future)
- Real-time updates without polling (coming soon)

---

## 📍 Location Features

### Automatic Geolocation
- Requests browser permission on first visit
- Falls back to Manila (14.5995°N, 120.9842°E) if denied
- Uses HTML5 Geolocation API

### Map Integration
- Powered by Leaflet + OpenStreetMap
- Zoom and pan for navigation
- Click markers for quick info

### Google Maps Links
- Location tab includes direct Google Maps link
- Opens in new window
- Useful for navigation

---

## 🔒 Security & Permissions

### Access Control
- Must have `admin:read` scope
- Role-based menu visibility
- SOS_ADMIN required for monitoring

### Data Protection
- All API calls authenticated with JWT
- Secure token handling
- CORS-protected endpoints

### Audit Trail
- User actions logged (future enhancement)
- Request history maintained
- Status changes tracked

---

## 🆘 Common Tasks

### Find a Specific SOS
1. Go to Management page
2. Use search bar to enter SOS ID
3. Results update in real-time

### View All Active SOS
1. Go to Monitor page
2. Select "Active Only" in filter
3. See only active requests

### Message a Citizen
1. Click SOS request in Monitor
2. Open Details Modal
3. Go to "Messages" tab
4. Type your message
5. Click "Send"

### Close a Resolved SOS
1. Click SOS request
2. View Details
3. Click "Close SOS Request" button
4. Confirm action

### Check SOS Accuracy
1. Click SOS on map
2. Go to "Location" tab
3. See accuracy in meters (±Xm)
4. Lower is more accurate

---

## 🐛 Troubleshooting

### Map Not Loading
- **Solution**: Check browser console for errors
- **Check**: Leaflet library loaded from CDN
- **Try**: Refresh page or clear cache

### Geolocation Not Working
- **Solution**: Allow location access in browser settings
- **Fallback**: Will use Manila coordinates
- **Note**: Some browsers require HTTPS

### Data Not Updating
- **Check**: Refresh rate is not set to manual
- **Try**: Click "🔄 Refresh Now" button
- **Reset**: Reload the entire page

### Can't Access SOS Admin
- **Check**: You have SOS_ADMIN role
- **Verify**: Your JWT token is valid
- **Login**: Sign out and back in

---

## 📊 Understanding the Dashboard

### KPI Cards Explained

**Active SOS 🚨**
- Count of currently active emergency requests
- Requires immediate attention

**Inactive ⏸️**
- SOS requests that are on hold
- Not actively being addressed

**Resolved ✓**
- Completed emergency requests
- Marked as resolved by admin

**Total 📍**
- All SOS requests in the system
- Includes all statuses

### Alert Panel Insights

**Most Urgent Alert**
- Highest priority active SOS
- Always shown first
- Click to open details

**Active Alerts List**
- Top 5 most recent active SOS
- Sorted by status
- Quick selection

**Statistics**
- Total alerts visible
- Average distance
- Quick metrics

---

## 🎓 Best Practices

1. **Regular Monitoring**: Check monitor page every 5-10 minutes
2. **Prompt Response**: Address active SOS requests immediately
3. **Clear Communication**: Use message feature for citizen/rescuer coordination
4. **Accurate Tagging**: Add notes to SOS for future reference
5. **Timely Closure**: Close resolved SOS requests promptly
6. **Data Accuracy**: Verify location accuracy before dispatch

---

## 🚀 Tips & Tricks

- **Keyboard Shortcuts**: Tab to navigate, Enter to select (coming soon)
- **Favorites**: Pin frequently accessed SOS (coming soon)
- **Bulk Actions**: Select multiple SOS to action (coming soon)
- **Export Data**: Download SOS data as CSV/PDF (coming soon)
- **Analytics**: View trends and metrics (coming soon)

---

## 📚 API Reference

The admin portal uses these endpoints:

```typescript
// Get nearby SOS requests
getNearbySOSRequests(latitude, longitude, radius)

// Get specific SOS request
getSOSRequestById(sosId)

// Get user's SOS requests
getUserSOSRequests(userId)

// Get SOS messages
getSOSMessages(sosId, skip, limit)

// Send message to SOS
sendSOSMessage(sosId, payload)

// Update SOS tag
updateSOSTag(sosId, tag)

// Close SOS request
closeSOSRequest(sosId)
```

---

## 💡 Future Enhancements

- ✨ Real-time WebSocket updates
- 📱 Mobile app integration
- 🎙️ Voice alert system
- 🚗 Rescuer dispatch assignment
- 📈 Advanced analytics dashboard
- 🎯 Heatmaps and hot zones
- 🔔 Push notifications
- 📹 Live stream integration
- 🤖 AI-powered risk assessment

---

## 📧 Support

For issues or feature requests:
1. Check this documentation first
2. Review browser console for errors
3. Contact development team
4. Submit bug report with screenshots

---

## ✅ Verification Checklist

- [ ] Can access SOS Monitor page
- [ ] Map loads and shows location
- [ ] KPI cards update in real-time
- [ ] Can filter SOS requests
- [ ] Can click SOS to view details
- [ ] Messages tab shows conversation
- [ ] Can send messages to citizen
- [ ] Location links work in modal
- [ ] Can access SOS Management page
- [ ] Search and filter work in table
- [ ] Sidebar navigation works
- [ ] Role-based access controls working

---

**Version**: 1.0  
**Last Updated**: January 2, 2026  
**Status**: ✅ Production Ready
