# SOS Service Documentation

## Overview

The SOS service provides a complete API integration layer for handling SOS requests and messaging in the e-Citizen application. It includes:

- **Service Layer** (`sosService.ts`) - Direct API calls to the BFF
- **React Hook** (`useSOS.ts`) - State management for SOS operations
- **Components** - Pre-built UI components for SOS management

---

## Service Layer (`lib/services/sosService.ts`)

### SOS Request Operations

#### `getSOSRequestById(sosId: string)`
Fetch a specific SOS request by ID.

```typescript
const result = await getSOSRequestById('sos-123');
if (result.success) {
  console.log(result.data); // SOSRequest object
}
```

#### `getUserSOSRequests(userId: string)`
Get all SOS requests for a specific user.

```typescript
const result = await getUserSOSRequests('user-456');
if (result.success) {
  console.log(result.data); // Array of SOSRequest
  console.log(result.total); // Total count
}
```

#### `getActiveCitizenSOS(userId: string, cityCode?: string)`
Get active SOS requests for a citizen, optionally filtered by city.

```typescript
const result = await getActiveCitizenSOS('citizen-789', 'MNL');
if (result.success) {
  console.log(result.data); // Active SOS requests
}
```

#### `updateSOSTag(sosId: string, tag: string)`
Add or update a tag/label on an SOS request.

```typescript
const result = await updateSOSTag('sos-123', 'High Priority - Medical');
if (result.success) {
  console.log('Tag updated');
}
```

#### `closeSOSRequest(sosId: string)`
Close an active SOS request.

```typescript
const result = await closeSOSRequest('sos-123');
if (result.success) {
  console.log('SOS closed');
}
```

---

---

### Nearby SOS Endpoint

#### `getNearbySOSRequests(latitude: number, longitude: number, radius?: number)`
Get nearby SOS requests by geographic coordinates.

```typescript
const result = await getNearbySOSRequests(14.6349, 121.0388, 120);
if (result.success) {
  console.log(result.data); // Array of NearbySOS objects
  // Example response:
  // {
  //   sosId: "6956cab6184d38f814a89d2b",
  //   citizenId: "69569b6034bbb2fd9a84ae57",
  //   status: "active",
  //   location: { latitude: 14.66, longitude: 121.00, accuracy: 7 },
  //   address: { barangay: "Balintawak", city: "Quezon City" },
  //   distance: 38.06
  // }
}
```

**Parameters:**
- `latitude` (number) - User's latitude
- `longitude` (number) - User's longitude
- `radius` (number, optional) - Search radius in meters (default: 120)

---

### Message Operations

#### `sendSOSMessage(sosId: string, payload: SendMessagePayload)`
Send a message to an SOS conversation.

```typescript
const result = await sendSOSMessage('sos-123', {
  senderType: 'SOS_ADMIN',
  senderId: 'admin-001',
  senderDisplayName: 'Admin Support',
  contentType: 'text',
  content: 'We are dispatching a rescue team to your location.',
  cityId: 'MNL',
});

if (result.success) {
  console.log(result.data); // SOSMessage object
}
```

#### `getSOSMessages(sosId: string, skip?: number, limit?: number)`
Get all messages for an SOS conversation (paginated).

```typescript
const result = await getSOSMessages('sos-123', 0, 50);
if (result.success) {
  console.log(result.data.data); // Array of messages
  console.log(result.data.total); // Total message count
}
```

#### `getSOSMessageById(messageId: string)`
Get a specific message by ID.

```typescript
const result = await getSOSMessageById('msg-456');
if (result.success) {
  console.log(result.data); // SOSMessage object
}
```

---

## React Hook (`hooks/useSOS.ts`)

The `useSOS` hook provides state management and simplified API access for components.

### Usage

```typescript
export function MyComponent() {
  const {
    sosRequest,
    sosRequests,
    nearbySOS,
    messages,
    isLoading,
    error,
    fetchSOSRequest,
    fetchUserSOSRequests,
    fetchActiveCitizenSOS,
    fetchNearbySOSRequests,
    updateTag,
    closeSOS,
    sendMessage,
    fetchMessages,
    fetchMessageById,
  } = useSOS();

  // Your component logic
}
```

### State Properties

| Property | Type | Description |
|----------|------|-------------|
| `sosRequest` | `SOSRequest \| null` | Currently loaded SOS request |
| `sosRequests` | `SOSRequest[]` | Array of SOS requests |
| `nearbySOS` | `NearbySOS[]` | Array of nearby SOS requests with location data |
| `messages` | `SOSMessage[]` | Array of messages |
| `isLoading` | `boolean` | Loading state |
| `error` | `string \| null` | Error message |

### Methods

#### Fetch Methods

```typescript
// Fetch a single SOS request
await fetchSOSRequest('sos-123');

// Fetch all requests for a user
await fetchUserSOSRequests('user-456');

// Fetch active requests for a citizen
await fetchActiveCitizenSOS('citizen-789', 'MNL');

// Fetch nearby SOS requests (within 120 meters)
await fetchNearbySOSRequests(14.6349, 121.0388, 120);

// Fetch all messages for a conversation
await fetchMessages('sos-123', 0, 50);

// Fetch a specific message
const message = await fetchMessageById('msg-456');
```

#### Update Methods

```typescript
// Update SOS tag
const success = await updateTag('sos-123', 'Important');

// Close SOS request
const success = await closeSOS('sos-123');

// Send a message
const message = await sendMessage('sos-123', {
  senderType: 'SOS_ADMIN',
  senderId: 'admin-001',
  senderDisplayName: 'Support Team',
  contentType: 'text',
  content: 'Help is on the way!',
  cityId: 'MNL',
});
```

---

## Components

### SOSMessageThread
Interactive chat component for SOS conversations.

```typescript
import { SOSMessageThread } from '@/components/admin/sos/SOSMessageThread';

export function Page() {
  return <SOSMessageThread sosId="sos-123" />;
}
```

**Features:**
- Auto-scrolling message list
- Real-time message sending
- Color-coded sender types
- Timestamp display

### SOSMessageList
Table view of message history.

```typescript
import { SOSMessageList } from '@/components/admin/sos/SOSMessageThread';

export function Page() {
  return <SOSMessageList sosId="sos-123" />;
}
```

### SOSDetail
Complete SOS request detail view with messaging.

```typescript
import { SOSDetail } from '@/components/admin/sos/SOSDetail';

export function Page() {
  return (
    <SOSDetail 
      sosId="sos-123"
      onClose={() => console.log('Closed')}
    />
  );
}
```

**Features:**
- Display SOS request details
- Location information with Google Maps link
- Tag management
- Integrated messaging interface
- Close SOS request action

---

## Complete Example: SOS Admin Page

```typescript
'use client';

import { useState } from 'react';
import { useSOS } from '@/hooks/useSOS';
import { SOSDetail } from '@/components/admin/sos/SOSDetail';
import { Card } from '@/components/shared/Card';

export default function SOSPage() {
  const { sosRequests, fetchUserSOSRequests, isLoading } = useSOS();
  const [selectedSosId, setSelectedSosId] = useState<string | null>(null);

  const handleLoadRequests = () => {
    fetchUserSOSRequests('user-123');
  };

  if (selectedSosId) {
    return (
      <SOSDetail 
        sosId={selectedSosId}
        onClose={() => setSelectedSosId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">SOS Management</h1>
        <button 
          onClick={handleLoadRequests}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Load Requests
        </button>
      </div>

      {isLoading ? (
        <Card><p>Loading...</p></Card>
      ) : (
        <Card>
          {sosRequests.length === 0 ? (
            <p>No SOS requests found</p>
          ) : (
            <div className="space-y-2">
              {sosRequests.map(sos => (
                <button
                  key={sos.id}
                  onClick={() => setSelectedSosId(sos.id)}
                  className="w-full text-left p-4 border rounded hover:bg-gray-50"
                >
                  <div className="font-semibold">{sos.id}</div>
                  <div className="text-sm text-gray-600">{sos.status}</div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
```

---

## Error Handling

All service methods return consistent response objects:

```typescript
interface Response {
  success: boolean;
  data?: T;
  error?: string;
}
```

Always check the `success` flag before accessing data:

```typescript
const result = await getSOSRequestById('sos-123');
if (!result.success) {
  console.error('Error:', result.error);
  return;
}
// Safe to use result.data
```

---

## Types

### SOSRequest
```typescript
interface SOSRequest {
  id: string;
  userId: string;
  status: 'pending' | 'assigned' | 'resolved' | 'cancelled' | 'ACTIVE' | 'CLOSED';
  location: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  updatedAt: string;
  tag?: string;
}
```

### SOSMessage
```typescript
interface SOSMessage {
  id: string;
  sosId: string;
  senderType: 'citizen' | 'admin' | 'rescuer';
  senderId: string;
  senderDisplayName: string;
  contentType: 'text' | 'system';
  content: string;
  createdAt: string;
}
```

### SendMessagePayload
```typescript
interface SendMessagePayload {
  senderType: 'SOS_ADMIN' | 'CITIZEN' | 'RESCUER';
  senderId?: string;
  senderDisplayName: string;
  contentType: 'text' | 'system';
  content: string;
  cityId: string;
}
```

### NearbySOS
```typescript
interface NearbySOS {
  sosId: string;
  citizenId: string;
  status: 'active' | 'inactive' | 'resolved';
  createdAt: number;
  lastLocationUpdate: number;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    deviceId: string;
  };
  address: {
    barangay: string;
    city: string;
  };
  distance: number; // Distance from search center in kilometers
}
```

---

## Best Practices

1. **Always check success flag** before accessing data
2. **Handle errors gracefully** with user feedback
3. **Use the hook in components** rather than direct service calls
4. **Load data on component mount** with useEffect
5. **Debounce rapid requests** to avoid overwhelming the API
6. **Validate input** before sending to API

---

## Testing

```typescript
// Mock the service in your tests
jest.mock('@/lib/services/sosService', () => ({
  getSOSRequestById: jest.fn().mockResolvedValue({
    success: true,
    data: { id: 'sos-123', status: 'ACTIVE' }
  })
}));

// Test your component
render(<MyComponent />);
```
