using Ophelia.Api.Models;

namespace Ophelia.Api.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(OpheliaDbContext db)
    {
        await db.Database.EnsureCreatedAsync();
        if (db.Products.Any())
        {
            return;
        }

        db.Products.AddRange(
            new Product { Name = "Aura Diamond Band", Category = "Rings", Material = "18k Yellow Gold / Size 6", ImageUrl = "Photos/collection 1.jpg", Description = "Hand-finished diamond band with polished satin finish.", Price = 1850, IsFeatured = true, IsRecommended = true },
            new Product { Name = "Lumina Pearl Drops", Category = "Earrings", Material = "18k Yellow Gold / Freshwater Pearl", ImageUrl = "Photos/collection 2.jpg", Description = "Freshwater pearl drops designed to catch the light with every movement.", Price = 920, IsFeatured = true, IsRecommended = true },
            new Product { Name = "Celestial Trace Necklace", Category = "Necklaces", Material = "18k Yellow Gold", ImageUrl = "Photos/collection 3.png", Description = "A whisper of moonlight, captured for the everyday.", Price = 1450, IsFeatured = true, IsRecommended = false },
            new Product { Name = "Nocturne Link Bracelet", Category = "Bracelets", Material = "18k Yellow Gold", ImageUrl = "Photos/collection 4.jpg", Description = "A sculptural bracelet with a refined nocturne link silhouette.", Price = 2100, IsFeatured = true, IsRecommended = true },
            new Product { Name = "Celestial Hoops", Category = "Earrings", Material = "18k Yellow Gold", ImageUrl = "Photos/Celestial Hoops.png", Description = "Lightweight hoops with a celestial-inspired profile.", Price = 890, IsFeatured = false, IsRecommended = true }
        );

        await db.SaveChangesAsync();
    }
}

