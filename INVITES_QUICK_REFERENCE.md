# User Invites - Quick Reference

## Files Overview

### New Files Created

| File | Purpose |
|------|---------|
| `types/index.ts` | Invite types & interfaces |
| `lib/api/endpoints.ts` | API integration functions |
| `components/admin/invites/CreateInviteForm.tsx` | Create invite form component |
| `components/admin/invites/InvitesList.tsx` | Invites table component |
| `components/admin/invites/FilterBar.tsx` | Filter controls component |
| `app/admin/invites/page.tsx` | Admin management page |
| `app/invites/page.tsx` | Public info page |
| `app/invites/[inviteId]/page.tsx` | Invite acceptance page |
| `docs/INVITES.md` | Full documentation |
| `INVITES_IMPLEMENTATION.md` | Implementation summary |
| `INVITES_ARCHITECTURE.md` | Architecture & flow diagrams |
| `INVITES_USAGE.md` | Usage examples & patterns |

## Key Types

```typescript
type InviteRole = 'CITY_ADMIN' | 'SOS_ADMIN' | 'SK_ADMIN';
type InviteStatus = 'PENDING' | 'USED' | 'EXPIRED';

interface Invite {
  inviteId: string;
  code: string;
  role: InviteRole;
  municipalityCode: string;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
  usedAt?: string | null;
}
```

## API Functions

```typescript
// Create
createInvite({ role, municipalityCode })

// Read
getInvites({ role?, municipalityCode?, page?, limit? })
validateInvite(inviteId)

// Update/Accept
acceptInvite(inviteId, { code })
```

## Component Usage

### CreateInviteForm
```tsx
<CreateInviteForm
  onSuccess={(invite) => {}}
  onClose={() => {}}
  defaultMunicipalityCode="QZN"
/>
```

### InvitesList
```tsx
<InvitesList
  role="SOS_ADMIN"
  municipalityCode="QZN"
  refreshTrigger={0}
/>
```

### FilterBar
```tsx
<InvitesFilterBar
  role={role}
  municipalityCode={code}
  onRoleChange={setRole}
  onMunicipalityChange={setCode}
/>
```

## Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/admin/invites` | Admin management | APP_ADMIN, CITY_ADMIN |
| `/invites` | Public info | None |
| `/invites/[inviteId]` | Accept invite | User authenticated |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/invites` | ✅ | Create invite |
| GET | `/api/invites` | ✅ | List invites |
| GET | `/api/invites/:inviteId` | ✗ | Validate invite |
| POST | `/api/invites/:inviteId/accept` | ✅ | Accept invite |

## Status Codes

| Code | Meaning |
|------|---------|
| 201 | Invite created |
| 200 | Success |
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict (RBAC) |
| 410 | Expired/Used |
| 422 | Invalid code |

## Features

✅ 15-minute expiration  
✅ 6-digit codes  
✅ One-time use  
✅ Municipality scoping  
✅ Pagination  
✅ Status tracking  
✅ Filtering  
✅ Role-based access  

## Testing Checklist

- [ ] Create invite
- [ ] List invites
- [ ] Filter by role
- [ ] Filter by municipality
- [ ] Paginate
- [ ] Validate invite
- [ ] Accept with valid code
- [ ] Reject invalid code
- [ ] Reject expired invite
- [ ] Reject used invite

## Styling Classes Used

- `bg-blue-600` - Primary button
- `bg-red-100` - Error background
- `bg-green-100` - Success background
- `bg-gray-100` - Secondary background
- `text-gray-900` - Primary text
- `text-gray-600` - Secondary text
- `rounded-lg` - Border radius
- `shadow` - Box shadow
- `p-4`, `p-6` - Padding
- `space-y-4` - Vertical spacing

## Common Errors & Solutions

| Error | Solution |
|-------|----------|
| 401 Unauthorized | Check auth token in localStorage |
| 403 Forbidden | Verify user role (APP_ADMIN, CITY_ADMIN) |
| 409 RBAC Violation | CITY_ADMIN creating for different municipality |
| 410 Expired | Invite older than 15 minutes |
| 410 Used | Invite already accepted once |
| 422 Invalid Code | Code doesn't match 6 digits |

## Environment Setup

No special environment variables needed. All invites functionality uses existing:
- `NEXT_PUBLIC_API_BASE` - API base URL
- Auth token from `getAuthToken()`

## Related Docs

- [Full Documentation](./docs/INVITES.md)
- [Architecture Overview](./INVITES_ARCHITECTURE.md)
- [Usage Examples](./INVITES_USAGE.md)
- [Implementation Summary](./INVITES_IMPLEMENTATION.md)

## Development Notes

- All components use `'use client'` directive
- Full TypeScript support
- Consistent with existing code standards
- Uses existing shared components (Alert, Card, DataTable)
- API client handles auth interceptors
- Responsive design with Tailwind CSS

## Copy-Paste Templates

### Admin Page
```tsx
'use client';
import { RoleGuard } from '@/components/shared/RoleGuard';
import CreateInviteForm from '@/components/admin/invites/CreateInviteForm';
import InvitesList from '@/components/admin/invites/InvitesList';

export default function Page() {
  return (
    <RoleGuard requiredRoles={['APP_ADMIN', 'CITY_ADMIN']}>
      {/* Your content */}
    </RoleGuard>
  );
}
```

### API Call
```tsx
import { createInvite } from '@/lib/api/endpoints';

const response = await createInvite({
  role: 'SOS_ADMIN',
  municipalityCode: 'QZN'
});

if (response.success && response.data) {
  // Handle success
}
```

### Error Handling
```tsx
try {
  const response = await createInvite(data);
  if (response.success) {
    // Success
  } else {
    // API error
    console.error(response.error?.message);
  }
} catch (err: any) {
  // Network error
  console.error(err.response?.data?.error?.message || err.message);
}
```
