# EvArkadaşım — Backend API

<p align="left">
  <img src="https://img.shields.io/badge/.NET-8.0-512BD4?style=flat&logo=dotnet" />
  <img src="https://img.shields.io/badge/Architecture-Clean_Architecture-brightgreen" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL_%26_EF_Core-336791?style=flat&logo=postgresql" />
  <img src="https://img.shields.io/badge/Cache-Redis-DC382D?style=flat&logo=redis" />
  <img src="https://img.shields.io/badge/Realtime-SignalR-512BD4?style=flat" />
  <img src="https://img.shields.io/badge/Auth-JWT_Bearer-orange?style=flat&logo=jsonwebtokens" />
  <img src="https://img.shields.io/badge/Logging-Serilog-004880?style=flat" />
  <img src="https://img.shields.io/badge/Postman-78_Tests-EF5B25?style=flat&logo=postman" />
  <img src="https://img.shields.io/badge/xUnit-73_Tests-512BD4?style=flat&logo=dotnet" />
</p>

ASP.NET Core 8 Web API for a personality-driven roommate matchmaking platform. Built with Clean Architecture, Repository Pattern, JWT authentication with refresh token rotation, Redis distributed cache, SignalR real-time messaging, and role-based feed filtering (property owners ↔ room seekers).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | ASP.NET Core 8 Web API |
| Architecture | Clean Architecture (4 layers) |
| ORM | Entity Framework Core 8 |
| Database | PostgreSQL 16 (via Npgsql) |
| Cache | Redis via `StackExchange.Redis` (5-min feed TTL) |
| Real-time | ASP.NET Core SignalR (WebSocket hub) |
| Auth | ASP.NET Identity + JWT Bearer + Refresh Token |
| Security | Rate Limiting (`AspNetCoreRateLimit`), Token Revocation |
| Logging | Serilog (console + rolling file sinks) |
| API Docs | Swagger / OpenAPI (XML doc comments) |
| Testing | xUnit + Moq (73 tests) |

---

## Getting Started

### Option A — Docker (recommended)

```bash
# From repo root
cp .env.example .env
# Edit .env — set JWT_SECRET to a 32+ character value
docker-compose up --build
```

API: `http://localhost:5000` | Swagger: `http://localhost:5000/swagger`

### Option B — Local

**Prerequisites:** .NET 8 SDK, PostgreSQL 16, Redis (optional — app degrades gracefully without it)

```bash
cd EvArkadasimV2.API
dotnet restore
dotnet run
```

On first run, the database is created automatically and seeded with:
- **50 users** across 9 cities (İstanbul, Ankara, İzmir, Bursa, Antalya, Eskişehir, Konya, Adana, Trabzon, Gaziantep)
- **10 property listings** with real coordinates (lat/lng) for map display
- **3 pre-built matches** with 18 messages (6 per match)
- Deterministic seed: şehir bazlı Roommate/Room rolleri, kişilik test skorları

**Swagger UI:** `https://localhost:7xxx/swagger`

**Test credentials:** `user1@test.com` / `Test1234!`

---

## Project Structure

```
EvArkadasimV2.Domain/          # Entities, Enums, Value Objects
EvArkadasimV2.Application/     # Services, DTOs, Interfaces, Exceptions
EvArkadasimV2.Infrastructure/  # EF Core, Repositories, Redis, JWT, DataSeeder
EvArkadasimV2.API/             # Controllers, SignalR Hubs, Middleware, DI
EvArkadasimV2.Tests/           # 49 xUnit unit tests (no DB required)
docs/                          # Technical documentation
postman/                       # Postman integration test collection (78 tests)
```

---

## API Overview

| Group | Endpoints | Description |
|-------|-----------|-------------|
| **Auth** | `POST register` `POST login` `POST refresh` `POST logout` | JWT + refresh token issuance, rotation & revocation |
| **Profile** | `GET /PUT /api/profile` | User profile management (partial update, LookingFor role change) |
| **Feed** | `GET /api/users` | Paginated candidate feed; city + role filtered, Redis-cached (5-min TTL) |
| **User Detail** | `GET /api/users/{id}` | Single user profile with compatibility score |
| **Swipe** | `POST /api/swipe` `GET /api/swipe/matches` | Like / Pass / SuperLike + mutual match detection |
| **Character Test** | `POST /api/test/Basic` `POST /api/test/Detailed` | 6-dimension personality scoring |
| **Property** | Full CRUD `/api/property` | Property listings with city/price/type/pets filters |
| **Property Map** | `GET /api/property/map` | Coordinate-based property pins (city filter) |
| **Property Mine** | `GET /api/property/mine` `DELETE /api/property/mine` | Owner's own listing management |
| **Messaging** | `GET /POST /api/messages/{matchId}` `PUT read` | Match-scoped chat with XSS encoding |
| **Health** | `GET /health` | Liveness check |

All protected endpoints require `Authorization: Bearer <token>`.

---

## Real-time (SignalR)

WebSocket endpoint: `ws://host/hubs/chat?access_token={jwt}`

| Event (server → client) | Payload | Trigger |
|--------------------------|---------|---------|
| `ReceiveMessage` | `MessageDto` | New message sent to a match |
| `MatchCreated` | `MatchDto` | Mutual like detected (both users notified) |

The hub authenticates via JWT query string (`access_token`) because WebSocket connections cannot carry HTTP headers. Each connected user joins their own group (`user-{id}`) on connect.

---

## Key Design Decisions

**Compatibility Algorithm** — Calculates a 0–100% score using Manhattan Distance across 6 personality dimensions. Returns `null` when either user hasn't completed the personality test (frontend shows a locked badge).

**Role-Based Feed** — `LookingFor` enum (`Roommate` / `Room`). Property owners (Roommate) only see room seekers; room seekers see all candidates. Creating a property automatically sets the user's role to Roommate.

**City Filtering** — Feed is scoped to the user's city. Users without a city see all candidates. Property map pins support optional city query parameter.

**Feed Sorting** — Three-tier priority: users who liked you first → highest compatibility → most recently active. Pagination runs after in-memory sort to prevent cross-page ordering gaps. Results cached in Redis (5-min TTL); cache invalidated on swipe, profile update, and property create/delete.

**LookingFor Business Rules** — A user cannot switch to Roommate role without owning at least one property listing. Creating a property auto-sets the role. Deleting all properties allows switching back to Room.

**Authorization Pattern** — Ownership/membership is validated inside the service layer (`AuthorizeMatchAccessAsync`, `OwnerId == currentUserId`). Controllers only handle HTTP shape; no business logic leaks into controllers.

**INotificationService Abstraction** — Application layer depends on `INotificationService` (interface), not SignalR directly. `SignalRNotificationService` is registered in the API layer. This keeps the Application layer framework-agnostic and testable with a `Mock<INotificationService>`.

**Token Revocation** — Logout adds the JWT `jti` to an in-memory blocklist. `TokenRevocationMiddleware` checks every request, returning 401 for revoked tokens without a round-trip to the database.

---

## Environment Variables

| Key | Description |
|-----|-------------|
| `JwtSettings__Secret` | JWT signing key (min 32 chars) |
| `JwtSettings__Issuer` | Token issuer identifier |
| `JwtSettings__Audience` | Token audience identifier |
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string (e.g. `Host=localhost;Port=5432;Database=evarkadasimv2;Username=postgres;Password=...`) |
| `ConnectionStrings__Redis` | Redis connection string (e.g. `localhost:6379`) |

Development defaults are in `appsettings.Development.json` (not committed). Create this file locally with a `JwtSettings.Secret` value of at least 32 characters. Redis is optional; the feed falls through to direct DB query if Redis is unavailable.

---

## Testing

### Integration Tests (Postman)

Import `postman/EvArkadasim V2 API.postman_collection.json` into Postman.

The collection includes 78 tests across 10 groups (Auth, Profile, Feed, Swipe, Test, Property, Messaging), covering happy paths, validation errors, authorization checks, and edge cases.

### Unit Tests (xUnit)

```bash
cd ..   # backend/ root
dotnet test EvArkadasimV2.slnx -c Release
# Passed! 73/73
```

73 tests across 6 service classes:

| Test Class | Tests | What It Covers |
|------------|-------|----------------|
| `CompatibilityServiceTests` | 8 | Manhattan Distance algorithm, null → null, boundary values, symmetry |
| `FeedServiceTests` | 10 | Sorting priority (likers first), pagination (skip/take), DoS clamp, edge cases |
| `SwipeServiceTests` | 10 | Self-swipe guard, invalid type, duplicate swipe, mutual match creation, MatchesCount, SignalR dispatch |
| `MessageServiceTests` | 13 | Auth (NotFoundException, ForbiddenException), send direction, HTML encoding, mark-as-read, invalid type fallback |
| `ProfileServiceTests` | 7 | Score mapping (Initial/Final/CharacterProfile), null guards, cache invalidation |
| `PropertyServiceTests` | 18 | CRUD operations, ownership validation, filters, price validation |
| `TestServiceTests` | 7 | Basic/Detailed test submission, score averaging, prerequisite validation |

All repository and service dependencies are mocked with Moq — no database required.

---

## Logging

Structured logging via **Serilog** with two sinks:
- **Console** — colored output in development
- **Rolling file** — `logs/api-.log` with daily rotation (retained 7 days)

Request logging middleware records method, path, status code, and elapsed time for every HTTP request.

---

## Documentation

Detailed technical reference in [`docs/`](./docs/):

| File | Content |
|------|---------|
| [01-OVERVIEW.md](./docs/01-OVERVIEW.md) | Architecture, DI, configuration, middleware pipeline |
| [02-API-REFERENCE.md](./docs/02-API-REFERENCE.md) | Full endpoint reference with request/response examples |
| [03-DATABASE.md](./docs/03-DATABASE.md) | ER diagram, relationships, migrations |
| [04-BUSINESS-LOGIC.md](./docs/04-BUSINESS-LOGIC.md) | Auth flow, compatibility algorithm, swipe/match logic |
| [05-SECURITY-AND-DEV-GUIDE.md](./docs/05-SECURITY-AND-DEV-GUIDE.md) | Security measures, performance patterns, dev guide |
