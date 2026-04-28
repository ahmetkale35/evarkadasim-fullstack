using EvArkadasimV2.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace EvArkadasimV2.Infrastructure.Data
{
    public class AppDbContext : IdentityDbContext<AppUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<UserProfile> UserProfiles { get; set; }
        public DbSet<Property> Properties { get; set; }
        public DbSet<UserSwipe> UserSwipes { get; set; }
        public DbSet<UserMatch> UserMatches { get; set; }
        public DbSet<Message> Messages { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // --- 1. İLİŞKİLER VE SİLME KURALLARI ---
            builder.Entity<AppUser>()
                .HasOne(u => u.Profile)
                .WithOne(p => p.AppUser)
                .HasForeignKey<UserProfile>(p => p.AppUserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<UserSwipe>()
                .HasOne(s => s.Sender)
                .WithMany()
                .HasForeignKey(s => s.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<UserSwipe>()
                .HasOne(s => s.Receiver)
                .WithMany()
                .HasForeignKey(s => s.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<UserMatch>()
                .HasOne(m => m.User1)
                .WithMany()
                .HasForeignKey(m => m.User1Id)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<UserMatch>()
                .HasOne(m => m.User2)
                .WithMany()
                .HasForeignKey(m => m.User2Id)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Message>()
                .HasOne(m => m.UserMatch)
                .WithMany(u => u.Messages)
                .HasForeignKey(m => m.UserMatchId)
                .OnDelete(DeleteBehavior.Cascade);


            // --- 2. USER PROFILE: JSON DÖNÜŞÜMLERİ ---
            builder.Entity<UserProfile>(entity =>
            {
                // List<string> Dönüşümleri
                entity.Property(e => e.Lifestyle)
                    .HasConversion(v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                                   v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null) ?? new());

                entity.Property(e => e.Photos)
                    .HasConversion(v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                                   v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null) ?? new());

                entity.Property(e => e.Interests)
                    .HasConversion(v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                                   v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null) ?? new());

                // Owned Types (Alt Sınıflar)
                entity.OwnsOne(p => p.Location);
                entity.OwnsOne(p => p.InitialBasicTestResults);
                entity.OwnsOne(p => p.FinalScores);

                // --- DETAYLI TEST SONUÇLARI (KRİTİK DÜZELTME) ---
                entity.OwnsOne(p => p.DetailedTestResults, dtr =>
                {
                    dtr.Property(e => e.DetailedSocialEnergy).HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                        v => JsonSerializer.Deserialize<List<int>>(v, (JsonSerializerOptions)null) ?? new());

                    dtr.Property(e => e.DetailedOrderApproach).HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                        v => JsonSerializer.Deserialize<List<int>>(v, (JsonSerializerOptions)null) ?? new());

                    dtr.Property(e => e.DetailedConflictManagement).HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                        v => JsonSerializer.Deserialize<List<int>>(v, (JsonSerializerOptions)null) ?? new());

                    dtr.Property(e => e.DetailedSharingStyle).HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                        v => JsonSerializer.Deserialize<List<int>>(v, (JsonSerializerOptions)null) ?? new());

                    dtr.Property(e => e.DetailedLifeRhythm).HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                        v => JsonSerializer.Deserialize<List<int>>(v, (JsonSerializerOptions)null) ?? new());

                    // EKSİK OLAN BU ALANI EKLEDİK (Hatayı bu da tetikliyor olabilir):
                    dtr.Property(e => e.DetailedCommunicationStyle).HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                        v => JsonSerializer.Deserialize<List<int>>(v, (JsonSerializerOptions)null) ?? new());
                });
            });

            // --- 3. PROPERTY CONFIGURATION ---
            builder.Entity<Property>(entity =>
            {
                entity.Property(p => p.PriceAmount).HasColumnType("decimal(18,2)");

                entity.Property(e => e.Images).HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                        v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null) ?? new());

                entity.Property(e => e.Amenities).HasConversion(
                        v => JsonSerializer.Serialize(v, (JsonSerializerOptions)null),
                        v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions)null) ?? new());
            });
        }
    }
}