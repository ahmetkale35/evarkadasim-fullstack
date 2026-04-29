# EvArkadaşım — Backend API

<p align="left">
  <img src="https://img.shields.io/badge/.NET-6.0-512BD4?style=flat&logo=dotnet" />
  <img src="https://img.shields.io/badge/Architecture-Clean_Architecture-brightgreen" />
  <img src="https://img.shields.io/badge/Database-SQLite_%26_EF_Core-003B57?style=flat&logo=sqlite" />
  <img src="https://img.shields.io/badge/Auth-JWT_Bearer-orange?style=flat&logo=jsonwebtokens" />
  <img src="https://img.shields.io/badge/Tests-Postman_80%2B-EF5B25?style=flat&logo=postman" />
</p>

ASP.NET Core 6 Web API for a personality-driven roommate matchmaking platform. Built with Clean Architecture, Repository Pattern, and JWT authentication.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | ASP.NET Core 6 Web API |
| Architecture | Clean Architecture (4 layers) |
| ORM | Entity Framework Core 6 |
| Database | SQLite (dev) |
| Auth | ASP.NET Identity + JWT Bearer |
| API Docs | Swagger / OpenAPI |

---

## Getting Started

### Prerequisites
- [.NET 6 SDK](https://dotnet.microsoft.com/download/dotnet/6.0)

### Run

```bash
cd EvArkadasimV2.API
dotnet restore
dotnet run
```

On first run, the database is created automatically and seeded with 50 mock users and 10 property listings.

**Swagger UI:** `https://localhost:7xxx/swagger`

**Test credentials:** `user1@test.com` / `Test1234!`

---

## Project Structure

```
EvArkadasimV2.Domain/          # Entities, Enums, Value Objects
EvArkadasimV2.Application/     # Services, DTOs, Interfaces, Exceptions
EvArkadasimV2.Infrastructure/  # EF Core, Repositories, JWT, DataSeeder
EvArkadasimV2.API/             # Controllers, Program.cs, DI Registration
docs/                          # Technical documentation
postman/                       # API test collection (80+ tests)
```

---

## API Overview

| Group | Endpoints | Description |
|-------|-----------|-------------|
| **Auth** | `POST /api/auth/register` `POST /api/auth/login` | JWT token issuance |
| **Profile** | `GET /PUT /api/profile` | User profile management |
| **Feed** | `GET /api/users` | Candidate feed with compatibility sorting |
| **Swipe** | `POST /api/swipe` `GET /api/swipe/matches` | Like / Pass / SuperLike + match detection |
| **Character Test** | `POST /api/test/basic` `POST /api/test/detailed` | 6-dimension personality scoring |
| **Property** | `GET /POST /PUT /DELETE /api/property` | Property listings with filtering |
| **Messaging** | `GET /POST /api/message/{matchId}` `PUT /api/message/{matchId}/read` | Match-scoped chat |

All protected endpoints require `Authorization: Bearer <token>`.

---

## Key Design Decisions

**Compatibility Algorithm** — Calculates a 0-100% score using Manhattan Distance across 6 personality dimensions (social energy, order approach, conflict management, sharing style, life rhythm, communication style).

**Feed Sorting** — Three-tier priority: users who liked you first → highest compatibility → most recently active. Pagination happens after in-memory sort to prevent cross-page ordering issues.

**Authorization Pattern** — Every messaging and property endpoint validates ownership/membership inside the service layer (`AuthorizeMatchAccessAsync`, `OwnerId == currentUserId`). Controllers only handle HTTP shape.

**Options Pattern** — `IConfiguration` dependency removed from Application layer. All settings injected via `IOptions<T>` for type safety and testability.

---

## Environment Variables

| Key | Description |
|-----|-------------|
| `JwtSettings__Secret` | JWT signing key (min 32 chars) |
| `JwtSettings__Issuer` | Token issuer identifier |
| `JwtSettings__Audience` | Token audience identifier |
| `ConnectionStrings__DefaultConnection` | SQLite file path |

Development defaults are in `appsettings.Development.json` (not committed).

---

## Testing

Import `postman/EvArkadasim V2 API.postman_collection.json` into Postman.

The collection includes 80+ tests covering happy paths, validation errors, authorization checks, and edge cases across all endpoint groups.

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
