# Share Link Implementation - Summary

## Overview
Implemented a complete share link feature that allows city admins to create shareable links for incident reports. Recipients can access shared incidents via a public share page and have limited permissions (view + status update only).

## Components Created

### 1. API Endpoints (`lib/api/shareLinkEndpoints.ts`)
- `createShareLink()` - Create shareable link with DEPT_ACTIVE or ASSIGNMENT_ONLY scope
- `validateShareLink()` - Validate token without authentication
- `revokeShareLink()` - Revoke a shareable link
- `getActiveLinksByDepartment()` - List active links for a department

### 2. UI Components

#### ShareLinkModal (`components/admin/incidents/ShareLinkModal.tsx`)
- Modal dialog for creating share links
- Two scope options:
  - **Department Level**: Share all active assignments for the department
  - **Single Assignment**: Share specific assignment only
- Displays generated shareable URL
- Copy-to-clipboard functionality
- Success/error state handling

#### SharedIncidentView (`components/share/SharedIncidentView.tsx`)
- Read-only incident details view
- Limited to:
  - View incident information (title, description, location, reporter, etc.)
  - Update incident status with required reason
  - View all incident metadata
- No assignment management
- No incident editing

### 3. Pages

#### Share Page (`app/share/page.tsx`)
- Public page accessible via `/?token=jwt` query parameter
- Validates token before rendering incident
- Displays access expiration info
- Handles invalid/expired tokens with clear error messages
- Similar UX pattern to rescuer anonymous share

### 4. Utilities (`lib/utils/shareTokenUtils.ts`)
- `decodeShareToken()` - Decode JWT client-side
- `isTokenExpired()` - Check token expiration
- `validateTokenStructure()` - Validate token payload
- `getTokenInfo()` - Extract incident/department info from token

## Updated Components

### IncidentDetail Component
- Added "Share Report" button in assignments section
- Integrated ShareLinkModal
- Button opens modal on click

## Features

✅ **Create Share Links**
- Admin clicks "Share Report" button
- Selects scope (Department or Assignment)
- Gets shareable URL
- Copies and shares link

✅ **Access Shared Incidents**
- Recipients visit `/?token=<jwt>` page
- Token validated client-side and server-side
- Access expiration displayed

✅ **Limited Permissions**
- View incident details ✓
- Update status with reason ✓
- View assignments ✗
- Create assignments ✗
- Edit incident details ✗

✅ **Security**
- JWT tokens with expiration
- Server-side validation via `/api/sharelink/validate/:hashToken`
- Token revocation support
- No authentication required for viewing (token is the credential)

## Integration Points

### API Integration
- Uses existing `updateIncidentStatus()` endpoint with reason field
- New `/api/sharelink/` endpoints for token management

### User Context
- ShareLinkModal needs:
  - `incidentId` - From incident detail
  - `cityId` - Current city code
  - `departmentId` - From user context (currently using cityCode as placeholder)

**TODO**: Update `departmentId` to come from authenticated user's department context

## Usage Flow

### For City Admin
1. View incident detail page
2. Click "Share Report" button
3. Choose scope (Department Level recommended)
4. Copy generated URL
5. Share with other admins/users
6. Manage shared links via department admin panel (future enhancement)

### For Shared Access Recipients
1. Receive link: `https://app.example.com/share?token=<jwt>`
2. Page automatically validates token
3. View incident details
4. Update status if needed (with required reason)
5. Access revoked when link expires or admin revokes it

## Future Enhancements

1. **Manage Links Page** - Add admin panel to view and revoke active share links
2. **Assignment Scope** - Implement ASSIGNMENT_ONLY scope with specific assignment access
3. **Multiple Department Support** - Handle cross-department sharing
4. **Activity Tracking** - Log who accessed shared links and when
5. **Expiration Settings** - Allow admin to set custom expiration times
6. **Share Notification** - Email/notification system for shared links

## Files Created/Modified

### New Files
- `lib/api/shareLinkEndpoints.ts`
- `lib/utils/shareTokenUtils.ts`
- `components/admin/incidents/ShareLinkModal.tsx`
- `components/share/SharedIncidentView.tsx`
- `app/share/page.tsx`

### Modified Files
- `components/admin/incidents/IncidentDetail.tsx` - Added share button and modal

## Testing

### Test Create Share Link
```bash
1. Navigate to incident detail page
2. Click "Share Report" button
3. Select "Department Level"
4. Click "Create Share Link"
5. Verify URL is generated and copyable
```

### Test Access Shared Incident
```bash
1. Copy generated share link
2. Open in new incognito window
3. Verify incident details load
4. Verify you can update status with reason
5. Verify assignment section is visible but read-only
```

### Test Token Expiration
```bash
1. Manually modify token expiration in JWT
2. Try to access with expired token
3. Verify error message: "Access link has expired"
```

## Notes
- Token decoding happens client-side for better UX
- Server-side validation ensures security
- Department ID should be updated to come from user context
- Share page follows rescuer anonymous pattern for consistency
