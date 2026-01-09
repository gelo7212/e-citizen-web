# SOS Assignment Quick Reference

## Files Modified/Created

### New Files
- **`components/admin/sos/AssignRescuerModal.tsx`** - Modal component for assigning rescuers
- **`docs/SOS_ASSIGNMENT_IMPLEMENTATION.md`** - Implementation documentation

### Modified Files
- **`lib/services/sosService.ts`** - Added `getRescuers()` and `dispatchRescue()` functions
- **`hooks/useSOS.ts`** - Added `fetchRescuers()` and `assignRescuer()` hooks
- **`app/admin/sos/management/page.tsx`** - Added assign button and modal integration

## Usage

### For Developers

Import and use the dispatch functions:

```typescript
import { useSOS } from '@/hooks/useSOS';

export function MyComponent() {
  const { fetchRescuers, assignRescuer } = useSOS();
  
  // Fetch rescuers
  const rescuers = await fetchRescuers();
  
  // Assign rescuer to SOS
  const success = await assignRescuer(sosId, rescuerId);
}
```

### For Users/Admins

1. Navigate to `/admin/sos/management`
2. Find the incident in the table
3. Click **"Assign Rescue"** button
4. Select a rescuer from the modal
5. Review rescuer details
6. Click **"Assign Rescuer"** to confirm

## API Endpoints

### Get Rescuers
```
GET /api/identity/admin/users?role=RESCUER
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_id",
      "displayName": "Rescuer Name",
      "email": "rescuer@email.com",
      "phone": "+1234567890",
      "role": "RESCUER",
      "registrationStatus": "active",
      ...
    }
  ]
}
```

### Dispatch Rescue
```
POST /api/sos/{sosId}/dispatch/rescue
Authorization: Bearer {token}
Content-Type: application/json

{
  "rescuerId": "rescuer_id"
}
```

**Response:** Success (200/201)
```json
{
  "success": true,
  "data": {...}
}
```

## Component Props

### AssignRescuerModal

```typescript
<AssignRescuerModal
  sosId="incident_123"           // SOS incident ID
  isOpen={isOpen}                // Modal visibility
  onClose={handleClose}          // Close handler
  onSuccess={handleSuccess}      // Success callback
/>
```

## Features

✅ Fetch list of available rescuers  
✅ Display rescuer details (name, email, phone, department, status)  
✅ Select rescuer via radio button  
✅ Preview selected rescuer  
✅ Assign rescuer to SOS incident  
✅ Error handling and user feedback  
✅ Loading states  
✅ Success/failure notifications  

## Error Handling

The system handles:
- Missing authentication token
- Network failures
- API errors
- No rescuers available
- Invalid rescuer selection
- Dispatch assignment failures

All errors are displayed to the user with clear messages.
