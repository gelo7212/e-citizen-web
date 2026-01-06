# Anonymous Rescuer Share Link Feature

## Overview
Added a new "Share" button in the SOS Admin Monitor page that allows admins to generate and share anonymous rescuer links for specific incidents.

## Implementation Details

### 1. API Service Function
**File:** [lib/services/sosService.ts](lib/services/sosService.ts)

Added new function:
```typescript
export async function createAnonymousRescuer(cityCode: string)
```

- **Endpoint:** `POST /api/sos/admin/anon-rescuer`
- **Request Body:** `{ cityCode: string }`
- **Response:** `{ success: boolean, data: { token: string }, error?: string }`
- Handles authentication and error responses automatically

### 2. Monitor Page Updates
**File:** [app/admin/sos/monitor/page.tsx](app/admin/sos/monitor/page.tsx)

#### New State Variables:
- `sharingLoading`: Tracks which SOS is currently generating a link (for loading state)
- `shareLinkSuccess`: Stores the generated link for reference

#### New Handler Function:
`handleShareRescuerLink(sosId: string)`
- Calls the API to create an anonymous rescuer identity
- Generates link format: `/admin/rescuer/:sosId?token=<api_response_token>`
- Automatically copies link to clipboard using Clipboard API
- Shows success notification with confirmation message
- Handles clipboard copy failures gracefully by displaying the link in notification

#### New UI Button:
Added "Share" button (purple, 🔗 icon) next to existing Chat and Details buttons
- Shows loading state with spinner during API call
- Disabled while request is in progress
- Displays success notification
- Integrates with existing notification system

## User Flow

1. Admin opens SOS Monitor page
2. Views active incidents in the right sidebar
3. For each incident, three action buttons are available:
   - 💬 **Chat** - Opens chat with citizen
   - 📋 **Details** - Shows full incident details
   - 🔗 **Share** - Generates and copies rescuer link *(NEW)*
4. Clicking "Share" button:
   - Shows loading state
   - Calls API to create anonymous rescuer
   - Generates shareable link
   - Copies link to clipboard
   - Shows confirmation notification
5. Admin can paste the link to share with rescuers

## Link Format

```
https://[current-domain]/admin/rescuer/[sosId]?token=[api-response-token]
```

Example:
```
https://admin.localhost/admin/rescuer/sos-123abc?token=eyJhbGc...
```

## Error Handling

- API errors are displayed in notification
- Clipboard errors fallback to displaying link in notification
- Loading state prevents multiple submissions
- Notifications auto-dismiss after 3-5 seconds

## Technical Notes

- Uses `createAnonymousRescuer()` service function from sosService
- Gets city code from `auth.user.cityCode` or falls back to `selectedHQ.cityCode`
- Uses Clipboard API with graceful fallback
- Integrates with existing notification and loading state systems
- No new dependencies required
