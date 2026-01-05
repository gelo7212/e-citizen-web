# API Integration Guide

## Base Configuration

All API calls go through the BFF (Backend for Frontend) at `http://localhost:3002`.

### Environment Variables

```
NEXT_PUBLIC_API_BASE=http://localhost:3002
NEXT_PUBLIC_WS_URL=ws://localhost:3002
```

## API Client

### Basic Usage

```typescript
import { fetchData, postData, updateData, deleteData } from '@/lib/api/client';

// GET
const response = await fetchData('/reports');

// POST
const response = await postData('/reports', { title: 'New Report' });

// PUT
const response = await updateData('/reports/123', { status: 'resolved' });

// DELETE
const response = await deleteData('/reports/123');
```

### Response Format

All endpoints return:

```typescript
{
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

## Endpoints

### Admin

**Dashboard**
```
GET /admin/dashboard/kpis
```

**Reports**
```
GET /admin/reports
GET /admin/reports/:id
POST /admin/reports
PUT /admin/reports/:id
DELETE /admin/reports/:id
```

**Announcements**
```
GET /admin/announcements
POST /admin/announcements
PUT /admin/announcements/:id
DELETE /admin/announcements/:id
```

**SOS**
```
GET /admin/sos/events
GET /admin/sos/events/:id
```

**Youth**
```
GET /admin/youth/students
POST /admin/youth/students
PUT /admin/youth/students/:id

GET /admin/youth/assistance
PUT /admin/youth/assistance/:id/approve
```

### Rescue

```
GET /rescue/assigned-sos
POST /rescue/sos/:id/status
```

### Citizen (Public)

```
GET /citizen/news
GET /citizen/news/:id

GET /citizen/announcements
GET /citizen/programs
POST /citizen/programs/:id/join
```

## Error Handling

```typescript
const response = await getReports();

if (response.success) {
  console.log(response.data);
} else {
  console.error(response.error?.message);
}
```

## Caching with React Query

For better performance, integrate react-query:

```typescript
import { useQuery } from 'react-query';

export function useReports() {
  return useQuery('reports', () => getReports());
}
```
