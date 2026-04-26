using Microsoft.EntityFrameworkCore;
using Ophelia.Api.Models;

namespace Ophelia.Api.Data;

public class OpheliaDbContext : DbContext
{
    public OpheliaDbContext(DbContextOptions<OpheliaDbContext> options) : base(options)
    {
    }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(entity =>
        {
            entity.Property(p => p.Name).HasMaxLength(120).IsRequired();
            entity.Property(p => p.Category).HasMaxLength(60).IsRequired();
            entity.Property(p => p.Material).HasMaxLength(160);
            entity.Property(p => p.ImageUrl).HasMaxLength(260).IsRequired();
            entity.Property(p => p.Description).HasMaxLength(1200);
            entity.Property(p => p.Price).HasPrecision(18, 2);
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.Property(c => c.SessionId).HasMaxLength(80).IsRequired();
            entity.Property(c => c.Material).HasMaxLength(160);
            entity.HasOne(c => c.Product).WithMany().HasForeignKey(c => c.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.Property(o => o.CustomerName).HasMaxLength(140).IsRequired();
            entity.Property(o => o.CompanyName).HasMaxLength(140);
            entity.Property(o => o.Phone).HasMaxLength(40).IsRequired();
            entity.Property(o => o.Address).HasMaxLength(260).IsRequired();
            entity.Property(o => o.Country).HasMaxLength(80);
            entity.Property(o => o.Region).HasMaxLength(80);
            entity.Property(o => o.City).HasMaxLength(80);
            entity.Property(o => o.Governorate).HasMaxLength(80);
            entity.Property(o => o.Email).HasMaxLength(180);
            entity.Property(o => o.ReceiptTime).HasMaxLength(80);
            entity.Property(o => o.Location).HasMaxLength(260);
            entity.Property(o => o.PaymentMethod).HasMaxLength(80).IsRequired();
            entity.Property(o => o.Notes).HasMaxLength(1000);
            entity.Property(o => o.Subtotal).HasPrecision(18, 2);
            entity.Property(o => o.Shipping).HasPrecision(18, 2);
            entity.Property(o => o.Discount).HasPrecision(18, 2);
            entity.Property(o => o.Tax).HasPrecision(18, 2);
            entity.Property(o => o.Total).HasPrecision(18, 2);
            entity.HasMany(o => o.Items).WithOne(i => i.Order).HasForeignKey(i => i.OrderId);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.Property(i => i.ProductName).HasMaxLength(120).IsRequired();
            entity.Property(i => i.Material).HasMaxLength(160);
            entity.Property(i => i.ImageUrl).HasMaxLength(260);
            entity.Property(i => i.UnitPrice).HasPrecision(18, 2);
            entity.Property(i => i.LineTotal).HasPrecision(18, 2);
        });
    }
}

