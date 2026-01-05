# Component Library

## Shared Components

### DataTable

Display tabular data with sorting, filtering, and click handlers.

```typescript
import { DataTable } from '@/components/shared/DataTable';

<DataTable
  columns={[
    { key: 'id', header: 'ID', width: '100px' },
    { 
      key: 'status', 
      header: 'Status',
      render: (value) => <Badge>{value}</Badge>
    },
  ]}
  data={reports}
  isLoading={isLoading}
  onRowClick={(row) => router.push(`/admin/reports/${row.id}`)}
  emptyState={<p>No reports</p>}
/>
```

### Form

Build dynamic forms with validation.

```typescript
import { Form, FormField } from '@/components/shared/Form';

const fields: FormField[] = [
  {
    name: 'title',
    label: 'Report Title',
    type: 'text',
    required: true,
    validation: (value) => value.length < 5 ? 'Too short' : null,
  },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    options: [
      { value: 'road', label: 'Road Damage' },
      { value: 'water', label: 'Water Issue' },
    ],
  },
];

<Form
  fields={fields}
  onSubmit={(data) => createReport(data)}
  submitLabel="Create"
/>
```

### Alert

Display notifications.

```typescript
import { Alert } from '@/components/shared/Alert';

<Alert
  type="success"
  title="Success"
  message="Report created successfully"
  dismissible
/>
```

### Card

Container component.

```typescript
import { Card } from '@/components/shared/Card';

<Card title="Dashboard" footer={<button>Save</button>}>
  <p>Content here</p>
</Card>
```

### KPIGrid

Display key metrics.

```typescript
import { KPIGrid } from '@/components/shared/KPIGrid';

<KPIGrid
  items={[
    { label: 'Open Reports', value: 42, trend: 'up', trendValue: '5%' },
    { label: 'Resolved', value: 128, trend: 'down', trendValue: '2%' },
  ]}
/>
```

### Sidebar

Navigation menu.

```typescript
import { AdminSidebar } from '@/components/shared/Sidebar';

<AdminSidebar
  links={[
    { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { label: 'Reports', href: '/admin/reports', icon: '📋' },
  ]}
  canAccess={(scope) => userHasScope(scope)}
/>
```

## Custom Hooks

### useAuth

```typescript
const { user, token, isLoading, isAuthenticated, login, logout } = useAuth();
```

### useScopes

```typescript
const { canAccessAdmin, canManageCity, hasScope } = useScopes();
```

### useWebSocket

```typescript
const { isConnected, lastMessage, send, disconnect } = useWebSocket({
  url: 'ws://localhost:3002',
  onMessage: (data) => console.log(data),
  onError: (error) => console.error(error),
});
```

## Styling

Uses Tailwind CSS. All components are responsive by default.

### Custom Colors

Update `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      danger: '#EF4444',
    },
  },
}
```

## Accessibility

Components follow WCAG guidelines:
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Color contrast
