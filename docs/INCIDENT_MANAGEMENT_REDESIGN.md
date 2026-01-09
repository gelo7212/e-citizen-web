# Incident Management - New Design Update

## Overview
The Incident Management page has been redesigned with:
✅ **Side-by-side layout** - Main incidents list + sticky emergency panel
✅ **Auto-refresh every 15 seconds** - Real-time data updates
✅ **No tabs** - Clean, uncluttered interface
✅ **Responsive design** - Works on all screen sizes

---

## Layout Design

```
┌─────────────────────────────────────────────────────────────┐
│ Incident Management                                         │
│ Manage all incidents in your city                          │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────┐  ┌─────────────────────────┐
│                          │  │ 🚨 Emergency (Sticky)   │
│                          │  │                         │
│  All Incidents List      │  │  [5] High Severity      │
│  (IncidentsList comp)    │  │                         │
│                          │  │  ⚠️ Unack:  2          │
│  - Search filters        │  │  ⚙️ Progress: 1        │
│  - Sorting options       │  │  ────────────────────  │
│  - Pagination            │  │  [Emergency Cards]     │
│  - Full incident cards   │  │  - Card 1              │
│                          │  │  - Card 2              │
│                          │  │  - Card 3              │
│                          │  │  [Show 10 max]         │
│                          │  │                         │
│                          │  │ ⟳ Updates every 15s   │
└──────────────────────────┘  └─────────────────────────┘

[3 columns]                   [1 column, sticky]
```

---

## Key Features

### 1. Main Incident List (Left - 75% width)
- Full `IncidentsList` component
- All filtering and sorting options
- Pagination support
- Complete incident details

### 2. Emergency Concerns Panel (Right - 25% width, Sticky)

**Sticky Behavior:**
- On desktop (lg+): Stays visible as user scrolls
- On tablet/mobile: Becomes full-width, not sticky
- Top offset: 32px (lg:top-8)

**Panel Content:**
- **Header**: 🚨 Emergency title
- **Count Badge**: Large red number showing total high-severity incidents
- **Status Breakdown**: 
  - ⚠️ Unacknowledged count
  - ⚙️ In Progress count
- **Emergency List** (max 10 visible):
  - Compact incident cards
  - Status badges (color-coded)
  - Time display (HH:MM format)
  - Scrollable (max height: 600px)
- **Auto-refresh indicator**: Shows "⟳ Updates every 15s"

---

## Auto-Refresh Implementation

**Interval**: 15 seconds (15,000 ms)

```typescript
// Setup on mount
useEffect(() => {
  if (!user?.cityCode) return;

  loadEmergencies(user.cityCode);

  // Auto-refresh every 15 seconds
  refreshIntervalRef.current = setInterval(() => {
    loadEmergencies(user.cityCode);
  }, 15000);

  // Cleanup on unmount
  return () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
  };
}, [user?.cityCode]);
```

**What Updates:**
- Emergency incident list
- Total count
- Status breakdown (unacked, in progress)
- All emergency cards

**What Doesn't:**
- Main incident list (has its own internal refresh if needed)

---

## Responsive Breakpoints

### Desktop (lg and above)
- Grid: 4 columns (3 + 1)
- Emergency panel: Sticky sidebar on right
- Full visibility of all details
- Optimized for monitoring

### Tablet (md to lg)
- Grid: 1 column
- Emergency panel: Below main list
- Not sticky on tablet
- Compact layout

### Mobile (sm and below)
- Grid: 1 column
- Full width incident list
- Full width emergency panel
- Stacked vertically
- Touch-friendly spacing

---

## Color Scheme

| Element | Colors | Purpose |
|---------|--------|---------|
| Panel Border | White/Shadow | Clean separation |
| Header | 🚨 + Red-700 | High visibility |
| Count Badge | Red-50 bg / Red-700 text | Primary metric |
| Unacknowledged | Orange-50 bg / Orange-700 text | Urgent attention |
| In Progress | Purple-50 bg / Purple-700 text | Active handling |
| Cards | Red-50 / Red-100 hover | Emergency context |
| Status Badges | Orange/Blue/Purple | Clear status indication |

---

## Styling Details

**Panel:**
- `p-6` - Padding
- `bg-white` - Clean background
- `shadow-lg` - Depth
- `rounded-lg` - Subtle corners

**Cards:**
- `p-3` - Compact padding
- `rounded-lg` - Consistent styling
- `border border-red-200` - Red accent
- `bg-red-50 hover:bg-red-100` - Interactive

**Typography:**
- Header: `text-xl font-bold`
- Count: `text-3xl font-bold`
- Card titles: `text-sm font-semibold`
- Meta: `text-xs`

---

## API Integration

**Endpoint Called:**
```typescript
getIncidentsByCity(cityCode, {
  severity: 'high',
  status: 'open,acknowledged,in_progress,for_review',
  limit: 50,
  skip: 0,
})
```

**Status Filtering:**
- Includes: open, acknowledged, in_progress, for_review
- Excludes: resolved, rejected, cancelled

**Display Limit:**
- Max 10 incidents shown in emergency panel
- Full list accessible via main incidents page

---

## User Interactions

1. **View Details**: Click any emergency card → Navigate to detail page
2. **Auto-Refresh**: Data updates every 15 seconds automatically
3. **Monitor**: Emergency count and status visible at all times
4. **Full Management**: Click main incident list for complete controls

---

## Performance Optimizations

✅ **Efficient:**
- Single API call for emergency data
- Efficient interval cleanup
- No unnecessary re-renders
- Responsive grid layout
- Smooth transitions
- Loading skeletons for feedback

---

## Testing Checklist

- [ ] Emergency panel displays correctly
- [ ] Auto-refresh updates every 15 seconds
- [ ] Sticky positioning works on desktop
- [ ] Count badge shows correct total
- [ ] Status breakdown calculates accurately
- [ ] Click incident navigates to detail
- [ ] Empty state displays when no emergencies
- [ ] Loading skeleton shows during fetch
- [ ] Responsive design on all screens
- [ ] No console errors
- [ ] Interval clears on unmount

---

## Files Modified

- `app/admin/city/incidents/page.tsx` - Complete redesign
  - Removed tab interface
  - Added side-by-side layout
  - Implemented 15-second auto-refresh
  - Added sticky emergency panel

---

## Future Enhancements

1. **Search**: Filter emergency list by title
2. **Filter**: Filter by status in emergency panel
3. **Notifications**: Browser/desktop alerts for new emergencies
4. **Batch Actions**: Select multiple emergencies
5. **Export**: Download emergency report
6. **Refresh Button**: Manual refresh option
7. **Analytics**: Emergency trends chart
8. **SLA Tracking**: Response time metrics
