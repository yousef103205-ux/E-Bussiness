using Microsoft.EntityFrameworkCore;
using Ophelia.Api.Data;
using Ophelia.Api.Services;

var builder = WebApplication.CreateBuilder(args);

var platformPort = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(platformPort) && string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ASPNETCORE_URLS")))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{platformPort}");
}

const string CorsPolicy = "FrontendPolicy";
var allowedOrigins = GetAllowedOrigins(builder.Configuration);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy => policy
        .AllowAnyHeader()
        .AllowAnyMethod()
        .SetIsOriginAllowed(origin => IsAllowedCorsOrigin(origin, allowedOrigins, builder.Environment.IsDevelopment())));
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration["SQLSERVER_CONNECTION_STRING"]
    ?? builder.Configuration["DATABASE_CONNECTION_STRING"];

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("Missing SQL Server connection string. Set ConnectionStrings__DefaultConnection or SQLSERVER_CONNECTION_STRING.");
}

builder.Services.AddDbContext<OpheliaDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IOrderService, OrderService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/", () => Results.Redirect("/health"));
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.UseCors(CorsPolicy);
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<OpheliaDbContext>();
        await DbInitializer.SeedAsync(db);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database initialization failed. Check SQL Server and the DefaultConnection string.");
    }
}

app.Run();

static string[] GetAllowedOrigins(IConfiguration configuration)
{
    var origins = new List<string>();
    var configuredOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
    if (configuredOrigins is not null)
    {
        origins.AddRange(configuredOrigins);
    }

    var frontendUrl = configuration["FRONTEND_URL"];
    if (!string.IsNullOrWhiteSpace(frontendUrl))
    {
        origins.Add(frontendUrl);
    }

    var envOrigins = configuration["CORS_ALLOWED_ORIGINS"];
    if (!string.IsNullOrWhiteSpace(envOrigins))
    {
        origins.AddRange(envOrigins.Split(',', ';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
    }

    return origins
        .Select(NormalizeOrigin)
        .Where(origin => !string.IsNullOrWhiteSpace(origin))
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToArray();
}

static bool IsAllowedCorsOrigin(string? origin, IReadOnlyCollection<string> allowedOrigins, bool isDevelopment)
{
    if (string.IsNullOrWhiteSpace(origin))
    {
        return false;
    }

    var normalizedOrigin = NormalizeOrigin(origin);
    if (allowedOrigins.Contains(normalizedOrigin, StringComparer.OrdinalIgnoreCase))
    {
        return true;
    }

    if (!isDevelopment)
    {
        return false;
    }

    if (string.Equals(normalizedOrigin, "null", StringComparison.OrdinalIgnoreCase))
    {
        return true;
    }

    return Uri.TryCreate(normalizedOrigin, UriKind.Absolute, out var uri)
        && (string.Equals(uri.Host, "localhost", StringComparison.OrdinalIgnoreCase)
            || string.Equals(uri.Host, "127.0.0.1", StringComparison.OrdinalIgnoreCase)
            || string.Equals(uri.Host, "::1", StringComparison.OrdinalIgnoreCase));
}

static string NormalizeOrigin(string origin) => origin.Trim().TrimEnd('/');