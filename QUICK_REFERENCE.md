# Quick Reference

## Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm start                # Run production server
npm run lint             # Check code style
npm run type-check       # TypeScript validation
npm run format           # Format code with Prettier

# Docker
docker-compose -f docker-compose.dev.yml up      # Dev with Nginx
docker-compose -f docker-compose.prod.yml up -d  # Production
docker-compose logs -f app                       # Watch logs
```

## Key Imports

```typescript
// Auth
import { useAuth } from '@/hooks/useAuth';
import { useScopes } from '@/hooks/useScopes';
import { setAuth, clearAuth } from '@/lib/auth/store';
import { hasScope } from '@/lib/auth/scopes';

// API
import { fetchData, postData, updateData, deleteData } from '@/lib/api/client';
import { getReports, createReport, updateReport } from '@/lib/api/endpoints';

// Components
import { DataTable } from '@/components/shared/DataTable';
import { Form } from '@/components/shared/Form';
import { Card } from '@/components/shared/Card';
import { Alert } from '@/components/shared/Alert';

// Types
import type { AuthUser, JWTClaims, Report, SosEvent } from '@/types';

// Utils
import { formatDate, truncate, capitalize } from '@/utils/helpers';
import { REPORT_STATUS, PRIORITY_LEVELS } from '@/utils/constants';
```

## Common Patterns

### Protected Page

```typescript
'use client';

import { useRequireAuth } from '@/hooks/useAuth';
import { useScopes } from '@/hooks/useScopes';

export default function AdminPage() {
  const auth = useRequireAuth(); // Redirect if not auth
  const { canAccessAdmin } = useScopes(); // Check permission

  if (!canAccessAdmin) return <div>Access denied</div>;

  return <div>Admin content</div>;
}
```

### Fetch Data with Loading

```typescript
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const load = async () => {
    setIsLoading(true);
    const res = await getReports();
    if (res.success) setData(res.data);
    setIsLoading(false);
  };
  load();
}, []);
```

### Form Submission

```typescript
const [isLoading, setIsLoading] = useState(false);

async function handleSubmit(formData) {
  setIsLoading(true);
  const res = await createReport(formData);
  setIsLoading(false);
  
  if (res.success) {
    showAlert('Created!', 'success');
    // Refresh data or navigate
  } else {
    showAlert(res.error?.message, 'error');
  }
}
```

### Show Conditional UI Based on Scope

```typescript
const { canManageCity, canManageYouth } = useScopes();

return (
  <>
    {canManageCity && <CitySection />}
    {canManageYouth && <YouthSection />}
  </>
);
```

## Routes Overview

```
/                           → /citizen/home (redirect)

/admin/dashboard            → Dashboard with KPIs
/admin/city/reports         → City reports table
/admin/city/announcements   → Announcement CMS
/admin/sos/monitor          → SOS live monitoring
/admin/youth/students       → Student registry
/admin/youth/assistance     → Assistance applications

/rescue/active              → Assigned SOS list
/rescue/map                 → Live map
/rescue/history             → Historical records

/citizen/home               → Public home
/citizen/news               → News feed
/citizen/announcements      → Public announcements
/citizen/services           → City services
/citizen/programs           → Programs & events
```

## Environment Variables

```bash
# Required
NEXT_PUBLIC_API_BASE        # API endpoint (e.g., http://localhost:3002)
NEXT_PUBLIC_WS_URL          # WebSocket URL (e.g., ws://localhost:3002)

# Optional
NEXT_PUBLIC_APP_ENV         # development | staging | production
JWT_SECRET                  # For server-side JWT signing
NEXT_PUBLIC_ENABLE_FREEDOM_WALL    # true | false
NEXT_PUBLIC_ENABLE_YOUTH_MODULE    # true | false
```

## Status Codes

### Report Status
- `open` - New report
- `in-progress` - Being worked on
- `resolved` - Issue fixed
- `archived` - Closed

### SOS Status
- `pending` - Waiting for assignment
- `assigned` - Assigned to rescuer
- `en-route` - Rescuer on the way
- `arrived` - Rescuer at location
- `assisting` - Active assistance
- `done` - Completed

### Priority
- `low` - Non-urgent
- `medium` - Standard
- `high` - Urgent
- `critical` - Emergency

## Component Props

### DataTable

```typescript
<DataTable
  columns={[
    { key: 'id', header: 'ID', width: '100px' },
    { key: 'name', header: 'Name', render: (v) => <strong>{v}</strong> }
  ]}
  data={items}
  isLoading={false}
  onRowClick={(row) => handleClick(row)}
  emptyState={<p>No data</p>}
/>
```

### Form

```typescript
<Form
  fields={[
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'category', label: 'Category', type: 'select', options: [...] }
  ]}
  onSubmit={(data) => handleSubmit(data)}
  isLoading={false}
  submitLabel="Create"
/>
```

### Alert

```typescript
<Alert
  type="success" // success | error | warning | info
  title="Done"
  message="Operation successful"
  dismissible={true}
  onClose={() => {}}
/>
```

## File Locations

| What | Where |
|------|-------|
| New page | `app/[module]/path/page.tsx` |
| New component | `components/[module]/ComponentName.tsx` |
| New hook | `hooks/useName.ts` |
| New API endpoint | `lib/api/endpoints.ts` |
| Type definitions | `types/index.ts` |
| Helper functions | `utils/helpers.ts` |
| Constants | `utils/constants.ts` |

## Performance Tips

1. Use `<Image>` from `next/image` for images
2. Lazy-load heavy components: `dynamic(() => import(...))`
3. Cache API responses in `useQuery` (react-query)
4. Memoize expensive renders: `React.memo(Component)`
5. Use `useCallback` for function props

## Debugging

```typescript
// Check if user is logged in
console.log(localStorage.getItem('auth_user'));
console.log(localStorage.getItem('auth_token'));

// Check API calls
// Open Browser DevTools → Network → Filter XHR

// Check state
import { getAuthUser } from '@/lib/auth/store';
console.log(getAuthUser());

// Type errors
npm run type-check
```

## Useful Links

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [JWT.io](https://jwt.io)

---

**Need help?** Check `/docs` folder for detailed guides.
