using System.Reflection;
using System.Text;
using System.Text.Json.Serialization;
using AspNetCoreRateLimit;
using Serilog;
using EvArkadasimV2.API.Middleware;
using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Application.Options;

using EvArkadasimV2.Application.Services;
using EvArkadasimV2.Domain.Entities;
using EvArkadasimV2.Infrastructure.Data;
using EvArkadasimV2.Infrastructure.Repositories;
using EvArkadasimV2.Infrastructure.Services;
using EvArkadasimV2.API.Hubs;
using EvArkadasimV2.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(new ConfigurationBuilder()
        .AddJsonFile("appsettings.json")
        .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true)
        .AddEnvironmentVariables()
        .Build())
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}")
    .WriteTo.File("logs/api-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 7,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}")
    .CreateBootstrapLogger();

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((ctx, services, config) => config
    .ReadFrom.Configuration(ctx.Configuration)
    .ReadFrom.Services(services)
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}")
    .WriteTo.File("logs/api-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 7,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}"));

// --- VERİTABANI ---
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")!,
        b => b.MigrationsAssembly("EvArkadasimV2.Infrastructure")));

// --- KİMLİK SİSTEMİ ---
builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// --- YAPILANDIRMA ---
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));

// --- JWT KİMLİK DOĞRULAMA ---
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()!;
var secretKey = Encoding.UTF8.GetBytes(jwtSettings.Secret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(secretKey)
    };
    // WebSocket handshake'de header gönderilemez — SignalR token'ı query string'den alır.
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var token = context.Request.Query["access_token"];
            if (!string.IsNullOrEmpty(token) &&
                context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                context.Token = token;
            return Task.CompletedTask;
        }
    };
});

// --- BAĞIMLILIK ENJEKSİYONU ---
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ISwipeRepository, SwipeRepository>();
builder.Services.AddScoped<IMatchRepository, MatchRepository>();
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<ITestService, TestService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ISwipeService, SwipeService>();
builder.Services.AddScoped<IFeedService, FeedService>();
builder.Services.AddScoped<ICompatibilityService, CompatibilityService>();
builder.Services.AddScoped<IPropertyRepository, PropertyRepository>();
builder.Services.AddScoped<IPropertyService, PropertyService>();
builder.Services.AddScoped<IMessageRepository, MessageRepository>();
builder.Services.AddScoped<IMessageService, MessageService>();

// --- API ARAÇLARI ---
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Ev Arkadaşım API",
        Version = "v1",
        Description =
            "Ev arkadaşı eşleştirme platformu REST API'si.\n\n" +
            "**Kimlik doğrulama:** `POST /api/auth/login` ile JWT token alın, " +
            "sağ üstteki **Authorize** butonuna token değerini girin.",
        Contact = new OpenApiContact
        {
            Name = "Ahmet Kale",
            Email = "ahmetkale1248.ak@gmail.com"
        }
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "JWT token'ınızı giriniz. 'Bearer ' öneki otomatik eklenir."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement {
        {
            new OpenApiSecurityScheme {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });

    var xmlPath = Path.Combine(AppContext.BaseDirectory,
        $"{Assembly.GetExecutingAssembly().GetName().Name}.xml");
    c.IncludeXmlComments(xmlPath);
});

// --- SIGNALR ---
builder.Services.AddSignalR();
builder.Services.AddScoped<INotificationService, SignalRNotificationService>();

// --- REDIS CACHE ---
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "EvArkadasim:";
});
builder.Services.AddScoped<ICacheService, RedisCacheService>();

// --- RATE LIMITING ---
builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
builder.Services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();
builder.Services.AddInMemoryRateLimiting();

// --- HEALTH CHECK ---
builder.Services.AddHealthChecks();

// --- CORS ---
// Geliştirme: her kaynağa açık (emülatör ve yerel tarayıcı testleri için).
// Üretim: yalnızca kendi domain'ine izin ver. AllowAnyOrigin() production'da
// CSRF saldırılarına karşı ek savunma katmanını devre dışı bırakır.
builder.Services.AddCors(options =>
{
    options.AddPolicy("Development", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

    var allowedOrigins = builder.Configuration
        .GetSection("Cors:AllowedOrigins")
        .Get<string[]>() ?? Array.Empty<string>();

    options.AddPolicy("Production", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader());
});

var app = builder.Build();

// --- MIGRATION + SEEDING ---
{
    using var scope = app.Services.CreateScope();
    var sp = scope.ServiceProvider;

    var db = sp.GetRequiredService<EvArkadasimV2.Infrastructure.Data.AppDbContext>();
    await db.Database.MigrateAsync();

    if (app.Environment.IsDevelopment())
        await EvArkadasimV2.Infrastructure.Data.DataSeeder.SeedAsync(sp);
}

// --- MIDDLEWARE PIPELINE ---
// Pipeline'ın en dışunda: tüm katmanlardan fırlayan exception'ları yakalar.
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "{RequestMethod} {RequestPath} → {StatusCode} ({Elapsed:0.0}ms)";
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Ev Arkadaşım API v1");
        c.DisplayRequestDuration();
        c.DefaultModelsExpandDepth(1);
    });
    app.UseCors("Development");
}
else
{
    app.UseHsts();
    app.UseCors("Production");
}

if (!app.Environment.IsDevelopment())
    app.UseIpRateLimiting();

if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();
app.UseAuthentication();
// UseAuthentication sonrası, UseAuthorization öncesi: revoke edilmiş token [Authorize]'a ulaşmadan 401 alır.
app.UseMiddleware<TokenRevocationMiddleware>();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");
app.MapHealthChecks("/health");

app.Run();
