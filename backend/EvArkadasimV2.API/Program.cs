using System.Reflection;
using System.Text;
using System.Text.Json.Serialization;
using EvArkadasimV2.Application.Interfaces.Repositories;
using EvArkadasimV2.Application.Interfaces.Services;
using EvArkadasimV2.Application.Options;
using EvArkadasimV2.Application.Services;
using EvArkadasimV2.Domain.Entities;
using EvArkadasimV2.Infrastructure.Data;
using EvArkadasimV2.Infrastructure.Repositories;
using EvArkadasimV2.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// --- VERİTABANI ---
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(
        builder.Configuration.GetConnectionString("DefaultConnection"),
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

// --- YAPILANDIRMA (OPTIONS PATTERN) ---
// IConfiguration yerine strongly-typed JwtSettings: servislere type-safe erişim sağlar.
// Üretim ortamında Secret değeri environment variable veya Azure Key Vault'tan okunur:
//   Linux/Mac: export JwtSettings__Secret="..."
//   Windows:   $env:JwtSettings__Secret="..."
//   Azure:     App Settings → JwtSettings:Secret
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
// JsonStringEnumConverter: enum'ları JSON'da int yerine string olarak serialize/deserialize eder.
// Neden: Frontend (TypeScript) string union tip kullanıyor (örn. "Like" / "Pass"); int değer
// dönersek client tarafında her enum için manuel mapping gerekir. String'ler self-documenting,
// API yüzeyinde versiyon değişikliklerine karşı daha sağlam (yeni enum değer eklemek
// mevcut int sırasını bozma riski taşımaz).
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

    // Http Bearer: Swagger UI "Bearer " önekini otomatik ekler; kullanıcı sadece token'ı girer.
    // ApiKey ile kurulunca kullanıcının "Bearer {token}" yazmasi gerekiyordu.
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

// --- CORS ---
// Geliştirme: her kaynağa açık (emülatör ve yerel tarayıcı testleri için).
// Üretim: yalnızca kendi domain'ine izin ver. AllowAnyOrigin() production'da
// CSRF saldırılarına karşı ek savunma katmanını devre dışı bırakır.
builder.Services.AddCors(options =>
{
    options.AddPolicy("Development", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

    options.AddPolicy("Production", policy =>
        policy.WithOrigins("https://evarkadasim.com")
              .AllowAnyMethod()
              .AllowAnyHeader());
});

var app = builder.Build();

// --- DATA SEEDING (yalnızca Development) ---
// Idempotent: zaten seed kullanıcıları varsa tekrar eklenmez. Üretimde çalışmaz.
// CreateScope: UserManager ve AppDbContext scoped servislerdir; root container'dan
// doğrudan resolve edilemezler, scope açmamız gerekir.
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var sp = scope.ServiceProvider;

    // Auto-migrate: schema her zaman model ile senkron başlasın.
    // Aksi halde eski DB üzerinde çalışırken kolon eksikliği gibi hatalar UserManager.CreateAsync
    // sırasında patlayabilir.
    var db = sp.GetRequiredService<EvArkadasimV2.Infrastructure.Data.AppDbContext>();
    await db.Database.MigrateAsync();

    await EvArkadasimV2.Infrastructure.Data.DataSeeder.SeedAsync(sp);
}

// --- MIDDLEWARE PIPELINE ---
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

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
