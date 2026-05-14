using EvArkadasimV2.Application.DTOs.Property;
using EvArkadasimV2.Application.Exceptions;
using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Application.Services;
using EvArkadasimV2.Domain.Entities;
using EvArkadasimV2.Domain.Enums;
using Moq;
using Xunit;

namespace EvArkadasimV2.Tests
{
    // PropertyService: ilan CRUD, harita pinleri, cache invalidation ve LookingFor iş kurallarını test eder.
    public class PropertyServiceTests
    {
        private readonly Mock<IPropertyRepository> _propertyRepo = new();
        private readonly Mock<IUserRepository> _userRepo = new();
        private readonly Mock<ICacheService> _cache = new();
        private readonly PropertyService _sut;

        public PropertyServiceTests()
        {
            _cache.Setup(c => c.RemoveAsync(It.IsAny<string>())).Returns(Task.CompletedTask);
            _propertyRepo.Setup(r => r.SaveChangesAsync()).ReturnsAsync(true);
            _userRepo.Setup(r => r.SaveChangesAsync()).ReturnsAsync(true);
            _sut = new PropertyService(_propertyRepo.Object, _userRepo.Object, _cache.Object);
        }

        private static Property MakeProperty(int id, string ownerId, string location = "İstanbul, Beşiktaş") => new()
        {
            Id = id,
            Title = "Test Property",
            PriceAmount = 1000,
            Currency = "₺",
            PricePeriod = "ay",
            Location = location,
            PropertyType = PropertyType.Apartment,
            OwnerId = ownerId,
            Owner = new AppUser { Id = ownerId, Name = "Owner" }
        };

        private static CreatePropertyDto MakeCreateDto() => new()
        {
            Title = "Test Property",
            PriceAmount = 1000,
            Currency = "₺",
            PricePeriod = "ay",
            Location = "İstanbul, Beşiktaş",
            PropertyType = PropertyType.Apartment,
            AvailableFrom = DateTime.UtcNow,
        };

        private static UpdatePropertyDto MakeUpdateDto(string title = "Updated") => new()
        {
            Title = title,
            Location = "Ankara, Çankaya",
            PriceAmount = 1500,
            Currency = "₺",
            PricePeriod = "ay",
            AvailableFrom = DateTime.UtcNow,
        };

        // --- GetByIdAsync ---

        // Var olmayan ilan → NotFoundException
        [Fact]
        public async Task GetByIdAsync_NotFound_ThrowsNotFoundException()
        {
            _propertyRepo.Setup(r => r.GetByIdWithOwnerAsync(99)).ReturnsAsync((Property?)null);

            await Assert.ThrowsAsync<NotFoundException>(() => _sut.GetByIdAsync(99));
        }

        // --- GetListAsync ---

        // Negatif skip → 0 olarak ele alınmalı, hata fırlatmamalı
        [Fact]
        public async Task GetListAsync_NegativeSkip_TreatedAsZero()
        {
            _propertyRepo.Setup(r => r.GetFilteredAsync(null, null, null, null, null, 0, 20))
                         .ReturnsAsync(new List<Property>());

            var result = await _sut.GetListAsync(null, null, null, null, null, -5, 20);

            Assert.Empty(result);
            _propertyRepo.Verify(r => r.GetFilteredAsync(null, null, null, null, null, 0, 20), Times.Once);
        }

        // take > 50 → MaxTake=50 ile clamp edilmeli (DoS koruması)
        [Fact]
        public async Task GetListAsync_TakeOver50_ClampsTo50()
        {
            _propertyRepo.Setup(r => r.GetFilteredAsync(null, null, null, null, null, 0, 50))
                         .ReturnsAsync(new List<Property>());

            await _sut.GetListAsync(null, null, null, null, null, 0, 200);

            _propertyRepo.Verify(r => r.GetFilteredAsync(null, null, null, null, null, 0, 50), Times.Once);
        }

        // --- CreateAsync ---

        // Happy path: ilan kaydedilmeli ve DTO dönülmeli
        [Fact]
        public async Task CreateAsync_HappyPath_SavesAndReturnsDto()
        {
            var property = MakeProperty(0, "owner1");
            var user = new AppUser { Id = "owner1", Profile = new UserProfile { LookingFor = LookingFor.Roommate } };
            _propertyRepo.Setup(r => r.AddAsync(It.IsAny<Property>())).Returns(Task.CompletedTask);
            _propertyRepo.Setup(r => r.GetByIdWithOwnerAsync(0)).ReturnsAsync(property);
            _userRepo.Setup(r => r.GetUserWithProfileAsync("owner1", It.IsAny<bool>())).ReturnsAsync(user);

            var result = await _sut.CreateAsync("owner1", MakeCreateDto());

            Assert.Equal("Test Property", result.Title);
            _propertyRepo.Verify(r => r.AddAsync(It.IsAny<Property>()), Times.Once);
        }

        // Kullanıcı Room arıyorsa, ilan oluşturulunca LookingFor otomatik Roommate'e çevrilmeli
        [Fact]
        public async Task CreateAsync_LookingForRoom_AutoSetsRoommate()
        {
            var property = MakeProperty(0, "owner1");
            var user = new AppUser { Id = "owner1", Profile = new UserProfile { LookingFor = LookingFor.Room } };
            _propertyRepo.Setup(r => r.AddAsync(It.IsAny<Property>())).Returns(Task.CompletedTask);
            _propertyRepo.Setup(r => r.GetByIdWithOwnerAsync(0)).ReturnsAsync(property);
            _userRepo.Setup(r => r.GetUserWithProfileAsync("owner1", It.IsAny<bool>())).ReturnsAsync(user);

            await _sut.CreateAsync("owner1", MakeCreateDto());

            Assert.Equal(LookingFor.Roommate, user.Profile.LookingFor);
            // Rol değiştiğinde DB'ye yazılmalı
            _userRepo.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        // Kullanıcı zaten Roommate ise profil SaveChanges çağrılmamalı (gereksiz DB yazımı yok)
        [Fact]
        public async Task CreateAsync_AlreadyRoommate_DoesNotSaveUserProfile()
        {
            var property = MakeProperty(0, "owner1");
            var user = new AppUser { Id = "owner1", Profile = new UserProfile { LookingFor = LookingFor.Roommate } };
            _propertyRepo.Setup(r => r.AddAsync(It.IsAny<Property>())).Returns(Task.CompletedTask);
            _propertyRepo.Setup(r => r.GetByIdWithOwnerAsync(0)).ReturnsAsync(property);
            _userRepo.Setup(r => r.GetUserWithProfileAsync("owner1", It.IsAny<bool>())).ReturnsAsync(user);

            await _sut.CreateAsync("owner1", MakeCreateDto());

            _userRepo.Verify(r => r.SaveChangesAsync(), Times.Never);
        }

        // İlan oluşturulunca feed cache invalidate edilmeli
        [Fact]
        public async Task CreateAsync_InvalidatesFeedCache()
        {
            var property = MakeProperty(0, "owner1");
            var user = new AppUser { Id = "owner1", Profile = new UserProfile { LookingFor = LookingFor.Roommate } };
            _propertyRepo.Setup(r => r.AddAsync(It.IsAny<Property>())).Returns(Task.CompletedTask);
            _propertyRepo.Setup(r => r.GetByIdWithOwnerAsync(0)).ReturnsAsync(property);
            _userRepo.Setup(r => r.GetUserWithProfileAsync("owner1", It.IsAny<bool>())).ReturnsAsync(user);

            await _sut.CreateAsync("owner1", MakeCreateDto());

            _cache.Verify(c => c.RemoveAsync("feed:owner1:v2"), Times.Once);
        }

        // --- UpdateAsync ---

        // Bulunamayan ilan → NotFoundException
        [Fact]
        public async Task UpdateAsync_NotFound_ThrowsNotFoundException()
        {
            _propertyRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Property?)null);

            await Assert.ThrowsAsync<NotFoundException>(() =>
                _sut.UpdateAsync(99, "owner1", MakeUpdateDto()));
        }

        // Başkasının ilanını güncelleme → ForbiddenException (IDOR koruması)
        [Fact]
        public async Task UpdateAsync_WrongOwner_ThrowsForbiddenException()
        {
            var property = MakeProperty(1, "owner1");
            _propertyRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(property);

            await Assert.ThrowsAsync<ForbiddenException>(() =>
                _sut.UpdateAsync(1, "attacker", MakeUpdateDto()));
        }

        // Happy path: ilan güncellenmeli, Update çağrılmalı
        [Fact]
        public async Task UpdateAsync_HappyPath_CallsUpdateAndReturnsDto()
        {
            var property = MakeProperty(1, "owner1");
            var updatedProperty = MakeProperty(1, "owner1");
            updatedProperty.Title = "Updated";
            _propertyRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(property);
            _propertyRepo.Setup(r => r.GetByIdWithOwnerAsync(1)).ReturnsAsync(updatedProperty);

            var result = await _sut.UpdateAsync(1, "owner1", MakeUpdateDto("Updated"));

            Assert.Equal("Updated", result.Title);
            _propertyRepo.Verify(r => r.Update(It.IsAny<Property>()), Times.Once);
        }

        // --- DeleteAsync ---

        // Bulunamayan ilan → NotFoundException
        [Fact]
        public async Task DeleteAsync_NotFound_ThrowsNotFoundException()
        {
            _propertyRepo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Property?)null);

            await Assert.ThrowsAsync<NotFoundException>(() =>
                _sut.DeleteAsync(99, "owner1"));
        }

        // Başkasının ilanını silme → ForbiddenException (IDOR koruması)
        [Fact]
        public async Task DeleteAsync_WrongOwner_ThrowsForbiddenException()
        {
            var property = MakeProperty(1, "owner1");
            _propertyRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(property);

            await Assert.ThrowsAsync<ForbiddenException>(() =>
                _sut.DeleteAsync(1, "attacker"));
        }

        // Happy path: Remove çağrılmalı, feed cache invalidate edilmeli
        [Fact]
        public async Task DeleteAsync_HappyPath_RemovesAndInvalidatesCache()
        {
            var property = MakeProperty(1, "owner1");
            _propertyRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(property);

            await _sut.DeleteAsync(1, "owner1");

            _propertyRepo.Verify(r => r.Remove(property), Times.Once);
            _cache.Verify(c => c.RemoveAsync("feed:owner1:v2"), Times.Once);
        }

        // --- DeleteAllByOwnerAsync ---

        // Kullanıcının ilanı yoksa erken dönmeli — DB'ye yazılmamalı
        [Fact]
        public async Task DeleteAllByOwnerAsync_EmptyList_ReturnsEarlyWithoutSave()
        {
            _propertyRepo.Setup(r => r.GetByOwnerAsync("owner1")).ReturnsAsync(new List<Property>());

            await _sut.DeleteAllByOwnerAsync("owner1");

            _propertyRepo.Verify(r => r.SaveChangesAsync(), Times.Never);
            _cache.Verify(c => c.RemoveAsync(It.IsAny<string>()), Times.Never);
        }

        // Birden fazla ilan varsa hepsi silinmeli ve cache invalidate edilmeli
        [Fact]
        public async Task DeleteAllByOwnerAsync_WithProperties_RemovesAllAndInvalidatesCache()
        {
            var properties = new List<Property>
            {
                MakeProperty(1, "owner1"),
                MakeProperty(2, "owner1")
            };
            _propertyRepo.Setup(r => r.GetByOwnerAsync("owner1")).ReturnsAsync(properties);

            await _sut.DeleteAllByOwnerAsync("owner1");

            _propertyRepo.Verify(r => r.Remove(It.IsAny<Property>()), Times.Exactly(2));
            _cache.Verify(c => c.RemoveAsync("feed:owner1:v2"), Times.Once);
        }

        // --- GetMapPinsAsync ---

        // Şehir filtresi yok → koordinatı olan tüm ilanlar dönmeli
        [Fact]
        public async Task GetMapPinsAsync_NoCity_ReturnsAll()
        {
            var p1 = MakeProperty(1, "owner1"); p1.Latitude = 41.0; p1.Longitude = 29.0;
            var p2 = MakeProperty(2, "owner2", "Ankara, Çankaya"); p2.Latitude = 39.9; p2.Longitude = 32.8;
            _propertyRepo.Setup(r => r.GetWithCoordinatesAsync()).ReturnsAsync(new List<Property> { p1, p2 });

            var result = (await _sut.GetMapPinsAsync(null)).ToList();

            Assert.Equal(2, result.Count);
        }

        // Şehir filtresi var → sadece o şehirdeki ilan dönmeli (case-insensitive)
        [Fact]
        public async Task GetMapPinsAsync_WithCity_FiltersCorrectly()
        {
            var istanbul = MakeProperty(1, "owner1", "İstanbul, Beşiktaş");
            istanbul.Latitude = 41.0; istanbul.Longitude = 29.0;

            var ankara = MakeProperty(2, "owner2", "Ankara, Çankaya");
            ankara.Latitude = 39.9; ankara.Longitude = 32.8;

            _propertyRepo.Setup(r => r.GetWithCoordinatesAsync())
                         .ReturnsAsync(new List<Property> { istanbul, ankara });

            var result = (await _sut.GetMapPinsAsync("İstanbul")).ToList();

            Assert.Single(result);
            Assert.Equal(1, result[0].Id);
        }

        // --- GetMyPropertyAsync ---

        // Kullanıcının hiç ilanı yoksa null dönmeli
        [Fact]
        public async Task GetMyPropertyAsync_NoProperty_ReturnsNull()
        {
            var user = new AppUser { Id = "owner1", Properties = new List<Property>() };
            _userRepo.Setup(r => r.GetUserWithProfileAsync("owner1", false)).ReturnsAsync(user);

            var result = await _sut.GetMyPropertyAsync("owner1");

            Assert.Null(result);
        }
    }
}
