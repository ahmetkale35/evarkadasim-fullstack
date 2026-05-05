# EvArkadaşım — Frontend

React Native + Expo mobile app for the EvArkadaşım roommate matchmaking platform. Connects to the ASP.NET Core 6 backend API.

---

## Stack

| | |
|--|--|
| Framework | React Native 0.79 + Expo SDK 53 |
| Language | TypeScript 5.8 |
| Routing | Expo Router (file-based tabs) |
| HTTP | Axios + JWT interceptor |
| Storage | `@react-native-async-storage/async-storage` |
| Lint | ESLint via `eslint-config-expo` |

---

## Project Structure

```
├── app/
│   ├── _layout.tsx              # Root layout — auth check, 401 listener
│   ├── +not-found.tsx           # 404 screen
│   └── (tabs)/
│       ├── _layout.tsx          # Bottom tab bar config
│       ├── index.tsx            # Feed / swipe screen
│       ├── matches.tsx          # Matches list
│       ├── messages.tsx         # Messaging (list + chat)
│       ├── properties.tsx       # Property listings
│       └── profile.tsx          # User profile + tests
│
├── components/
│   ├── AuthScreen.tsx           # Login / register UI
│   ├── LoadingScreen.tsx        # Animated splash
│   ├── ProfileCard.tsx          # Swipeable user card
│   ├── SwipeableCard.tsx        # Gesture handler wrapper
│   ├── CharacterTest.tsx        # 12-question basic test
│   ├── CharacterTestPopup.tsx   # First-launch test prompt
│   ├── DetailedCharacterTest.tsx# Extended 30-question test
│   ├── ChatMessage.tsx          # Message bubble
│   ├── MatchCard.tsx            # Match list item
│   └── PropertyCard.tsx         # Property list item
│
├── hooks/
│   ├── useUsers.ts              # Feed data (GET /api/users)
│   ├── useMatches.ts            # Matches (GET /api/matches)
│   ├── useMessages.ts           # Messages (GET/POST /api/messages)
│   ├── useProperties.ts         # Properties (GET /api/properties)
│   ├── useProfile.ts            # Current user profile
│   ├── useCharacterTest.ts      # Global test state + submission
│   └── useFrameworkReady.ts     # Expo framework init
│
├── services/                    # API layer
│   ├── apiClient.ts             # Axios instance — base URL, JWT header, 401 handler
│   ├── authService.ts           # login / register / logout / isLoggedIn
│   ├── authEvents.ts            # Global 401 event bus
│   ├── userService.ts           # Feed fetch + swipe
│   ├── matchService.ts          # Match list
│   ├── messageService.ts        # Message CRUD
│   ├── profileService.ts        # Get + update profile
│   ├── propertyService.ts       # Property CRUD
│   ├── testService.ts           # Submit basic/detailed test
│   ├── storage.ts               # AsyncStorage token helpers
│   └── config.ts                # API base URL config
│
└── types/
    └── index.ts                 # All TypeScript interfaces
```

---

## Setup

```bash
npm install
```

Edit `services/config.ts`:

```ts
const DEV_HOST = '192.168.1.x'; // your machine's local IP
// Android emulator: use '10.0.2.2'
```

```bash
npx expo start
```

Scan QR with Expo Go, or press `a` for Android emulator / `i` for iOS simulator.

---

## Commands

```bash
npm run lint        # expo lint (ESLint)
npx tsc --noEmit    # TypeScript type check
npx expo start      # Start Metro bundler
```

---

## Authentication Flow

```
App launch
  → LoadingScreen (animated splash)
  → authService.isLoggedIn() checks stored JWT
  → Authenticated  → TabNavigation
  → Unauthenticated → AuthScreen (login / register)

Any 401 response
  → authEvents fires 'unauthorized'
  → _layout.tsx listener → setIsAuthenticated(false) → AuthScreen
```

---

## API Integration

All screens use real backend data. No mock data.

| Screen | Hook | API call |
|--------|------|---------|
| Feed / Swipe | `useUsers` | `GET /api/users`, `POST /api/swipe` |
| Matches | `useMatches` | `GET /api/matches` |
| Messages | `useMessages` | `GET/POST /api/messages/{matchId}` |
| Properties | `useProperties` | `GET /api/properties` |
| Profile | `useProfile` | `GET/PUT /api/profile` |
| Character test | `useCharacterTest` | `POST /api/test/Basic` |

---

## Compatibility Score

Backend calculates and returns `compatibility` (0–100) for each user in the feed.

| Score | Color | Label |
|-------|-------|-------|
| 90–100 | `#10B981` green | Mükemmel |
| 75–89 | `#F59E0B` amber | Çok Uyumlu |
| 60–74 | `#EC4899` pink | Uyumlu |
| 0–59 | `#EF4444` red | Orta |

---

## Personality Test

**Basic test** — 12 questions across 6 dimensions, submitted to `POST /api/test/Basic`:

| Dimension | Questions |
|-----------|-----------|
| Social Energy | IS1, IS2 (reverse) |
| Order Approach | IS3, IS4 (reverse) |
| Conflict Management | IS5, IS6 (reverse) |
| Sharing Style | IS7, IS8 (reverse) |
| Life Rhythm | IS9, IS10 (reverse) |
| Communication Style | IS11, IS12 (reverse) |

Reverse-scored questions: `finalScore = 6 - selectedOption`

Personality type string (e.g. `ESDHCX`) derived from 3 binary dimensions.
