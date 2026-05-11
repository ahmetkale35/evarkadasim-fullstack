using EvArkadasimV2.Application.DTOs.User;
using EvArkadasimV2.Application.Exceptions;
using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Domain.Entities;
using EvArkadasimV2.Domain.Enums;

namespace EvArkadasimV2.Application.Services
{
    public class SwipeService : ISwipeService
    {
        private readonly ISwipeRepository _swipeRepository;
        private readonly IMatchRepository _matchRepository;
        private readonly IUserRepository _userRepository;
        private readonly ICompatibilityService _compatibilityService;
        private readonly ICacheService _cache;
        private readonly INotificationService _notifications;

        public SwipeService(
            ISwipeRepository swipeRepository,
            IMatchRepository matchRepository,
            IUserRepository userRepository,
            ICompatibilityService compatibilityService,
            ICacheService cache,
            INotificationService notifications)
        {
            _swipeRepository = swipeRepository;
            _matchRepository = matchRepository;
            _userRepository = userRepository;
            _compatibilityService = compatibilityService;
            _cache = cache;
            _notifications = notifications;
        }

        public async Task<SwipeResultDto> SwipeAsync(string senderId, SwipeRequestDto request)
        {
            // 1) Self-swipe engeli: kullanıcı kendi profiline swipe atarsa hem mantık
            // dışıdır hem de "self-match" anomalisine yol açar.
            if (string.Equals(senderId, request.ReceiverId, StringComparison.Ordinal))
                throw new DomainException("Kendinize swipe işlemi yapamazsınız.");

            // 2) String olarak gelen swipe tipini enum'a güvenli dönüştürme.
            // Enum.TryParse client'tan gelebilecek "like", "LIKE", "Like" gibi varyasyonları
            // tolere eder; geçersiz değerlerde InvalidCastException fırlatmadan false döner.
            if (!Enum.TryParse<SwipeType>(request.SwipeType, ignoreCase: true, out var swipeType))
                throw new DomainException("Geçersiz swipe tipi. Geçerli değerler: Like, Pass, SuperLike.");

            // 3) Idempotency koruması: aynı yön için ikinci swipe sayaçları (MatchesCount,
            // LikedProfilesCount) çift sayar ve tarihçeyi bozar. Yeni swipe yazmadan önce kontrol.
            if (await _swipeRepository.HasSwipedAsync(senderId, request.ReceiverId))
                throw new DomainException("Bu kullanıcıya zaten swipe yaptınız.");

            // 4) Receiver'ın gerçekten var olduğundan emin ol. Eşleşme oluşacaksa profilinin
            // MatchesCount'u artırılacağı için tracking=true ile çağırıyoruz.
            var receiver = await _userRepository.GetUserWithProfileAsync(request.ReceiverId, tracking: true);
            if (receiver?.Profile == null)
                throw new NotFoundException("Eşleşilecek kullanıcı bulunamadı.");

            // 5) Yeni swipe kaydını ekle (henüz veritabanına yazılmadı, tek SaveChanges sonunda yazılacak).
            var newSwipe = new UserSwipe
            {
                SenderId = senderId,
                ReceiverId = request.ReceiverId,
                SwipeType = swipeType
            };
            await _swipeRepository.AddAsync(newSwipe);

            var result = new SwipeResultDto
            {
                IsMatch = false,
                Message = "Swipe kaydedildi."
            };

            // 6) Match yalnızca pozitif niyetli swipe'larda (Like/SuperLike) düşünülür.
            // Pass swipe'ı asla bir match tetikleyemez.
            if (swipeType != SwipeType.Pass)
            {
                var reciprocalSwipe = await _swipeRepository.GetReciprocalPositiveSwipeAsync(senderId, request.ReceiverId);

                if (reciprocalSwipe != null)
                {
                    // Sender'ın profili de tracking ile yüklenmeli ki MatchesCount değişikliği
                    // change-tracker tarafından yakalansın. Aynı DbContext üzerinde iki farklı
                    // kullanıcının profili tracking ile yüklenebilir; çakışma yaşanmaz.
                    var sender = await _userRepository.GetUserWithProfileAsync(senderId, tracking: true);
                    if (sender?.Profile == null)
                        throw new NotFoundException("Kullanıcı profili bulunamadı.");

                    var newMatch = new UserMatch
                    {
                        User1Id = senderId,
                        User2Id = request.ReceiverId
                    };
                    await _matchRepository.AddAsync(newMatch);

                    sender.Profile.MatchesCount += 1;
                    receiver.Profile.MatchesCount += 1;

                    result.IsMatch = true;
                    result.MatchedUserId = request.ReceiverId;
                    result.Message = "Eşleşme oldu!";
                }
            }

            // 7) Tek SaveChanges: swipe ekleme, match ekleme ve counter artışları
            // EF Core tarafından aynı transaction içinde gönderilir. Bu sayede ya hepsi
            // başarılı olur ya da hiçbiri uygulanmaz (atomik tutarlılık).
            await _swipeRepository.SaveChangesAsync();

            await _cache.RemoveAsync($"feed:{senderId}");

            if (result.IsMatch)
            {
                var matchNotification = new DTOs.Chat.MatchDto
                {
                    MatchId = result.MatchedUserId!,
                    MatchedAt = DateTime.UtcNow,
                    IsNewMatch = true,
                    MatchedUser = null!
                };
                await _notifications.SendMatchAsync(senderId, request.ReceiverId, matchNotification);
            }

            return result;
        }

        public async Task<IReadOnlyList<MatchDto>> GetMyMatchesAsync(string userId)
        {
            var currentUser = await _userRepository.GetUserWithProfileAsync(userId, tracking: false);
            var currentScores = currentUser?.Profile?.FinalScores;

            var matches = await _matchRepository.GetMatchesForUserAsync(userId);

            return matches
                .Select(m =>
                {
                    var other = m.User1Id == userId ? m.User2 : m.User1;
                    var matchedUser = MapToDto(other!);
                    matchedUser.Compatibility = _compatibilityService.Calculate(currentScores, other?.Profile?.FinalScores);
                    return new MatchDto
                    {
                        MatchId = m.Id,
                        MatchedAt = m.MatchedAt,
                        IsNewMatch = m.MatchedAt > DateTime.UtcNow.AddHours(-24),
                        MatchedUser = matchedUser,
                        CompatibilityScore = matchedUser.Compatibility ?? 0,
                        LastMessage = null
                    };
                })
                .ToList();
        }

        private static UserSummaryDto MapToDto(AppUser u) => new()
        {
            Id = u.Id,
            Name = u.Name ?? string.Empty,
            Age = u.Profile?.Age ?? 0,
            Bio = u.Profile?.Bio,
            Budget = u.Profile?.Budget,
            MoveInDate = u.Profile?.MoveInDate,
            Lifestyle = u.Profile?.Lifestyle ?? new List<string>(),
            Photos = u.Profile?.Photos ?? new List<string>(),
            Interests = u.Profile?.Interests ?? new List<string>(),
            Occupation = u.Profile?.Occupation,
            Education = u.Profile?.Education,
            RoomType = u.Profile?.RoomType,
            LookingFor = u.Profile?.LookingFor,
            IsVerified = u.Profile?.IsVerified ?? false,
            LastActive = u.Profile?.LastActive ?? default,
            Cleanliness = u.Profile?.Cleanliness ?? 0,
            SocialLevel = u.Profile?.SocialLevel ?? 0,
            Location = u.Profile?.Location != null
                ? new LocationDto { City = u.Profile.Location.City, Distance = u.Profile.Location.Distance ?? 0 }
                : null
        };
    }
}
