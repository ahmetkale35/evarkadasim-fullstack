# Graph Report - .  (2026-04-28)

## Corpus Check
- 32 files · ~0 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 412 nodes · 472 edges · 67 communities detected
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Core Data and Service Layer|Core Data and Service Layer]]
- [[_COMMUNITY_Application Interfaces and Test DTOs|Application Interfaces and Test DTOs]]
- [[_COMMUNITY_API Controllers and Profile Services|API Controllers and Profile Services]]
- [[_COMMUNITY_Swipe and Match Domain|Swipe and Match Domain]]
- [[_COMMUNITY_Database Migration History|Database Migration History]]
- [[_COMMUNITY_Auth and User Domain|Auth and User Domain]]
- [[_COMMUNITY_Auth API Layer|Auth API Layer]]
- [[_COMMUNITY_Domain Entity Model|Domain Entity Model]]
- [[_COMMUNITY_Generic Repository Interface|Generic Repository Interface]]
- [[_COMMUNITY_Generic Repository Implementation|Generic Repository Implementation]]
- [[_COMMUNITY_Feed Discovery Pipeline|Feed Discovery Pipeline]]
- [[_COMMUNITY_Identity and Database Context|Identity and Database Context]]
- [[_COMMUNITY_Domain Exceptions|Domain Exceptions]]
- [[_COMMUNITY_User Repository Interface|User Repository Interface]]
- [[_COMMUNITY_Data Seeder|Data Seeder]]
- [[_COMMUNITY_User Profile DTO|User Profile DTO]]
- [[_COMMUNITY_Auth Service Interface|Auth Service Interface]]
- [[_COMMUNITY_Profile Service Interface|Profile Service Interface]]
- [[_COMMUNITY_Test Service Interface|Test Service Interface]]
- [[_COMMUNITY_DB Schema Snapshot|DB Schema Snapshot]]
- [[_COMMUNITY_Match DTO|Match DTO]]
- [[_COMMUNITY_Swipe Repository Interface|Swipe Repository Interface]]
- [[_COMMUNITY_Swipe Service Interface|Swipe Service Interface]]
- [[_COMMUNITY_AppUser Identity Entity|AppUser Identity Entity]]
- [[_COMMUNITY_Initial Migration Designer|Initial Migration Designer]]
- [[_COMMUNITY_Auth Profile Fix Migration|Auth Profile Fix Migration]]
- [[_COMMUNITY_Communication Style Migration|Communication Style Migration]]
- [[_COMMUNITY_Solution Projects|Solution Projects]]
- [[_COMMUNITY_Feed Service Interface|Feed Service Interface]]
- [[_COMMUNITY_Room Type Nullable Migration|Room Type Nullable Migration]]
- [[_COMMUNITY_Auth Response DTO|Auth Response DTO]]
- [[_COMMUNITY_Login DTO|Login DTO]]
- [[_COMMUNITY_Register DTO|Register DTO]]
- [[_COMMUNITY_Message DTO|Message DTO]]
- [[_COMMUNITY_Send Message DTO|Send Message DTO]]
- [[_COMMUNITY_Create Property DTO|Create Property DTO]]
- [[_COMMUNITY_Property DTO|Property DTO]]
- [[_COMMUNITY_Basic Test Result DTO|Basic Test Result DTO]]
- [[_COMMUNITY_Detailed Test Result DTO|Detailed Test Result DTO]]
- [[_COMMUNITY_Swipe Request DTO|Swipe Request DTO]]
- [[_COMMUNITY_Update Profile DTO|Update Profile DTO]]
- [[_COMMUNITY_Message Entity|Message Entity]]
- [[_COMMUNITY_User Match Entity|User Match Entity]]
- [[_COMMUNITY_User Profile Entity|User Profile Entity]]
- [[_COMMUNITY_User Swipe Entity|User Swipe Entity]]
- [[_COMMUNITY_Basic Test Value Object|Basic Test Value Object]]
- [[_COMMUNITY_Detailed Test Value Object|Detailed Test Value Object]]
- [[_COMMUNITY_Location Value Object|Location Value Object]]
- [[_COMMUNITY_JWT Configuration|JWT Configuration]]
- [[_COMMUNITY_Swipe Result DTO|Swipe Result DTO]]
- [[_COMMUNITY_User Summary DTO|User Summary DTO]]
- [[_COMMUNITY_LookingFor Enum|LookingFor Enum]]
- [[_COMMUNITY_MessageType Enum|MessageType Enum]]
- [[_COMMUNITY_PropertyType Enum|PropertyType Enum]]
- [[_COMMUNITY_RoomType Enum|RoomType Enum]]
- [[_COMMUNITY_SwipeType Enum|SwipeType Enum]]
- [[_COMMUNITY_Property DTOs|Property DTOs]]
- [[_COMMUNITY_API Entry Point|API Entry Point]]
- [[_COMMUNITY_API Build Artifacts|API Build Artifacts]]
- [[_COMMUNITY_API Global Usings|API Global Usings]]
- [[_COMMUNITY_MVC Parts Assembly Info|MVC Parts Assembly Info]]
- [[_COMMUNITY_Application Build Artifacts|Application Build Artifacts]]
- [[_COMMUNITY_Application Global Usings|Application Global Usings]]
- [[_COMMUNITY_Domain Build Artifacts|Domain Build Artifacts]]
- [[_COMMUNITY_Domain Global Usings|Domain Global Usings]]
- [[_COMMUNITY_Infrastructure Build Artifacts|Infrastructure Build Artifacts]]
- [[_COMMUNITY_Infrastructure Global Usings|Infrastructure Global Usings]]

## God Nodes (most connected - your core abstractions)
1. `Program Startup (Program.cs)` - 14 edges
2. `GenericRepository` - 12 edges
3. `UserProfile (Domain Entity)` - 12 edges
4. `IGenericRepository` - 11 edges
5. `AppDbContext (EF Core DbContext)` - 11 edges
6. `Migration: InitialCreate` - 10 edges
7. `Roadmap Phase 2: Feed Endpoint (completed)` - 9 edges
8. `UserProfileDto` - 8 edges
9. `SwipeService` - 8 edges
10. `AppUser Entity` - 8 edges

## Surprising Connections (you probably didn't know these)
- `GetFeedCandidatesAsync Method` --implements--> `Feed Sorting Logic: Like-boost then LastActive DESC`  [INFERRED]
  EvArkadasimV2.Infrastructure/Repositories/UserRepository.cs → docs/ROADMAP.md
- `FeedService` --calls--> `UserRepository`  [INFERRED]
  docs/ROADMAP.md → EvArkadasimV2.Infrastructure/Repositories/UserRepository.cs
- `Roadmap Phase 3: MatchDto Enrichment` --references--> `UserMatch Entity`  [EXTRACTED]
  docs/ROADMAP.md → EvArkadasimV2.Infrastructure/Migrations/AppDbContextModelSnapshot.cs
- `EF Core OwnsOne Location Value Object (auto-included, no ThenInclude needed)` --conceptually_related_to--> `UserProfile Entity`  [EXTRACTED]
  docs/ROADMAP.md → EvArkadasimV2.Infrastructure/Migrations/AppDbContextModelSnapshot.cs
- `CompatibilityService (planned for Phase 2.5)` --shares_data_with--> `UserProfile Entity`  [INFERRED]
  docs/ROADMAP.md → EvArkadasimV2.Infrastructure/Migrations/AppDbContextModelSnapshot.cs

## Hyperedges (group relationships)
- **EF Core Owned Types Mapped onto UserProfile** — appdbcontext_AppDbContext, entity_UserProfile, detailedtestresults_DetailedTestResults, location_Location [EXTRACTED 0.95]
- **Swipe-to-Match Business Flow** — swipecontroller, swipeservice, iswiperepository, imatchrepository [EXTRACTED 0.95]
- **Feed Discovery Pipeline** — userscontroller, feedservice, iuserrepository [EXTRACTED 0.95]
- **RoomType Nullable Domain-Schema Alignment** — userprofile_entity, roomtype_enum, migration_roomtype_nullable [EXTRACTED 0.90]
- **Swipe-to-Match Flow: SwipeRepository detects reciprocal swipe, MatchRepository records UserMatch** — SwipeRepository_class, GetReciprocalPositiveSwipeAsync_method, MatchRepository_class, UserMatch_entity, UserSwipe_entity [INFERRED 0.88]
- **Feed Pipeline: UserRepository queries candidates, FeedService maps to DTO, UsersController serves GET /api/users** — UserRepository_class, GetFeedCandidatesAsync_method, FeedService_class, UserSummaryDto_class, UsersController_class [INFERRED 0.85]
- **Compatibility Score MVP Decision: move from client-side calculateCompatibility to server-side CompatibilityService populating UserSummaryDto.compatibility** — frontend_calculateCompatibility, CompatibilityService_planned, UserSummaryDto_class, concept_compatibility_score [EXTRACTED 0.90]

## Communities

### Community 0 - "Core Data and Service Layer"
Cohesion: 0.08
Nodes (44): AppDbContext, AppUser Entity, CompatibilityService (planned for Phase 2.5), FeedService, GenericRepository<T>, GetFeedCandidatesAsync Method, GetMatchesForUserAsync Method, GetReciprocalPositiveSwipeAsync Method (+36 more)

### Community 1 - "Application Interfaces and Test DTOs"
Cohesion: 0.11
Nodes (29): BasicTestResultDto, CharacterProfileDto, DetailedTestResultDto, FeedService, IFeedService, IGenericRepository, EvArkadasimV2.Application.Interfaces.Repositories, IMatchRepository (+21 more)

### Community 2 - "API Controllers and Profile Services"
Cohesion: 0.09
Nodes (11): ControllerBase, EvArkadasimV2.API.Controllers, ProfileController, EvArkadasimV2.Application.Services, ProfileService, EvArkadasimV2.API.Controllers, SwipeController, EvArkadasimV2.API.Controllers (+3 more)

### Community 3 - "Swipe and Match Domain"
Cohesion: 0.1
Nodes (11): GenericRepository, IMatchRepository, ISwipeRepository, EvArkadasimV2.Infrastructure.Repositories, MatchRepository, EvArkadasimV2.Infrastructure.Repositories, SwipeRepository, EvArkadasimV2.Application.Services (+3 more)

### Community 4 - "Database Migration History"
Cohesion: 0.1
Nodes (9): EvArkadasimV2.Infrastructure.Migrations, InitialCreate, EvArkadasimV2.Infrastructure.Migrations, InitialAuthAndProfileFix, AddDetailedCommunicationStyleColumn, EvArkadasimV2.Infrastructure.Migrations, EvArkadasimV2.Infrastructure.Migrations, MakeRoomTypeNullable (+1 more)

### Community 5 - "Auth and User Domain"
Cohesion: 0.15
Nodes (20): AppUser Entity, AuthService, BasicTestResults Value Object, DataSeeder, IAuthService Interface, IProfileService Interface, ITestService Interface, LookingFor Enum (+12 more)

### Community 6 - "Auth API Layer"
Cohesion: 0.15
Nodes (9): AuthController, AuthController, EvArkadasimV2.API.Controllers, AuthResponseDto, AuthService, EvArkadasimV2.Application.Services, IAuthService, LoginDto (+1 more)

### Community 7 - "Domain Entity Model"
Cohesion: 0.27
Nodes (16): AppDbContext (EF Core DbContext), DetailedTestResults Value Object, AppUser Entity, Message Entity, Property Entity, UserMatch Entity, UserProfile Entity, UserSwipe Entity (+8 more)

### Community 8 - "Generic Repository Interface"
Cohesion: 0.15
Nodes (2): EvArkadasimV2.Application.Interfaces.Repositories, IGenericRepository

### Community 9 - "Generic Repository Implementation"
Cohesion: 0.18
Nodes (2): EvArkadasimV2.Infrastructure.Repositories, GenericRepository

### Community 10 - "Feed Discovery Pipeline"
Cohesion: 0.22
Nodes (4): EvArkadasimV2.Application.Services, FeedService, EvArkadasimV2.API.Controllers, UsersController

### Community 11 - "Identity and Database Context"
Cohesion: 0.25
Nodes (5): AppDbContext, EvArkadasimV2.Infrastructure.Data, IdentityDbContext, EvArkadasimV2.Domain.Entities, Property

### Community 12 - "Domain Exceptions"
Cohesion: 0.29
Nodes (5): DomainException, EvArkadasimV2.Application.Exceptions, Exception, EvArkadasimV2.Application.Exceptions, NotFoundException

### Community 13 - "User Repository Interface"
Cohesion: 0.33
Nodes (2): EvArkadasimV2.Application.Interfaces.Repositories, IUserRepository

### Community 14 - "Data Seeder"
Cohesion: 0.47
Nodes (2): DataSeeder, EvArkadasimV2.Infrastructure.Data

### Community 15 - "User Profile DTO"
Cohesion: 0.4
Nodes (4): CharacterProfileDto, EvArkadasimV2.Application.DTOs.User, LocationDto, UserProfileDto

### Community 16 - "Auth Service Interface"
Cohesion: 0.4
Nodes (2): EvArkadasimV2.Application.Interfaces.Services, IAuthService

### Community 17 - "Profile Service Interface"
Cohesion: 0.4
Nodes (2): EvArkadasimV2.Application.Interfaces.Services, IProfileService

### Community 18 - "Test Service Interface"
Cohesion: 0.4
Nodes (2): EvArkadasimV2.Application.Interfaces.Services, ITestService

### Community 19 - "DB Schema Snapshot"
Cohesion: 0.4
Nodes (3): AppDbContextModelSnapshot, EvArkadasimV2.Infrastructure.Migrations, ModelSnapshot

### Community 20 - "Match DTO"
Cohesion: 0.4
Nodes (3): EvArkadasimV2.Application.DTOs.Chat, EvArkadasimV2.Application.DTOs.User, MatchDto

### Community 21 - "Swipe Repository Interface"
Cohesion: 0.4
Nodes (2): EvArkadasimV2.Application.Interfaces.Repositories, ISwipeRepository

### Community 22 - "Swipe Service Interface"
Cohesion: 0.4
Nodes (2): EvArkadasimV2.Application.Interfaces.Services, ISwipeService

### Community 23 - "AppUser Identity Entity"
Cohesion: 0.5
Nodes (3): AppUser, EvArkadasimV2.Domain.Entities, IdentityUser

### Community 24 - "Initial Migration Designer"
Cohesion: 0.5
Nodes (2): EvArkadasimV2.Infrastructure.Migrations, InitialCreate

### Community 25 - "Auth Profile Fix Migration"
Cohesion: 0.5
Nodes (2): EvArkadasimV2.Infrastructure.Migrations, InitialAuthAndProfileFix

### Community 26 - "Communication Style Migration"
Cohesion: 0.5
Nodes (2): AddDetailedCommunicationStyleColumn, EvArkadasimV2.Infrastructure.Migrations

### Community 27 - "Solution Projects"
Cohesion: 1.0
Nodes (4): EvArkadasimV2.API Project, EvArkadasimV2.Application Project, EvArkadasimV2.Domain Project, EvArkadasimV2.Infrastructure Project

### Community 28 - "Feed Service Interface"
Cohesion: 0.5
Nodes (2): EvArkadasimV2.Application.Interfaces.Services, IFeedService

### Community 29 - "Room Type Nullable Migration"
Cohesion: 0.5
Nodes (2): EvArkadasimV2.Infrastructure.Migrations, MakeRoomTypeNullable

### Community 30 - "Auth Response DTO"
Cohesion: 0.67
Nodes (2): AuthResponseDto, EvArkadasimV2.Application.DTOs.Auth

### Community 31 - "Login DTO"
Cohesion: 0.67
Nodes (2): EvArkadasimV2.Application.DTOs.Auth, LoginDto

### Community 32 - "Register DTO"
Cohesion: 0.67
Nodes (2): EvArkadasimV2.Application.DTOs.Auth, RegisterDto

### Community 33 - "Message DTO"
Cohesion: 0.67
Nodes (2): EvArkadasimV2.Application.DTOs.Chat, MessageDto

### Community 34 - "Send Message DTO"
Cohesion: 0.67
Nodes (2): EvArkadasimV2.Application.DTOs.Chat, SendMessageDto

### Community 35 - "Create Property DTO"
Cohesion: 0.67
Nodes (2): CreatePropertyDto, EvArkadasimV2.Application.DTOs.Property

### Community 36 - "Property DTO"
Cohesion: 0.67
Nodes (2): EvArkadasimV2.Application.DTOs.Property, PropertyDto

### Community 37 - "Basic Test Result DTO"
Cohesion: 0.67
Nodes (2): BasicTestResultDto, EvArkadasimV2.Application.DTOs.Test

### Community 38 - "Detailed Test Result DTO"
Cohesion: 0.67
Nodes (2): DetailedTestResultDto, EvArkadasimV2.Application.DTOs.Test

### Community 39 - "Swipe Request DTO"
Cohesion: 0.67
Nodes (2): EvArkadasimV2.Application.DTOs.User, SwipeRequestDto

### Community 40 - "Update Profile DTO"
Cohesion: 0.67
Nodes (2): EvArkadasimV2.Application.DTOs.User, UpdateProfileDto

### Community 41 - "Message Entity"
Cohesion: 0.67
Nodes (2): EvArkadasimV2.Domain.Entities, Message

### Community 42 - "User Match Entity"
Cohesion: 0.67
Nodes (2): EvArkadasimV2.Domain.Entities, UserMatch

### Community 43 - "User Profile Entity"
Cohesion: 0.67
Nodes (2): EvArkadasimV2.Domain.Entities, UserProfile

### Community 44 - "User Swipe Entity"
Cohesion: 0.67
Nodes (2): EvArkadasimV2.Domain.Entities, UserSwipe

### Community 45 - "Basic Test Value Object"
Cohesion: 0.67
Nodes (2): BasicTestResults, EvArkadasimV2.Domain.ValueObjects

### Community 46 - "Detailed Test Value Object"
Cohesion: 0.67
Nodes (2): DetailedTestResults, EvArkadasimV2.Domain.ValueObjects

### Community 47 - "Location Value Object"
Cohesion: 0.67
Nodes (2): EvArkadasimV2.Domain.ValueObjects, Location

### Community 48 - "JWT Configuration"
Cohesion: 0.67
Nodes (2): EvArkadasimV2.Application.Options, JwtSettings

### Community 49 - "Swipe Result DTO"
Cohesion: 0.67
Nodes (2): EvArkadasimV2.Application.DTOs.User, SwipeResultDto

### Community 50 - "User Summary DTO"
Cohesion: 0.67
Nodes (2): EvArkadasimV2.Application.DTOs.User, UserSummaryDto

### Community 51 - "LookingFor Enum"
Cohesion: 1.0
Nodes (1): EvArkadasimV2.Domain.Enums

### Community 52 - "MessageType Enum"
Cohesion: 1.0
Nodes (1): EvArkadasimV2.Domain.Enums

### Community 53 - "PropertyType Enum"
Cohesion: 1.0
Nodes (1): EvArkadasimV2.Domain.Enums

### Community 54 - "RoomType Enum"
Cohesion: 1.0
Nodes (1): EvArkadasimV2.Domain.Enums

### Community 55 - "SwipeType Enum"
Cohesion: 1.0
Nodes (1): EvArkadasimV2.Domain.Enums

### Community 56 - "Property DTOs"
Cohesion: 1.0
Nodes (2): CreatePropertyDto, PropertyDto

### Community 57 - "API Entry Point"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "API Build Artifacts"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "API Global Usings"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "MVC Parts Assembly Info"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "Application Build Artifacts"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "Application Global Usings"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "Domain Build Artifacts"
Cohesion: 1.0
Nodes (0): 

### Community 64 - "Domain Global Usings"
Cohesion: 1.0
Nodes (0): 

### Community 65 - "Infrastructure Build Artifacts"
Cohesion: 1.0
Nodes (0): 

### Community 66 - "Infrastructure Global Usings"
Cohesion: 1.0
Nodes (0): 

## Ambiguous Edges - Review These
- `ProfileController` → `SwipeRequestDto`  [AMBIGUOUS]
  EvArkadasimV2.API/Controllers/ProfileController.cs · relation: conceptually_related_to

## Knowledge Gaps
- **120 isolated node(s):** `EvArkadasimV2.API.Controllers`, `EvArkadasimV2.API.Controllers`, `EvArkadasimV2.API.Controllers`, `EvArkadasimV2.Application.DTOs.Auth`, `AuthResponseDto` (+115 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `LookingFor Enum`** (2 nodes): `LookingFor.cs`, `EvArkadasimV2.Domain.Enums`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `MessageType Enum`** (2 nodes): `MessageType.cs`, `EvArkadasimV2.Domain.Enums`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PropertyType Enum`** (2 nodes): `PropertyType.cs`, `EvArkadasimV2.Domain.Enums`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `RoomType Enum`** (2 nodes): `RoomType.cs`, `EvArkadasimV2.Domain.Enums`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SwipeType Enum`** (2 nodes): `SwipeType.cs`, `EvArkadasimV2.Domain.Enums`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Property DTOs`** (2 nodes): `CreatePropertyDto`, `PropertyDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Entry Point`** (1 nodes): `Program.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Build Artifacts`** (1 nodes): `EvArkadasimV2.API.AssemblyInfo.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Global Usings`** (1 nodes): `EvArkadasimV2.API.GlobalUsings.g.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `MVC Parts Assembly Info`** (1 nodes): `EvArkadasimV2.API.MvcApplicationPartsAssemblyInfo.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Application Build Artifacts`** (1 nodes): `EvArkadasimV2.Application.AssemblyInfo.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Application Global Usings`** (1 nodes): `EvArkadasimV2.Application.GlobalUsings.g.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domain Build Artifacts`** (1 nodes): `EvArkadasimV2.Domain.AssemblyInfo.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Domain Global Usings`** (1 nodes): `EvArkadasimV2.Domain.GlobalUsings.g.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Infrastructure Build Artifacts`** (1 nodes): `EvArkadasimV2.Infrastructure.AssemblyInfo.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Infrastructure Global Usings`** (1 nodes): `EvArkadasimV2.Infrastructure.GlobalUsings.g.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `ProfileController` and `SwipeRequestDto`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Program Startup (Program.cs)` connect `Application Interfaces and Test DTOs` to `Swipe and Match Domain`, `Auth and User Domain`, `Auth API Layer`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `UserProfile (Domain Entity)` connect `Auth and User Domain` to `Application Interfaces and Test DTOs`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `GenericRepository` connect `Generic Repository Implementation` to `Application Interfaces and Test DTOs`, `API Controllers and Profile Services`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `UserProfile (Domain Entity)` (e.g. with `ProfileService` and `TestService`) actually correct?**
  _`UserProfile (Domain Entity)` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `EvArkadasimV2.API.Controllers`, `EvArkadasimV2.API.Controllers`, `EvArkadasimV2.API.Controllers` to the rest of the system?**
  _120 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core Data and Service Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._