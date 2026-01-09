# Admin Page Component Architecture

## Page Structure

```
/admin
├── /admin/page.tsx
│   └── Main Admin Dashboard
│       ├── Role-based stats cards
│       ├── Admin sections grid
│       │   ├── User Invites → /admin/invites
│       │   ├── City Setup → /admin/city
│       │   ├── SOS Management → /admin/sos
│       │   ├── Account Management → /admin/accounts
│       │   ├── Super User → /admin/super-user
│       │   └── Rescuer Management → /admin/rescuer
│       └── Info box

/admin/invites
├── /admin/invites/page.tsx
│   └── City Admin Invites Page
│       ├── Header + Create button
│       ├── CreateInviteForm (component)
│       ├── InvitesFilterBar (component)
│       ├── InvitesList (component)
│       ├── ShareInviteModal (NEW component)
│       └── Info box

/admin/super-user
├── /admin/super-user/page.tsx
│   └── Super User Dashboard
│       ├── Role-based stats cards
│       ├── Super user controls grid
│       │   ├── System Invites → /admin/super-user/invites
│       │   ├── Admin Accounts → /admin/accounts
│       │   ├── System Settings → /admin/super-user/settings
│       │   ├── Audit Log → /admin/super-user/audit
│       │   ├── City Management → /admin/super-user/cities
│       │   └── System Health → /admin/super-user/health
│       └── Super user powers info box

/admin/super-user/invites
└── /admin/super-user/invites/page.tsx
    └── Super User Invites Page
        ├── Header + Create button
        ├── CreateInviteForm (component)
        ├── InvitesFilterBar (component)
        ├── InvitesList (component)
        ├── ShareInviteModal (NEW component)
        └── Super user permissions info box
```

## Component Hierarchy

```
AdminDashboardDefault (page.tsx)
├── useAuth()
├── isAppAdmin() check
├── isCityAdmin() check
├── isSosAdmin() check
├── isYouthAdmin() check
└── Rendered Components:
    ├── Card (stats)
    ├── Link → AdminInvitesPage
    ├── Link → CitySetupPage
    ├── Link → SOSPage
    ├── Link → AccountsPage
    ├── Link → SuperUserPage
    ├── Link → RescuerPage
    └── Card (info)

AdminInvitesPage (admin/invites/page.tsx)
├── RoleGuard (['APP_ADMIN', 'CITY_ADMIN'])
├── CreateInviteForm
│   ├── getAuthToken()
│   ├── createInvite() API call
│   └── onSuccess callback → sets shareInvite state
├── InvitesFilterBar
│   ├── Role filter dropdown
│   └── Municipality code filter
├── InvitesList
│   ├── getInvites() API call
│   ├── Pagination
│   ├── Status badges
│   └── Copy code functionality
├── ShareInviteModal (NEW)
│   ├── Copy code button
│   ├── Copy link button
│   ├── Copy message button
│   └── Close button
└── Info box

SuperUserAdminDashboard (admin/super-user/page.tsx)
├── useAuth()
├── isAppAdmin() check
└── Rendered Components:
    ├── Card (stats)
    ├── Link → SystemInvitesPage
    ├── Link → AccountsPage
    ├── Link → SystemSettingsPage
    ├── Link → AuditLogPage
    ├── Link → CityManagementPage
    ├── Link → SystemHealthPage
    └── Card (super user powers)

SuperUserInvitesPage (admin/super-user/invites/page.tsx)
├── RoleGuard (['APP_ADMIN'])
├── CreateInviteForm
│   ├── createInvite() - No restrictions
│   └── onSuccess callback → sets shareInvite state
├── InvitesFilterBar
│   ├── Role filter (all roles)
│   └── Municipality filter (all municipalities)
├── InvitesList
│   ├── getInvites() - System-wide
│   ├── All status types
│   └── Full pagination
├── ShareInviteModal (NEW)
│   ├── Full functionality
│   ├── Copy code button
│   ├── Copy link button
│   ├── Copy message button
│   └── Close button
└── Super user permissions info box

ShareInviteModal (components/admin/invites/ShareInviteModal.tsx) - NEW
├── Props: invite, onClose
├── State: copied (for feedback)
├── Features:
│   ├── Modal overlay (clickable to close)
│   ├── Invite details display
│   ├── Code display + copy button
│   ├── Link display + copy button
│   ├── Full message display + copy button
│   ├── Expiration time warning
│   └── Close button
└── Uses: navigator.clipboard API
```

## Data Flow

```
User Interaction → Admin Creates Invite
                        ↓
                 CreateInviteForm
                        ↓
                 API: createInvite()
                        ↓
                 onSuccess callback
                        ↓
              setShareInvite(invite)
                        ↓
         ShareInviteModal appears
                        ↓
          User clicks copy button
                        ↓
        navigator.clipboard.writeText()
                        ↓
          "Copied!" feedback (2 sec)
                        ↓
          User shares code/link
```

## State Management

### AdminInvitesPage
```typescript
const [showCreateForm, setShowCreateForm] = useState(false);
const [selectedRole, setSelectedRole] = useState<InviteRole | undefined>();
const [selectedMunicipality, setSelectedMunicipality] = useState('');
const [refreshTrigger, setRefreshTrigger] = useState(0);
const [shareInvite, setShareInvite] = useState<InviteResponse | null>(null);
```

### SuperUserInvitesPage
```typescript
const [showCreateForm, setShowCreateForm] = useState(false);
const [selectedRole, setSelectedRole] = useState<InviteRole | undefined>();
const [selectedMunicipality, setSelectedMunicipality] = useState('');
const [refreshTrigger, setRefreshTrigger] = useState(0);
const [shareInvite, setShareInvite] = useState<InviteResponse | null>(null);
```

### ShareInviteModal
```typescript
const [copied, setCopied] = useState(false);
```

## Props Interfaces

### ShareInviteModalProps
```typescript
interface ShareInviteModalProps {
  invite: InviteResponse | null;
  onClose: () => void;
}
```

### CreateInviteFormProps (existing)
```typescript
interface CreateInviteFormProps {
  onSuccess?: (invite: InviteResponse) => void;
  onClose?: () => void;
  defaultMunicipalityCode?: string;
}
```

### InvitesListProps (existing)
```typescript
interface InvitesListProps {
  role?: InviteRole;
  municipalityCode?: string;
  onRefresh?: () => void;
  refreshTrigger?: number;
}
```

### InvitesFilterBarProps (existing)
```typescript
interface InvitesFilterBarProps {
  role?: InviteRole;
  municipalityCode?: string;
  onRoleChange: (role: InviteRole | undefined) => void;
  onMunicipalityChange: (code: string) => void;
}
```

## API Integration

### Endpoints Used
```typescript
// Create invite
POST /api/invites
Body: { role: InviteRole, municipalityCode: string }
Returns: InviteResponse

// Get invites list
GET /api/invites?role=CITY_ADMIN&municipalityCode=QZN&page=1&limit=20
Returns: { invites: Invite[], total: number }
```

## Styling Classes Used

```css
/* Layout */
.space-y-6, .space-y-8 - Vertical spacing
.grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 - Responsive grid
.flex justify-between - Header layout

/* Typography */
.text-3xl font-bold text-gray-900 - Main title
.text-xl font-bold - Subtitle
.text-sm text-gray-600 - Secondary text

/* Colors */
.bg-blue-600 / .bg-blue-50 - Blue theme
.bg-purple-600 / .bg-purple-50 - Purple theme
.bg-green-600 / .bg-green-50 - Green theme
.text-blue-900 / .bg-blue-50 - Info boxes

/* Effects */
.hover:shadow-lg - Card hover effect
.transition - Smooth transitions
.rounded-lg - Border radius
.shadow - Box shadow
```

## Error Handling

```typescript
try {
  // API call
  const response = await createInvite(...);
  
  if (response.success) {
    setShareInvite(response.data);
  } else {
    // Show error message
  }
} catch (err) {
  // Log error
  // Show error message
}
```

## Accessibility Features

✅ Semantic HTML (button, form, modal)
✅ ARIA labels for screen readers
✅ Keyboard navigation support
✅ Focus management
✅ Color not only indicator (plus text/icons)
✅ Button labels clear and descriptive
✅ Modal has close button and overlay click

## Performance Considerations

✅ Component memoization where needed
✅ Debounced API calls
✅ Pagination for large lists
✅ Conditional rendering for role-based views
✅ Lazy loading of modal content
✅ Efficient state updates
