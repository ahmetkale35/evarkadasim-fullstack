# EvArkadaşım — Roommate Matchmaking Platform

<p align="center">
  <img src="https://img.shields.io/badge/.NET-6.0-512BD4?style=flat&logo=dotnet" alt=".NET 6" />
  <img src="https://img.shields.io/badge/React_Native-Expo_SDK_53-61DAFB?style=flat&logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/Architecture-Clean_Architecture-brightgreen" alt="Clean Architecture" />
  <img src="https://img.shields.io/badge/Database-SQLite_&_EF_Core-003B57?style=flat&logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/Cache-Redis-DC382D?style=flat&logo=redis" alt="Redis" />
  <img src="https://img.shields.io/badge/Realtime-SignalR-512BD4?style=flat" alt="SignalR" />
  <img src="https://github.com/ahmetkale35/evarkadasim-fullstack/actions/workflows/ci-backend.yml/badge.svg" alt="CI Backend" />
  <img src="https://github.com/ahmetkale35/evarkadasim-fullstack/actions/workflows/ci-frontend.yml/badge.svg" alt="CI Frontend" />
</p>

EvArkadaşım is a personality-driven roommate matchmaking platform. It uses a **6-dimensional compatibility algorithm** to suggest the best possible matches based on personality tests and lifestyle habits — not just property listings. The platform connects **property owners** looking for roommates with **room seekers**, filtering by city and role for relevant matches.

---

## Features

- **Smart Matching** — Manhattan Distance compatibility score (0–100%) across 6 personality dimensions; `null` returned for users who haven't completed their personality test
- **Role-Based Feed** — Property owners see only room seekers; room seekers see all candidates in their city
- **Swipe Mechanics** — Like / Pass / SuperLike with automatic mutual match detection
- **Intelligent Feed** — Three-tier sorting: Like boosts → compatibility score → last active. Results cached in Redis (5-min TTL); invalidated on swipe
- **City Filtering** — Feed automatically filtered by user's city; property map pins filterable by city
- **Real-time Messaging** — SignalR WebSocket hub; match notifications and new messages pushed instantly
- **Property Listings** — Full CRUD with map view (lat/lng coordinates), city/price/type/pets filters, owner's own listing endpoint
- **JWT Authentication** — ASP.NET Identity + JWT Bearer + Refresh Token rotation; token revocation middleware
- **Secure** — IP-based rate limiting, HTML encoding on message content, IDOR protection, global exception handler
- **Interactive Map** — Property map pins with coordinates, auto-zoom to user's city
- **Structured Logging** — Serilog with console + rolling file sinks; request logging middleware
- **49 Unit Tests** — xUnit + Moq; covers swipe, feed, messaging, compatibility, profile, character test

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | ASP.NET Core 6 Web API |
| Architecture | Clean Architecture (Domain / Application / Infrastructure / API) |
| Database | SQLite + Entity Framework Core 6 |
| Cache | Redis via `StackExchange.Redis` |
| Real-time | ASP.NET Core SignalR |
| Auth | ASP.NET Identity + JWT Bearer + Refresh Token |
| Security | Rate Limiting (`AspNetCoreRateLimit`) |
| Logging | Serilog (console + file sinks) |
| Testing | xUnit + Moq (49 tests) |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.79 + Expo SDK 53 |
| Routing | Expo Router (file-based) |
| HTTP | Axios with JWT interceptor + auto-refresh |
| Maps | `react-native-maps` with city-filtered property pins |
| Storage | `@react-native-async-storage/async-storage` |
| Language | TypeScript 5.8 |

### Infrastructure
| Tool | Purpose |
|------|---------|
| Docker | Multi-stage build; `docker-compose` spins up API + Redis |
| GitHub Actions | CI for backend (build + test + coverage) and frontend (tsc + lint) |
| Dependabot | Weekly NuGet + npm security updates |

---

## Project Structure

```
├── backend/
│   ├── EvArkadasimV2.Domain/          # Entities, Enums, Value Objects
│   ├── EvArkadasimV2.Application/     # Business logic, DTOs, Interfaces, Services
│   ├── EvArkadasimV2.Infrastructure/  # EF Core, Repositories, Redis, Migrations
│   ├── EvArkadasimV2.API/             # Controllers, Hubs, Middleware, DI config
│   ├── EvArkadasimV2.Tests/           # 49 xUnit unit tests (no DB required)
│   ├── Dockerfile                     # Multi-stage build (SDK → aspnet:6.0 runtime)
│   └── postman/                       # Postman collection + environment
├── frontend/
│   └── evarkadasim-yeni-main/         # Expo React Native app
├── .github/
│   ├── workflows/                     # ci-backend, ci-frontend, pr-check, docker, auto-label
│   └── dependabot.yml                 # Automated dependency updates
├── docker-compose.yml                 # API + Redis services
└── .env.example                       # Required environment variables
```

---

## Getting Started

### Option A — Docker (recommended)

```bash
cp .env.example .env
# Edit .env: set JWT_SECRET to a 32+ character secret
docker-compose up --build
```

API available at `http://localhost:5000`. Swagger UI at `http://localhost:5000/swagger`.

### Option B — Local

**Prerequisites:** .NET 6 SDK, Node.js 22+, Redis (optional — app starts without it)

```bash
# Backend
cd backend/EvArkadasimV2.API
dotnet restore
dotnet run
```

Database is created and seeded automatically on first run:
50 users (across 9 cities), 10 property listings (with coordinates), 3 pre-built matches, 18 messages.

```bash
# Frontend
cd frontend/evarkadasim-yeni-main
npm install
```

Edit `services/config.ts` — set `DEV_HOST` to your machine's local IP, then:

```bash
npx expo start
```

### Run Tests

```bash
cd backend
dotnet test EvArkadasimV2.slnx -c Release
# Passed! 49/49
```

---

## API Overview

| Group | Endpoints |
|-------|-----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout` |
| Feed | `GET /api/users` (paginated, city-filtered, role-filtered, Redis-cached) |
| User Detail | `GET /api/users/{id}` (single user profile with compatibility score) |
| Swipe | `POST /api/swipe` (Like / Pass / SuperLike) |
| Matches | `GET /api/swipe/matches` |
| Messages | `GET /api/messages/{matchId}`, `POST /api/messages`, `PUT /api/messages/{matchId}/read` |
| Properties | `GET /POST /PUT /DELETE /api/property`, `GET /api/property/map`, `GET /api/property/mine`, `DELETE /api/property/mine` |
| Profile | `GET /PUT /api/profile` |
| Test | `POST /api/test/Basic`, `POST /api/test/Detailed` |
| Health | `GET /health` |

Full collection: `backend/postman/EvArkadasim V2 API.postman_collection.json`

---

## Real-time (SignalR)

WebSocket endpoint: `ws://host/hubs/chat?access_token={jwt}`

| Event (server → client) | Payload | When |
|--------------------------|---------|------|
| `ReceiveMessage` | `MessageDto` | New message sent to match |
| `MatchCreated` | `MatchDto` | Mutual like detected |

---

## CI/CD

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `ci-backend` | Push/PR on `backend/**` | restore → build → test + coverage report |
| `ci-frontend` | Push/PR on `frontend/**` | `tsc --noEmit` → `expo lint` |
| `pr-check` | PR opened/updated | Enforces Conventional Commits title + branch naming |
| `docker` | Push to `main` on `backend/**` | Builds image → pushes to GHCR |
| `auto-label` | PR opened/updated | Labels PRs: `backend`, `frontend`, `ci`, `dependencies` |

---

## Environment Variables

```env
# .env (see .env.example)
JWT_SECRET=your-32-char-minimum-secret-here
```

`appsettings.Development.json` handles all other local config (SQLite path, Redis connection, JWT issuer/audience).

---

## Documentation

Comprehensive docs in `backend/docs/`:
- [Architecture Overview](backend/docs/01-OVERVIEW.md)
- [API Reference](backend/docs/02-API-REFERENCE.md)
- [Database Schema](backend/docs/03-DATABASE.md)
- [Business Logic & Algorithms](backend/docs/04-BUSINESS-LOGIC.md)
- [Security & Dev Guide](backend/docs/05-SECURITY-AND-DEV-GUIDE.md)
