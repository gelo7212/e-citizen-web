# User Invites - Visual Flow & Architecture

## System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN CREATES INVITE                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ /admin/invites  │
                    └─────────────────┘
                              │
                    ┌─────────────────────────────────┐
                    │ CreateInviteForm Component      │
                    │ - Select Role                   │
                    │ - Select Municipality           │
                    │ - Submit                        │
                    └─────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────────────────┐
                    │ POST /api/invites               │
                    │ Returns: {                      │
                    │   inviteId, code, role, ...     │
                    │ }                               │
                    └─────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────────────────┐
                    │ Invite Created Successfully!    │
                    │ Shows 6-digit code to share     │
                    └─────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  USER ACCEPTS INVITE                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────────────────────────────┐
                    │ Click Invite Link               │
                    │ /invites/[inviteId]             │
                    └─────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────────────────┐
                    │ GET /api/invites/:inviteId      │
                    │ Validate invite                 │
                    └─────────────────────────────────┘
                              │
                    ┌─────────────────────────────────┐
                    │ Check Status                    │
                    └─────────────────────────────────┘
                         │      │        │
                    ┌────┴──┐  ┌┴────┐  ┌┴─────┐
                    ▼       ▼  ▼     ▼  ▼      ▼
                  VALID   EXPIRED  USED INVALID
                    │
                    ▼
        ┌───────────────────────────┐
        │ Show Invite Details       │
        │ - Role                    │
        │ - Municipality            │
        │ - Expiration              │
        │ - Input Field for Code    │
        └───────────────────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │ Enter 6-Digit Code        │
        │ Click Accept Invite       │
        └───────────────────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │ POST /api/invites/        │
        │   :inviteId/accept        │
        │ Body: { code: "123456" }  │
        └───────────────────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │ Success!                  │
        │ Account created           │
        │ Redirect to Dashboard     │
        └───────────────────────────┘
```

## Component Architecture

```
Admin Invite Management
┌─────────────────────────────────────────────┐
│ /admin/invites/page.tsx                     │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Header + Create Button              │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ CreateInviteForm (Optional)         │   │
│  │ - Shows when create button clicked  │   │
│  │ - Hidden after successful create    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ FilterBar                           │   │
│  │ - Filter by role                    │   │
│  │ - Filter by municipality            │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ InvitesList                         │   │
│  │ - Data table with columns           │   │
│  │ - Pagination controls               │   │
│  │ - Responsive design                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Info Box                            │   │
│  │ - Feature summary                   │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘

Public Invite Acceptance
┌─────────────────────────────────────────────┐
│ /invites/[inviteId]/page.tsx                │
├─────────────────────────────────────────────┤
│                                             │
│  1. On Load: Validate Invite                │
│     ├─ GET /api/invites/:inviteId           │
│     └─ Show Loading State                   │
│                                             │
│  2. If Invalid: Show Error                  │
│     ├─ Expired                              │
│     ├─ Used                                 │
│     └─ Invalid                              │
│                                             │
│  3. If Valid: Show Form                     │
│     ├─ Display invite details               │
│     ├─ 6-digit code input                   │
│     └─ Accept button                        │
│                                             │
│  4. On Submit: Accept Invite                │
│     ├─ POST /api/invites/:inviteId/accept   │
│     ├─ Validate code format                 │
│     └─ Redirect on success                  │
│                                             │
│  5. Success: Show Confirmation              │
│     ├─ Display role & municipality          │
│     └─ Redirect to dashboard                │
│                                             │
└─────────────────────────────────────────────┘
```

## Data Flow

```
CreateInviteForm
├─ Props: onSuccess, onClose, defaultMunicipalityCode
├─ State:
│  ├─ role: InviteRole
│  ├─ municipalityCode: string
│  ├─ isLoading: boolean
│  ├─ error: string | null
│  └─ successMessage: string | null
├─ Calls: createInvite() endpoint
└─ Returns: InviteResponse

InvitesList
├─ Props: role?, municipalityCode?, refreshTrigger
├─ State:
│  ├─ invites: Invite[]
│  ├─ isLoading: boolean
│  ├─ page: number
│  ├─ limit: number
│  └─ total: number
├─ Calls: getInvites() endpoint
└─ Renders: DataTable with pagination

FilterBar
├─ Props: role?, municipalityCode?, callbacks
├─ Features:
│  ├─ Role dropdown
│  └─ Municipality input
└─ Triggers: Parent page refresh

AcceptInvitePage
├─ Route Params: [inviteId]
├─ State:
│  ├─ inviteData: ValidateInviteResponse | null
│  ├─ code: string
│  ├─ isValidating: boolean
│  ├─ isSubmitting: boolean
│  ├─ error: string | null
│  └─ success: AcceptInviteResponse | null
├─ On Load:
│  └─ Calls: validateInvite()
└─ On Submit:
   ├─ Validates code format
   └─ Calls: acceptInvite()
```

## API Request/Response Examples

### 1. Create Invite
```
POST /api/invites
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "SOS_ADMIN",
  "municipalityCode": "QZN"
}

RESPONSE 201:
{
  "success": true,
  "data": {
    "inviteId": "507f1f77bcf86cd799439011",
    "code": "123456",
    "role": "SOS_ADMIN",
    "municipalityCode": "QZN",
    "expiresAt": "2026-01-05T12:30:45.123Z",
    "inviteLink": "https://app.example.com/invites/507f1f77bcf86cd799439011"
  }
}
```

### 2. List Invites
```
GET /api/invites?role=SOS_ADMIN&municipalityCode=QZN&page=1&limit=20
Authorization: Bearer <token>

RESPONSE 200:
{
  "success": true,
  "data": {
    "invites": [
      {
        "inviteId": "507f1f77bcf86cd799439011",
        "code": "123456",
        "role": "SOS_ADMIN",
        "municipalityCode": "QZN",
        "status": "PENDING",
        "expiresAt": "2026-01-05T12:30:45.123Z",
        "createdAt": "2026-01-05T12:15:45.123Z",
        "usedAt": null
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 20
  }
}
```

### 3. Validate Invite
```
GET /api/invites/507f1f77bcf86cd799439011
(No auth required)

RESPONSE 200:
{
  "success": true,
  "data": {
    "inviteId": "507f1f77bcf86cd799439011",
    "valid": true,
    "role": "SOS_ADMIN",
    "municipalityCode": "QZN",
    "expiresAt": "2026-01-05T12:30:45.123Z",
    "reason": null
  }
}
```

### 4. Accept Invite
```
POST /api/invites/507f1f77bcf86cd799439011/accept
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "123456"
}

RESPONSE 200:
{
  "success": true,
  "data": {
    "success": true,
    "role": "SOS_ADMIN",
    "municipalityCode": "QZN",
    "message": "Invite accepted successfully"
  }
}
```

## Feature Matrix

| Feature | Admin Page | Accept Page | Public Page |
|---------|-----------|-------------|------------|
| Create Invite | ✅ | ✗ | ✗ |
| List Invites | ✅ | ✗ | ✗ |
| Filter Invites | ✅ | ✗ | ✗ |
| Validate Invite | ✗ | ✅ | ✗ |
| Accept Invite | ✗ | ✅ | ✗ |
| View Info | ✗ | ✗ | ✅ |
| Pagination | ✅ | ✗ | ✗ |
| Role-based Access | ✅ | ✗ | ✗ |
