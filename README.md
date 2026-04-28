# 🏠 EvArkadaşım — Roommate Matchmaking Platform

<p align="center">
  <img src="https://img.shields.io/badge/.NET-6.0-512BD4?style=flat&logo=dotnet" alt=".NET 6" />
  <img src="https://img.shields.io/badge/Architecture-Clean_Architecture-brightgreen" alt="Clean Architecture" />
  <img src="https://img.shields.io/badge/Database-SQLite_&_EF_Core-003B57?style=flat&logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/Frontend-React_Native_Expo-61DAFB?style=flat&logo=react" alt="React Native" />
</p>

EvArkadaşım is a smart, personality-driven matchmaking platform designed to help people find their ideal roommates. Instead of simply listing properties, it uses a **compatibility algorithm** based on 6-dimensional personality tests and lifestyle habits to suggest the best possible matches.

## ✨ Key Features

- **🧠 Smart Matching Algorithm**: Calculates compatibility scores (0-100%) using Manhattan Distance based on multi-dimensional personality tests.
- **🔄 Swipe Mechanics**: Tinder-style intuitive swiping (Like, Pass, SuperLike) with automatic mutual match detection.
- **📈 Intelligent Feed**: Uses a dynamic sorting algorithm that prioritizes `SuperLikes` and `Likes`, followed by the highest compatibility score.
- **🔐 Secure Authentication**: JWT Bearer token implementation with robust security practices.
- **🏗️ Clean Architecture**: Highly maintainable, decoupled backend architecture separating Domain, Application, Infrastructure, and API layers.
- **📱 Cross-Platform App**: Mobile application built with React Native and Expo.

## 🛠️ Technology Stack

### Backend
- **Framework:** ASP.NET Core 6 Web API
- **Architecture:** Clean Architecture (Domain-Driven Design principles)
- **Database:** SQLite with Entity Framework Core 6
- **Security:** ASP.NET Identity, JWT (JSON Web Tokens)
- **Pattern:** Repository Pattern, Dependency Injection

### Frontend
- **Framework:** React Native (Expo)
- **Routing:** Expo Router
- **UI:** Animated Components, Custom Hooks

## 📂 Project Structure

```text
├── backend/
│   ├── EvArkadasimV2.Domain/          # Core entities, Enums, Value Objects
│   ├── EvArkadasimV2.Application/     # Business logic, DTOs, Service Interfaces
│   ├── EvArkadasimV2.Infrastructure/  # EF Core DbContext, Repositories, JWT Setup
│   ├── EvArkadasimV2.API/             # Controllers, Middlewares, DI Registration
│   ├── docs/                          # Extensive technical documentation
│   └── postman/                       # 45+ API integration tests
└── frontend/
    └── evarkadasim-yeni-main/         # Expo mobile application
```

## 📖 Documentation

Comprehensive documentation is available in the `backend/docs` directory:
- [Architecture Overview](backend/docs/01-OVERVIEW.md)
- [API Reference](backend/docs/02-API-REFERENCE.md)
- [Database Schema & ER](backend/docs/03-DATABASE.md)
- [Business Logic & Algorithms](backend/docs/04-BUSINESS-LOGIC.md)
- [Security & Development Guide](backend/docs/05-SECURITY-AND-DEV-GUIDE.md)

## 🚀 Getting Started

### Prerequisites
- [.NET 6 SDK](https://dotnet.microsoft.com/download/dotnet/6.0)
- [Node.js](https://nodejs.org/) (for frontend)

### Backend Setup
```bash
cd backend/EvArkadasimV2.API
dotnet restore
dotnet run
```
*The database will be automatically created and seeded with mock data on the first run. Access Swagger UI at `https://localhost:7xxx/swagger`.*

### Frontend Setup
```bash
cd frontend/evarkadasim-yeni-main
npm install
npx expo start
```
