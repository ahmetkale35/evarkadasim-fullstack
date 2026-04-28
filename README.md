# 🏠 EvArkadasimV2 — Roommate Finder Platform

Kişilik testi tabanlı ev arkadaşı eşleştirme platformu.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | ASP.NET Core 6, Clean Architecture |
| Database | SQLite + Entity Framework Core 6 |
| Auth | JWT Bearer + ASP.NET Identity |
| Frontend | React Native (Expo) |
| API Docs | Swagger / OpenAPI |

## 📁 Project Structure

```
├── backend/
│   ├── EvArkadasimV2.Domain/          # Entities, Enums, Value Objects
│   ├── EvArkadasimV2.Application/     # Services, DTOs, Interfaces
│   ├── EvArkadasimV2.Infrastructure/  # EF Core, Repositories, JWT
│   ├── EvArkadasimV2.API/             # Controllers, Program.cs
│   ├── docs/                          # Full documentation
│   └── postman/                       # API test collection (45 tests)
└── frontend/
    └── evarkadasim-yeni-main/         # Expo/React Native app
```

## 🚀 Quick Start

```bash
cd backend/EvArkadasimV2.API
dotnet run
# Swagger UI: https://localhost:7xxx/swagger
# Test account: user1@test.com / Test1234!
```

## 📋 Features

- ✅ JWT Authentication (Register/Login)
- ✅ Personality Test (6-dimension scoring)
- ✅ Compatibility Algorithm (Manhattan distance)
- ✅ Tinder-style Swipe (Like/Pass/SuperLike)
- ✅ Auto-matching (mutual likes)
- ✅ Smart Feed (like-boost + compatibility sort)
- ⏳ Property Listings (CRUD)
- ⏳ Real-time Messaging (SignalR)
- ⏳ Frontend Integration

## 📚 Documentation

See [backend/docs/README.md](backend/docs/README.md) for full documentation including:
- API Reference (all endpoints with examples)
- Database Schema (ER diagrams, relationships)
- Business Logic (algorithms, formulas)
- Security & Dev Guide
