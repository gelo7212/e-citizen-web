# User Invites System

## Overview

The User Invites system allows administrators to create time-limited invitations for new users to join as admins (CITY_ADMIN, SOS_ADMIN, or SK_ADMIN roles).

## Features

- ✅ **15-minute expiration** - All invites expire after 15 minutes from creation
- ✅ **6-digit codes** - Random numeric codes for invite acceptance
- ✅ **One-time use** - Invites can only be accepted once
- ✅ **Municipality scoping** - CITY_ADMIN can only create invites for their municipality
- ✅ **Pagination** - List endpoint supports offset-based pagination
- ✅ **Status tracking** - Monitor invite status: PENDING, USED, or EXPIRED

## Pages

### 1. Admin Invites Management Page
**URL:** `/admin/invites`

Admin page for managing user invitations. Only accessible to users with `APP_ADMIN` or `CITY_ADMIN` roles.

**Features:**
- Create new invites with specified role and municipality
- View list of all created invites
- Filter invites by role and municipality code
- Pagination support for large invite lists
- Track invite status (PENDING, USED, EXPIRED)

### 2. Public Invites Info Page
**URL:** `/invites`

Public information page about the invites system.

**Features:**
- Information about how invites work
- General guidelines and important information
- Link back to home page

### 3. Invite Acceptance Page
**URL:** `/invites/[inviteId]`

Public page where users can accept invites. This is where users land when clicking invite links.

**Features:**
- Validates invite code before accepting
- Shows invite details (role, municipality, expiration)
- Requires 6-digit code entry
- Displays appropriate error messages for expired/used/invalid invites
- Redirects to admin dashboard on successful acceptance

## Components

### CreateInviteForm
Location: `components/admin/invites/CreateInviteForm.tsx`

Form component for creating new invites.

**Props:**
```typescript
interface CreateInviteFormProps {
  onSuccess?: (invite: InviteResponse) => void;
  onClose?: () => void;
  defaultMunicipalityCode?: string;
}
```

**Features:**
- Role selection dropdown (CITY_ADMIN, SOS_ADMIN, SK_ADMIN)
- Municipality code input
- Success message with created code
- Error handling

### InvitesList
Location: `components/admin/invites/InvitesList.tsx`

Displays paginated list of invites in a data table.

**Props:**
```typescript
interface InvitesListProps {
  role?: InviteRole;
  municipalityCode?: string;
  onRefresh?: () => void;
  refreshTrigger?: number;
}
```

**Features:**
- Column: Invite ID
- Column: Code (6-digit)
- Column: Role
- Column: Municipality
- Column: Status (PENDING, USED, EXPIRED)
- Column: Expiration datetime
- Column: Used datetime
- Pagination with prev/next buttons
- Responsive design

### FilterBar
Location: `components/admin/invites/FilterBar.tsx`

Filter controls for invite list.

**Props:**
```typescript
interface FilterBarProps {
  role?: InviteRole;
  municipalityCode?: string;
  onRoleChange?: (role: InviteRole | undefined) => void;
  onMunicipalityChange?: (code: string) => void;
}
```

**Features:**
- Filter by role
- Filter by municipality code
- Combined filter support

## API Integration

### Types
Added to `types/index.ts`:
- `Invite` - Full invite object with status
- `InviteResponse` - Response after creating invite
- `ValidateInviteResponse` - Response from validation endpoint
- `AcceptInviteRequest` - Request body for accept endpoint
- `AcceptInviteResponse` - Response from accept endpoint
- `InviteRole` - Type for invite roles (CITY_ADMIN | SOS_ADMIN | SK_ADMIN)
- `InviteStatus` - Type for invite status (PENDING | USED | EXPIRED)

### Endpoints
Added to `lib/api/endpoints.ts`:

```typescript
// Create invite
createInvite(data: { role: InviteRole; municipalityCode: string })

// List invites with filters
getInvites(filters?: {
  role?: InviteRole;
  municipalityCode?: string;
  page?: number;
  limit?: number;
})

// Validate invite
validateInvite(inviteId: string)

// Accept invite
acceptInvite(inviteId: string, data: AcceptInviteRequest)
```

## Usage

### Creating an Invite (Admin)

1. Navigate to `/admin/invites`
2. Click "Create Invite" button
3. Select the role (CITY_ADMIN, SOS_ADMIN, SK_ADMIN)
4. Enter municipality code
5. Click "Create Invite"
6. Copy the generated 6-digit code
7. Share the invite link or code with the user

### Accepting an Invite (User)

1. Click the invite link sent to you (or navigate to `/invites/[inviteId]`)
2. The invite validity will be checked automatically
3. Enter the 6-digit code provided to you
4. Click "Accept Invite"
5. You'll be redirected to the admin dashboard

## Code Standards

- **Client Components:** All components are marked with `'use client'` directive
- **Type Safety:** Full TypeScript support with proper interface definitions
- **Error Handling:** Comprehensive error handling with user-friendly messages
- **Responsive Design:** Mobile-friendly UI using Tailwind CSS
- **Component Structure:** Reusable, single-responsibility components
- **API Calls:** Consistent error handling using the unified API client
- **Loading States:** Proper loading indicators and disabled button states
- **Accessibility:** Semantic HTML with proper labels and ARIA attributes

## Security Notes

- Authentication is required for sensitive operations (create, list, accept invites)
- Authorization checks are enforced by the API
- Invites expire after 15 minutes
- One-time use ensures invites cannot be reused
- Municipality scoping prevents admins from creating invites outside their scope

## Testing Scenarios

1. **Create Invite**: Valid role and municipality code
2. **List Invites**: View created invites with filters
3. **Validate Invite**: Check invite validity before acceptance
4. **Accept Invite**: Valid code entry
5. **Expired Invite**: Attempt to use expired invite (shows error)
6. **Used Invite**: Attempt to use already-accepted invite (shows error)
7. **Invalid Code**: Enter wrong 6-digit code (shows error)
8. **Municipality Scoping**: CITY_ADMIN can only create invites for their municipality

## Future Enhancements

- Invite resend functionality
- Bulk invite creation
- Invite cancellation/revocation
- Email notifications for invites
- Invite analytics and reporting
- QR code for invite links
- Custom expiration time selection
