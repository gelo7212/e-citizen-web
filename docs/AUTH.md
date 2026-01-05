# Auth & Security Guide

## Overview

e-Citizen uses JWT tokens with role-based scopes for authorization.

### JWT Structure

```typescript
{
  sub: "user-id",
  role: "city_admin | sos_admin | sk_admin | app_admin | rescuer | citizen",
  scopes: ["admin:read", "city:write", ...],
  cityCode: "city-code",
  contextType: "admin | rescue | citizen",
  iat: 1234567890,
  exp: 1234654290
}
```

## Scopes

### Admin Scopes
- `admin:read` - View admin dashboard
- `admin:write` - Modify admin settings
- `city:read` - View city data
- `city:write` - Create/edit reports, announcements
- `sos:read` - View SOS events
- `sos:admin` - Manage SOS operations
- `youth:read` - View youth data
- `youth:write` - Manage youth programs
- `audit:read` - View audit logs

### Rescue Scopes
- `rescue:read` - View assigned SOS
- `rescue:write` - Update status
- `sos:read` - View SOS details

### Citizen Scopes
- `citizen:read` - View public content
- `news:read` - View news

## Using Auth

### In Components

```typescript
import { useAuth } from '@/hooks/useAuth';
import { useScopes } from '@/hooks/useScopes';

export function AdminPanel() {
  const { user, token, logout } = useAuth();
  const { canAccessAdmin, canManageCity } = useScopes();

  if (!canAccessAdmin) return <div>Access denied</div>;

  return (
    <div>
      <p>Welcome {user?.id}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protecting Routes

```typescript
export function ProtectedRoute({ children }) {
  const auth = useRequireAuth(); // Redirects if not authenticated

  return children;
}
```

## API Integration

### Automatic Token Injection

All API calls automatically include the JWT token in the `Authorization` header.

```typescript
import { getReports } from '@/lib/api/endpoints';

// Token is automatically added
const response = await getReports({ cityId: 'some-city' });
```

### Token Refresh

When a token expires (401), the user is redirected to the login page.

For persistent login, implement refresh tokens in your BFF:

```typescript
// In lib/api/client.ts interceptor
if (error.response?.status === 401) {
  const refreshed = await refreshToken();
  if (refreshed) {
    return apiClient.request(originalRequest);
  }
}
```

## Setting Auth

After login API call:

```typescript
import { setAuth } from '@/lib/auth/store';

const response = await loginAPI(credentials);
if (response.success) {
  setAuth(response.user, response.token);
  router.push('/admin/dashboard');
}
```
