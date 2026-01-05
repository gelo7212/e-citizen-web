# Development Guide

## Project Structure

- **app/** - Next.js App Router pages and layouts
- **components/** - React components organized by module
- **lib/** - Core libraries (auth, API, etc.)
- **hooks/** - Custom React hooks
- **types/** - TypeScript type definitions
- **utils/** - Utility functions and constants
- **styles/** - Global and component styles
- **docs/** - Documentation

## Development Workflow

### 1. Create New Page

```typescript
// app/admin/reports/page.tsx
'use client';

import { useRequireAuth } from '@/hooks/useAuth';
import { useScopes } from '@/hooks/useScopes';
import { getReports } from '@/lib/api/endpoints';

export default function ReportsPage() {
  const auth = useRequireAuth(); // Protect with auth
  const scopes = useScopes();

  // Page content
}
```

### 2. Add API Endpoint

```typescript
// lib/api/endpoints.ts
export async function getCustomData(filters?: any) {
  return fetchData<CustomType>(`/endpoint${filters ? '?' + new URLSearchParams(filters) : ''}`);
}
```

### 3. Create Component

```typescript
// components/shared/CustomComponent.tsx
'use client';

import React from 'react';

export function CustomComponent({ prop }: Props) {
  return <div>{prop}</div>;
}
```

### 4. Add Hook

```typescript
// hooks/useCustom.ts
'use client';

import { useState, useEffect } from 'react';

export function useCustom() {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Hook logic
  }, []);

  return state;
}
```

## Code Standards

### Naming Conventions

- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`getUserProfile`)
- **Constants**: UPPER_SNAKE_CASE (`USER_ROLES`)

### TypeScript Usage

Always type props and return values:

```typescript
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // ...
}
```

### Async/Await

Always use async/await instead of .then():

```typescript
// Good
const data = await fetchData();

// Avoid
fetchData().then(data => {});
```

## Testing

Run tests:

```bash
npm run test
npm run test:watch
```

Example test:

```typescript
// components/__tests__/Card.test.tsx
import { render, screen } from '@testing-library/react';
import { Card } from '@/components/shared/Card';

describe('Card', () => {
  it('renders title', () => {
    render(<Card title="Test">Content</Card>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## Debugging

### Browser DevTools

- React DevTools - Inspect component state
- Redux DevTools - Debug auth store
- Network tab - Check API calls

### Console Logging

```typescript
import { logDebug } from '@/utils/helpers';

logDebug('UserData', userData); // Only logs in development
```

## Performance Tips

1. **Code Splitting** - Next.js automatically splits pages
2. **Image Optimization** - Use `next/image`
3. **Dynamic Imports** - For large components
4. **Memoization** - Use `React.memo` for expensive renders
5. **Caching** - Leverage API response caching

## Common Issues

### Module not found

Check path aliases in `tsconfig.json`. Use `@/` prefix.

### Auth errors

Ensure token is in localStorage. Check browser DevTools > Application > LocalStorage.

### API errors

Check NEXT_PUBLIC_API_BASE in .env.local. Use Network tab to see requests.

### Build errors

Run `npm run type-check` to find TypeScript errors before building.
