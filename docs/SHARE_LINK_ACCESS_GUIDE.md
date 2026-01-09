# Share Link Access Guide

## How to View Shared Incidents

### 1. **Department-Level Share**
- Shows all active incidents assigned to a department
- Access link format: `http://localhost:3000/share?token=<jwt>`
- Token contains: `assignment.departmentId` (without `assignmentId`)
- **Permissions:**
  - View all incident details
  - Update incident status with reason
  - View all assignments for the department

### 2. **Specific Assignment Share**
- Shows a specific incident assignment
- Access link format: `http://localhost:3000/share?token=<jwt>`
- Token contains: Both `assignment.assignmentId` and `assignment.departmentId`
- **Permissions:**
  - View incident details
  - Update incident status with reason
  - View only the specific assignment

## Token Structure

Your token contains:
```json
{
  "iss": "identity.e-citizen",
  "aud": "e-citizen",
  "exp": 1768454838,
  "identity": {
    "role": "CITY_ADMIN"
  },
  "actor": {
    "type": "SHARE_LINK",
    "cityCode": "0301407000"
  },
  "assignment": {
    "incidentId": "6956558a1858acbdf93aac70e",
    "assignmentId": "695f171f138fde19396a978f",
    "departmentId": "Municipal Disaster Risk Reduction and Management Office",
    "contextUsage": "REPORT_ASSIGNMENT_DEPARTMENT"
  },
  "tokenType": "share_link"
}
```

## Viewing Different Share Types

### For Department-Level Access
1. Create share link without selecting specific assignment
2. Share the generated URL
3. Recipient visits: `http://localhost:3000/share?token=<jwt>`
4. Page shows: Incident details + ability to update status

### For Assignment-Specific Access
1. Create share link with specific assignment selected
2. Share the generated URL
3. Recipient visits: `http://localhost:3000/share?token=<jwt>`
4. Page shows: Incident details + specific assignment + ability to update status

## Token Validation

The share page automatically:
1. ✅ Decodes the JWT client-side
2. ✅ Checks token expiration
3. ✅ Validates token structure
4. ✅ Validates with backend API
5. ✅ Displays appropriate error if token is invalid/expired

## Accessing the Shared Page

Simply visit the link with the token:
```
http://localhost:3000/share?token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

The page will:
1. Load the incident data
2. Display a read-only view of incident details
3. Allow status updates with reason
4. Show expiration information
5. Display assigned department/responder info

## What Can Be Done on Shared Page

✅ **Allowed:**
- View incident title, description, location
- View reporter information
- View incident severity and current status
- View location on map
- Update incident status with required reason
- View assignment details
- See incident metadata and category

❌ **Not Allowed:**
- Edit incident details (title, description, location)
- Create new assignments
- Manage incident assignments
- Delete incident
- Revoke the share link from shared page (admin only)

## Security Features

1. **JWT Token Expiration** - Links expire automatically
2. **Server-Side Validation** - Token validated on backend
3. **No Authentication Required** - Token itself is the credential
4. **Department Scoping** - Access limited to shared department only
5. **Read-Only for Most Fields** - Minimal edit permissions
6. **Audit Trail** - Actions logged with reason
