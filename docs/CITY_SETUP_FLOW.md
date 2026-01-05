# City Admin Setup Flow - Implementation Guide

## Overview

This document describes the complete **City Admin First-Time Setup Flow** for the e-Citizen platform. This flow ensures that when a City Admin logs in for the first time, they complete all required configuration before accessing the dashboard.

## Architecture

```
Login Page
    ↓
Setup Check (/admin/setup/check)
    ├→ City doesn't exist? → Create City (/admin/setup/create-city)
    └→ City exists → Setup Wizard
                         ↓
                    Step 1: City Profile
                         ↓
                    Step 2: Departments (min 1 required)
                         ↓
                    Step 3: SOS HQ (exactly 1 main required)
                         ↓
                    Step 4: Settings
                         ↓
                    Redirect to Dashboard
```

## File Structure

```
lib/
  api/
    setupEndpoints.ts      # All setup API calls
    client.ts              # HTTP client with patchData support

context/
  SetupContext.tsx         # Setup state management & hooks

components/admin/setup/
  SetupGuard.tsx          # Route protection component
  SetupWizard.tsx         # Main setup container
  SetupProgress.tsx       # Visual progress indicator
  StepContainer.tsx       # Reusable step wrapper
  steps/
    CityProfileStep.tsx   # Step 1: City information
    DepartmentsStep.tsx   # Step 2: Department management
    SOSHQStep.tsx        # Step 3: SOS headquarters
    SettingsStep.tsx      # Step 4: City configuration rules

app/admin/setup/
  page.tsx               # Main setup wizard route
  check/page.tsx         # Pre-setup city detection
  create-city/page.tsx   # City creation form

types/index.ts           # All setup-related TypeScript types
```

## Data Models

### SetupStatus
```typescript
{
  isInitialized: boolean
  currentStep: 'CITY_PROFILE' | 'DEPARTMENTS' | 'SOS_HQ' | 'SETTINGS' | 'COMPLETED'
  completedSteps: SetupStep[]
  initializedAt?: string
  initializedByUserId?: string
}
```

### CitySetupData
```typescript
{
  cityCode: string
  cityId: string
  name: string
  provinceCode: string
  centerLocation: { lat: number; lng: number }
  isActive?: boolean
}
```

### Department
```typescript
{
  _id?: string
  cityCode: string
  cityId: string
  code: string
  name: string
  handlesIncidentTypes: string[]  // e.g., ['fire', 'flood', 'medical']
  sosCapable: boolean
  isActive?: boolean
}
```

### SOSHQData
```typescript
{
  _id?: string
  scopeLevel: 'CITY' | 'PROVINCE' | 'REGION'
  cityCode: string
  cityId: string
  name: string
  location: { lat: number; lng: number }
  coverageRadiusKm: number
  supportedDepartmentCodes: string[]
  isMain: boolean
  isTemporary?: boolean
  isActive?: boolean
}
```

### CityConfig
```typescript
{
  incident: {
    allowAnonymous: boolean
    allowOutsideCityReports: boolean
    autoAssignDepartment: boolean
    requireCityVerificationForResolve: boolean
  }
  sos: {
    allowAnywhere: boolean
    autoAssignNearestHQ: boolean
    escalationMinutes: number
    allowProvinceFallback: boolean
  }
  visibility: {
    showIncidentsOnPublicMap: boolean
    showResolvedIncidents: boolean
  }
}
```

## API Endpoints Used

All endpoints require `Authorization: Bearer <JWT_TOKEN>` header.

### Cities
- `GET /api/admin/cities` - List cities
- `GET /api/admin/cities/:cityCode` - Get specific city
- `POST /api/admin/cities` - Create city
- `PUT /api/admin/cities/:cityCode` - Update city

### Departments
- `GET /api/admin/cities/:cityCode/departments` - Get city departments
- `POST /api/admin/cities/:cityCode/departments` - Create department
- `PUT /api/admin/cities/departments/:id` - Update department
- `DELETE /api/admin/cities/departments/:id` - Delete department

### SOS HQ
- `GET /api/admin/cities/:cityCode/sos-hq` - Get SOS HQs
- `POST /api/admin/cities/:cityCode/sos-hq` - Create SOS HQ
- `PUT /api/admin/cities/sos-hq/:id` - Update SOS HQ
- `DELETE /api/admin/cities/sos-hq/:id` - Delete SOS HQ
- `PATCH /api/admin/cities/sos-hq/:id/activate` - Activate SOS HQ
- `PATCH /api/admin/cities/sos-hq/:id/deactivate` - Deactivate SOS HQ

### City Configuration
- `GET /api/admin/cities/:cityCode/config` - Get city config
- `PUT /api/admin/cities/:cityCode/config` - Update config
- `PATCH /api/admin/cities/:cityCode/config/incident-rules` - Update incident rules
- `PATCH /api/admin/cities/:cityCode/config/sos-rules` - Update SOS rules
- `PATCH /api/admin/cities/:cityCode/config/visibility-rules` - Update visibility rules

### Setup Workflow
- `POST /api/admin/cities/:cityCode/setup/initialize` - Start setup
- `PATCH /api/admin/cities/:cityCode/setup/step` - Advance to next step
- `GET /api/admin/cities/:cityCode/setup/status` - Get setup status

## Usage

### Using the Setup Context

```typescript
import { useSetup } from '@/context/SetupContext';

export function MyComponent() {
  const {
    cityCode,
    setupStatus,
    cityData,
    departments,
    sosHQList,
    cityConfig,
    isLoading,
    error,
    advanceStep,
    isSetupComplete,
    refetchSetupData
  } = useSetup();

  // Check if setup is complete
  if (isSetupComplete()) {
    return <Dashboard />;
  }

  // Show current setup step
  return <SetupWizard />;
}
```

### SetupGuard Usage

The `SetupGuard` automatically blocks access to protected routes if setup is incomplete:

```typescript
// In admin/layout.tsx
import { SetupGuard } from '@/components/admin/setup/SetupGuard';
import { SetupProvider } from '@/context/SetupContext';

export default function AdminLayout({ children }) {
  return (
    <SetupProvider>
      <SetupGuard>{children}</SetupGuard>
    </SetupProvider>
  );
}
```

If a CITY_ADMIN tries to access the dashboard before completing setup:
1. SetupGuard detects incomplete setup
2. Redirects to the appropriate setup step
3. User can resume from where they left off

## Step Requirements

### Step 1: City Profile ✅
- **Requirements**: City name, province code, center location
- **Validation**: 
  - All fields required
  - Location coordinates must be valid
- **Actions**:
  - Saves city information
  - Advances to Step 2

### Step 2: Departments ⚠️
- **Requirements**: At least 1 department
- **Validation**:
  - Department code is unique
  - At least 1 incident type selected
  - "Continue" button disabled until ≥1 department
- **Actions**:
  - Create departments
  - Select SOS-capable departments
  - Delete departments
  - Advances to Step 3 only when ≥1 exists

### Step 3: SOS HQ 🚨
- **Requirements**: Exactly 1 main SOS HQ that is active
- **Validation**:
  - Must select at least 1 department
  - Location coordinates required
  - Coverage radius must be > 0
  - "Continue" button disabled until 1 active main HQ
- **Actions**:
  - Create SOS HQ
  - Automatically activate
  - Assign departments
  - Delete HQ
  - Advances to Step 4 only when 1 main active HQ exists

### Step 4: Settings ⚙️
- **Requirements**: All configuration saved
- **Validation**: Rules are optional (use defaults if not changed)
- **Actions**:
  - Configure incident rules
  - Configure SOS rules
  - Configure visibility rules
  - Complete setup (currentStep → 'COMPLETED')
  - Redirect to dashboard

## Interruption & Resumption

The system handles interruptions gracefully:

1. **User logs in** → Sent to `/admin/setup/check`
2. **Check page** → Loads setup status from API
3. **If incomplete** → Redirects to current step (e.g., `/admin/setup/departments`)
4. **SetupGuard** → Prevents access to protected routes
5. **User resumes** → Can continue from exact step they left

Example flow:
```
User starts setup
  → Completes Step 1 (City Profile)
  → Completes Step 2 (Departments)
  → Closes browser (Step 3: SOS HQ incomplete)
  → Logs back in
  → Automatically redirected to /admin/setup/sos-hq
  → Completes setup from there
```

## Error Handling

All setup operations include comprehensive error handling:

```typescript
try {
  await advanceStep('DEPARTMENTS');
} catch (err) {
  // Error is caught and displayed
  setError(err.message);
  // User stays on current step
}
```

Errors display in an Alert component and don't advance the setup.

## Security & Validation

1. **Role-based access**: Only CITY_ADMIN can access setup
2. **Token validation**: All API calls require valid JWT
3. **City ownership**: Users can only setup their assigned city
4. **State validation**: Setup steps enforce logical flow
5. **Confirmation dialogs**: Destructive actions (delete) require confirmation

## Styling

All components use Tailwind CSS with:
- Blue color scheme (primary: `bg-blue-600`)
- Green for success states
- Red for errors/destructive actions
- Responsive design for mobile/tablet
- Gradient backgrounds for visual hierarchy

## Testing

### Test Data

Create test city as CITY_ADMIN:
```
City Code: TEST_CITY
Name: Test City
Province: TEST_PROVINCE
Lat: 14.5
Lng: 120.5
```

Create departments:
- Code: DRRMO, Incident Types: flood, earthquake
- Code: BFP, Incident Types: fire, explosion
- Code: PNP, Incident Types: crime, robbery

Create SOS HQ:
- Name: Main SOS HQ
- Lat: 14.5, Lng: 120.5
- Coverage: 15km
- Departments: All

Configure Settings:
- Allow anonymous: Yes
- Auto assign: Yes
- Escalation time: 10 minutes

## Troubleshooting

### "Setup status not found"
- City may not exist in database
- Try creating city again
- Check network connection

### "Cannot advance to next step"
- Complete all required fields
- Ensure all validations pass
- Check browser console for errors

### "Stuck on same step"
- Refresh the page
- Clear localStorage and log back in
- Contact system administrator

### Setup redirects not working
- Ensure SetupProvider is wrapping the admin layout
- Check SetupGuard implementation in layout
- Verify JWT includes `cityCode` field

## API Response Format

All endpoints follow this response format:

```typescript
{
  success: boolean
  data?: T  // Response data
  error?: {
    code: string
    message: string
  }
}
```

Example:
```json
{
  "success": true,
  "data": {
    "cityCode": "CALUMPIT",
    "name": "Calumpit",
    "isActive": true
  }
}
```

Error:
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "City code already exists"
  }
}
```

## Next Steps After Setup

Once `setup.currentStep === 'COMPLETED'`:

1. ✅ All dashboard features available
2. ✅ User management enabled
3. ✅ Report viewing enabled
4. ✅ SOS analytics available
5. ✅ Public map configuration ready

The SetupGuard automatically allows access to all protected routes.

## Environment Variables

No additional environment variables required. Uses existing:
```
NEXT_PUBLIC_API_BASE=http://localhost:3001
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Notes

- All API calls are optimized with parallel loading where possible
- Setup state is cached in context to minimize re-fetches
- Cities are loaded on demand
- Components are lazy-loaded when stepping through setup

---

**Last Updated**: January 4, 2026  
**Version**: 1.0.0
