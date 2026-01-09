# User Invites - Usage Examples

## For Frontend Developers

### Using the Invite Components in Your Code

#### 1. Create Invite Form
```tsx
import CreateInviteForm from '@/components/admin/invites/CreateInviteForm';

// Basic usage
<CreateInviteForm
  onSuccess={(invite) => {
    console.log('Invite created:', invite);
  }}
/>

// With municipality preset
<CreateInviteForm
  defaultMunicipalityCode="QZN"
  onSuccess={(invite) => {
    // Trigger list refresh
    setRefreshTrigger(prev => prev + 1);
  }}
  onClose={() => setShowForm(false)}
/>
```

#### 2. Invites List
```tsx
import InvitesList from '@/components/admin/invites/InvitesList';

// Basic usage - show all invites
<InvitesList />

// Filtered by role
<InvitesList role="SOS_ADMIN" />

// Filtered by municipality
<InvitesList municipalityCode="QZN" />

// With filter combinations and refresh trigger
<InvitesList
  role="CITY_ADMIN"
  municipalityCode="QZN"
  refreshTrigger={refreshCount}
/>
```

#### 3. Filter Bar
```tsx
import InvitesFilterBar from '@/components/admin/invites/FilterBar';

const [role, setRole] = useState<InviteRole | undefined>();
const [municipality, setMunicipality] = useState('');

<InvitesFilterBar
  role={role}
  municipalityCode={municipality}
  onRoleChange={setRole}
  onMunicipalityChange={setMunicipality}
/>
```

### Using the API Endpoints

#### 1. Create Invite
```typescript
import { createInvite } from '@/lib/api/endpoints';

// Create a SOS admin invite for municipality QZN
const response = await createInvite({
  role: 'SOS_ADMIN',
  municipalityCode: 'QZN'
});

if (response.success) {
  const { inviteId, code, expiresAt, inviteLink } = response.data!;
  
  // Share link: inviteLink
  // Share code: code
  // Show expiration: expiresAt
}
```

#### 2. List Invites
```typescript
import { getInvites } from '@/lib/api/endpoints';

// Get all pending invites for a municipality
const response = await getInvites({
  municipalityCode: 'QZN',
  page: 1,
  limit: 20
});

if (response.success) {
  const { invites, total, page, limit } = response.data!;
  
  invites.forEach(invite => {
    console.log(`Code: ${invite.code}, Status: ${invite.status}`);
  });
}
```

#### 3. Validate Invite (for public use)
```typescript
import { validateInvite } from '@/lib/api/endpoints';

// Check if invite is still valid (before showing form)
const response = await validateInvite('507f1f77bcf86cd799439011');

if (response.success && response.data?.valid) {
  // Show acceptance form
} else {
  // Show error based on response.data?.reason
  // EXPIRED, USED, or INVALID
}
```

#### 4. Accept Invite (from public page)
```typescript
import { acceptInvite } from '@/lib/api/endpoints';

// User enters 6-digit code and clicks accept
const response = await acceptInvite('507f1f77bcf86cd799439011', {
  code: '123456'
});

if (response.success) {
  // Redirect to /admin/dashboard
  // Or show confirmation and then redirect
}
```

## For Admins (Manual Testing)

### Scenario 1: Create an Invite
1. Navigate to `http://localhost:3000/admin/invites`
2. Click "Create Invite" button
3. Select role: "SOS_ADMIN"
4. Enter municipality code: "QZN"
5. Click "Create Invite"
6. Copy the displayed 6-digit code
7. Copy the invite link (if shown)

### Scenario 2: Accept an Invite
1. Open invite link in new tab/window
   - Or navigate to: `http://localhost:3000/invites/[inviteId]`
2. Wait for validation to complete
3. Enter the 6-digit code
4. Click "Accept Invite"
5. You should be redirected to `/admin/dashboard`

### Scenario 3: Test Expired Invite
1. Create an invite (note the time)
2. Wait 15 minutes
3. Try to accept it
4. Should see "Invite Unavailable - Expired" message

### Scenario 4: Test Used Invite
1. Create an invite
2. Accept it once (successfully)
3. Try to use the same invite link again
4. Should see "Invite Unavailable - Used" message

### Scenario 5: Test Invalid Code
1. Create an invite with code "123456"
2. Go to accept page
3. Enter wrong code "654321"
4. Should see "Invalid code. Please check and try again" error

### Scenario 6: Test Filters
1. Create multiple invites with different roles and municipalities
2. In invite list, select role filter: "CITY_ADMIN"
3. List should only show CITY_ADMIN invites
4. Add municipality filter: "QZN"
5. List should only show QZN CITY_ADMIN invites

## Common Code Patterns

### Pattern 1: Create and Show Invite
```tsx
const [createdInvite, setCreatedInvite] = useState<InviteResponse | null>(null);

const handleCreateInvite = async (role: InviteRole, code: string) => {
  try {
    const response = await createInvite({ role, municipalityCode: code });
    if (response.success) {
      setCreatedInvite(response.data!);
      // Copy to clipboard
      navigator.clipboard.writeText(response.data!.code);
      // Show toast: "Code copied!"
    }
  } catch (error) {
    // Show error toast
  }
};
```

### Pattern 2: Filter and Refresh List
```tsx
const [role, setRole] = useState<InviteRole | undefined>();
const [municipality, setMunicipality] = useState('');
const [refresh, setRefresh] = useState(0);

const handleFiltersChange = (newRole?: InviteRole, newMunicipality?: string) => {
  setRole(newRole);
  setMunicipality(newMunicipality);
  // List automatically refreshes due to useEffect dependency
};

const handleInviteCreated = () => {
  // Trigger list refresh
  setRefresh(prev => prev + 1);
};
```

### Pattern 3: Auto-validate on Page Load
```tsx
useEffect(() => {
  const validate = async () => {
    try {
      const response = await validateInvite(inviteId);
      if (response.success && response.data?.valid) {
        // Show form
        setValid(true);
      } else {
        // Show error
        setError(`Invite is ${response.data?.reason?.toLowerCase()}`);
      }
    } catch (error) {
      setError('Failed to validate invite');
    }
  };

  validate();
}, [inviteId]);
```

### Pattern 4: Accept with Code Input
```tsx
const [code, setCode] = useState('');
const [error, setError] = useState<string | null>(null);

const handleCodeInput = (value: string) => {
  // Only allow digits, max 6 chars
  const digits = value.replace(/\D/g, '').slice(0, 6);
  setCode(digits);
};

const handleAccept = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!/^\d{6}$/.test(code)) {
    setError('Please enter a valid 6-digit code');
    return;
  }

  try {
    const response = await acceptInvite(inviteId, { code });
    if (response.success) {
      // Redirect after 1-2 seconds
      setTimeout(() => router.push('/admin/dashboard'), 1500);
    }
  } catch (error) {
    setError(/* handle error */);
  }
};
```

## Troubleshooting

### Invite Not Showing in List
- Check if filters are applied too strictly
- Verify the invite hasn't expired (15 min timeout)
- Ensure you have correct permissions (APP_ADMIN or CITY_ADMIN)

### Code Not Accepting
- Verify exact 6 digits without spaces
- Check if invite is expired
- Check if invite was already used
- Ensure you're authenticated when accepting

### Create Form Not Appearing
- Click "Create Invite" button
- Check browser console for errors
- Verify you have APP_ADMIN or CITY_ADMIN role

### Redirect Not Working After Accept
- Check if user is authenticated
- Verify `/admin/dashboard` exists
- Check browser console for route errors

## Integration Checklist

- [ ] Types imported from `@/types`
- [ ] API functions imported from `@/lib/api/endpoints`
- [ ] Components imported from `@/components/admin/invites`
- [ ] RoleGuard wraps admin pages
- [ ] Error handling implemented
- [ ] Loading states shown
- [ ] Success messages displayed
- [ ] Pagination working
- [ ] Filters working
- [ ] Mobile responsive
- [ ] Accessibility (labels, ARIA)
- [ ] Token in requests (auto via interceptor)

## Notes

- All date/times are in ISO 8601 format
- Timezone is handled by backend
- Codes are 6 random digits
- Expiration is always 15 minutes
- One-time use is enforced by backend
- Municipality scoping is enforced by backend
