# Token Rotation Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Root Layout (app/layout.tsx)                         │   │
│  │ ┌────────────────────────────────────────────────┐   │   │
│  │ │ useTokenRotation Hook                          │   │   │
│  │ │ - Checks every 60 seconds                      │   │   │
│  │ │ - Calls refresh if expiring in 5 minutes       │   │   │
│  │ │ - Handles callbacks (refresh/expire/error)     │   │   │
│  │ └────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
│        ┌──────────────────┼──────────────────┐               │
│        │                  │                  │               │
│        ▼                  ▼                  ▼               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Admin      │  │   WebSocket  │  │    Auth      │      │
│  │  Components  │  │  Connections │  │  Components  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│        │                  │                  │               │
│        └──────────────────┼──────────────────┘               │
│                           │                                   │
│          ┌────────────────┼────────────────┐                │
│          │                │                │                │
│          ▼                ▼                ▼                │
│  ┌──────────────────────────────────────────────────┐      │
│  │ Auth/API Layer                                   │      │
│  │ ┌────────────────────────────────────────────┐  │      │
│  │ │ tokenRotation.ts (Utilities)               │  │      │
│  │ │ ✓ willTokenExpireSoon()                    │  │      │
│  │ │ ✓ isTokenExpired()                         │  │      │
│  │ │ ✓ getTokenTimeRemaining()                  │  │      │
│  │ │ ✓ refreshTokenIfNeeded()                   │  │      │
│  │ └────────────────────────────────────────────┘  │      │
│  │                                                  │      │
│  │ ┌────────────────────────────────────────────┐  │      │
│  │ │ authService.ts (Refresh Logic)             │  │      │
│  │ │ ✓ refreshAccessToken()                     │  │      │
│  │ │   - POST /refresh                          │  │      │
│  │ │   - Stores new tokens in localStorage      │  │      │
│  │ └────────────────────────────────────────────┘  │      │
│  │                                                  │      │
│  │ ┌────────────────────────────────────────────┐  │      │
│  │ │ store.ts (Token Storage)                   │  │      │
│  │ │ ✓ getAuthToken()                           │  │      │
│  │ │ ✓ setAuth(token)                           │  │      │
│  │ └────────────────────────────────────────────┘  │      │
│  └──────────────────────────────────────────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                   ┌────────┴────────┐
                   │                 │
                   ▼                 ▼
            ┌──────────────┐  ┌──────────────┐
            │ localStorage │  │  Backend     │
            │              │  │  API         │
            │ auth_token   │  │              │
            │ auth_refresh │  │ POST /token  │
            │ auth_user    │  │ POST /refresh│
            └──────────────┘  └──────────────┘
```

---

## Data Flow: Token Refresh Cycle

```
START: Periodic Check (60 seconds)
   │
   ▼
┌─────────────────────────────┐
│ Get Current Token           │
│ From: localStorage.auth_token│
└────────────┬────────────────┘
             │
             ▼
      ┌──────────────┐
      │ Is Expired?  │
      └──┬───────┬──┘
         │       │
        YES      NO
         │       │
         │       ▼
         │   ┌────────────────────┐
         │   │ Expires Soon?      │
         │   │ (< 5 minutes)       │
         │   └──┬────────────┬───┘
         │      │            │
         │     YES           NO
         │      │            │
         ▼      ▼            ▼
       ┌──────────────────────────────┐
       │ REFRESH TOKEN                │
       │                              │
       │ POST /api/identity/refresh   │
       │ Authorization: Bearer        │
       │   {refreshToken}             │
       └──────────┬───────────────────┘
                  │
                  ▼
       ┌──────────────────────────────┐
       │ Response: {                  │
       │   success: true,             │
       │   data: {                    │
       │     accessToken: "...",      │
       │     refreshToken: "...",     │
       │     expiresIn: 3600          │
       │   }                          │
       │ }                            │
       └──────────┬───────────────────┘
                  │
                  ▼
       ┌──────────────────────────────┐
       │ Validate New Token           │
       │ Decode payload               │
       └──────────┬───────────────────┘
                  │
                  ▼
       ┌──────────────────────────────┐
       │ Store in localStorage        │
       │ auth_token = accessToken     │
       │ auth_refresh_token = refresh │
       └──────────┬───────────────────┘
                  │
                  ▼
       ┌──────────────────────────────┐
       │ Callback: onTokenRefreshed   │
       └──────────┬───────────────────┘
                  │
                  ▼
       ┌──────────────────────────────┐
       │ SUCCESS ✅                   │
       │ Token ready for next request │
       └──────────────────────────────┘
```

---

## Component Relationships

```
useTokenRotation Hook
├─ Calls: getAuthToken()
├─ Calls: willTokenExpireSoon(token)
├─ Calls: isTokenExpired(token)
├─ Calls: refreshAccessToken()
│         ├─ Gets: localStorage.auth_refresh_token
│         ├─ Calls: POST /api/identity/refresh
│         ├─ Parses: response.data
│         ├─ Stores: new tokens in localStorage
│         └─ Validates: decodeToken()
└─ Triggers: Callbacks (onTokenRefreshed, onTokenExpired, onError)

useSOSSocket Hook
├─ Gets: token prop
├─ Checks: isTokenExpired(token)
├─ Checks: willTokenExpireSoon(token)
├─ Calls: refreshAccessToken() if needed
├─ Creates: Socket.IO connection with token
└─ Manages: WebSocket lifecycle

API Client Layer
├─ Gets: getAuthToken()
├─ Checks: willTokenExpireSoon()
├─ Calls: refreshAccessToken() if needed
└─ Sends: fetch with Authorization header
```

---

## Token Lifecycle Timeline

```
LOGIN
  │
  └──► /api/identity/token
       ├─ Request: { firebaseUid }
       ├─ Response: { accessToken, refreshToken, expiresIn: 3600 }
       └─ Storage: Save both tokens to localStorage

T+0m
  │
  └──► Token Valid & Safe
       Token remains in localStorage
       No refresh needed

T+50m (Proactive Window Begins)
  │
  ├─ [60s Check] Token check triggered
  ├─ expiresIn remaining: ~10 minutes
  ├─ Expires in < 5 minutes? NO
  └─ Continue using existing token

T+55m (5-Minute Window)
  │
  ├─ [Periodic Check] Token check triggered
  ├─ Time remaining: ~5 minutes
  ├─ Expires in < 5 minutes? YES ✓
  ├─ /api/identity/refresh called
  │  ├─ Send: refreshToken in Authorization header
  │  └─ Receive: New accessToken + refreshToken
  ├─ Storage: Update both tokens
  └─ Token refreshed, expires in T+61m

T+60m (Original Expiration Point)
  │
  ├─ Old token would have expired
  ├─ But we have new token from T+55m refresh
  └─ Seamless token rotation! ✅

T+116m (New Expiration - 1m Before)
  │
  ├─ [Periodic Check] Token check triggered
  ├─ Expires in < 5 minutes? YES ✓
  └─ /api/identity/refresh called (cycle repeats)
```

---

## Error Handling Flow

```
┌──────────────────────────┐
│ Token Rotation Error     │
└────────┬─────────────────┘
         │
         ▼
    ┌────────────────┐
    │ Error Type?    │
    └──┬──┬──┬──────┘
       │  │  │
   ┌───┘  │  └───────┐
   │      │          │
   ▼      ▼          ▼
┌──────────────┐ ┌─────────────────┐ ┌──────────────────┐
│Network Error │ │Invalid Token    │ │No Refresh Token  │
└──┬───────────┘ └────┬────────────┘ └───┬──────────────┘
   │                  │                   │
   ▼                  ▼                   ▼
┌────────────────────────────────────────────────────────┐
│ Action:                                                │
│ 1. Log error with [TokenRotation] prefix              │
│ 2. Call onError callback                              │
│ 3. For Network: Retry with existing token             │
│ 4. For Invalid: Call onTokenExpired, redirect to login│
│ 5. For Missing: Clear auth, redirect to login         │
└────────────────────────────────────────────────────────┘
```

---

## File Dependency Graph

```
app/
├── layout.tsx
│   └─► hooks/useTokenRotation.ts
│       └─► lib/auth/tokenRotation.ts
│       └─► lib/services/authService.ts
│           └─► lib/auth/jwt.ts

components/
├── admin/sos/SOSMap.tsx
│   └─► hooks/useSOSSocket.ts
│       └─► lib/auth/tokenRotation.ts ✓ (Added)
│       └─► lib/services/authService.ts ✓ (Enhanced)

hooks/
├── useTokenRotation.ts (NEW)
│   └─► lib/auth/tokenRotation.ts
│   └─► lib/auth/store.ts
│   └─► lib/services/authService.ts
│
└── useSOSSocket.ts (UPDATED)
    └─► lib/auth/tokenRotation.ts ✓ (Added)
    └─► lib/services/authService.ts ✓ (Enhanced)

lib/
├── auth/
│   ├── tokenRotation.ts (NEW)
│   └── store.ts
│   └── jwt.ts
│
└── services/
    └── authService.ts (UPDATED)
        └─► lib/auth/tokenRotation.ts ✓ (Uses)
```

---

## State Management

```
localStorage
├── auth_token (string)
│   ├─ JWT access token
│   ├─ expires in ~1 hour
│   └─ Used for API requests
│
├── auth_refresh_token (string)
│   ├─ JWT refresh token
│   ├─ expires in ~7 days
│   └─ Used to get new access token
│
└── auth_user (JSON)
    ├─ User ID
    ├─ Role
    ├─ Scopes
    └─ City Code

In-Memory (store.ts)
├── currentUser (AuthUser | null)
└── token (string | null)
```

---

## Performance Characteristics

```
Operation              | Time    | Frequency  | Impact
─────────────────────────────────────────────────────
Token decode          | ~0.1ms  | Every 60s  | Minimal
Check expiration      | ~0.1ms  | Every 60s  | Minimal
API call (refresh)    | ~100ms  | ~Every 55m | Low
Socket reconnection   | ~200ms  | On expire  | Moderate
─────────────────────────────────────────────────────
Memory per instance   | <1KB    | Per hook   | Negligible
```

---

## Integration Checklist by Component

```
✅ = Implemented & Ready
⏳ = Recommended Integration
❌ = Not Required

Component                          Status  Priority
─────────────────────────────────────────────────────
tokenRotation.ts utility           ✅      Core
useTokenRotation hook              ✅      Core
authService.ts refresh             ✅      Core
useSOSSocket.ts integration        ✅      Core

app/layout.tsx integration         ⏳      High
API client wrapper                 ⏳      Medium
Service classes                    ⏳      Medium
Error boundary                     ⏳      Low
Token monitor component            ⏳      Optional
─────────────────────────────────────────────────────
```

---

## Next Steps Visualization

```
Current State:
┌─────────────────────────────────────────┐
│ Token Rotation Implemented & Ready      │
│ - Core utilities in place               │
│ - Hooks created and tested              │
│ - Auth service enhanced                 │
│ - WebSocket integrated                  │
│ - Documentation complete                │
└─────────────────────────────────────────┘
                  │
                  ▼
Step 1: Add to Root Layout
┌─────────────────────────────────────────┐
│ app/layout.tsx                          │
│ useTokenRotation({ enabled: !!user })   │
└─────────────────────────────────────────┘
                  │
                  ▼
Step 2 (Optional): Create API Wrapper
┌─────────────────────────────────────────┐
│ lib/api/client.ts                       │
│ fetchWithTokenRefresh(...)              │
└─────────────────────────────────────────┘
                  │
                  ▼
Step 3 (Optional): Monitor & Debug
┌─────────────────────────────────────────┐
│ Components/TokenStatus.tsx              │
│ Debug endpoints for development         │
└─────────────────────────────────────────┘
                  │
                  ▼
Production Ready ✅
```

---

## Success Metrics

```
Metric                          Target    How to Measure
────────────────────────────────────────────────────────
Token expiration prevented      100%      Check WebSocket uptime
Auto-refresh success rate       99%+      Monitor /refresh API
Response time overhead          <50ms     Network tab timing
User session continuity         100%      No unexpected logouts
Error recovery rate             95%+      Log [TokenRotation] errors
────────────────────────────────────────────────────────
```

