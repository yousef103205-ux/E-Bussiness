using Microsoft.EntityFrameworkCore;
using Ophelia.Api.Data;
using Ophelia.Api.Dtos;
using Ophelia.Api.Models;

namespace Ophelia.Api.Services;

public interface IProductService
{
    Task<IReadOnlyList<ProductDto>> GetProductsAsync(CancellationToken cancellationToken);
    Task<ProductDto?> GetProductAsync(int id, CancellationToken cancellationToken);
}

public class ProductService : IProductService
{
    private readonly OpheliaDbContext _db;

    public ProductService(OpheliaDbContext db) => _db = db;

    public async Task<IReadOnlyList<ProductDto>> GetProductsAsync(CancellationToken cancellationToken) =>
        await _db.Products.AsNoTracking().OrderBy(p => p.Id).Select(p => p.ToDto()).ToListAsync(cancellationToken);

    public async Task<ProductDto?> GetProductAsync(int id, CancellationToken cancellationToken) =>
        await _db.Products.AsNoTracking().Where(p => p.Id == id).Select(p => p.ToDto()).FirstOrDefaultAsync(cancellationToken);
}

public interface ICartService
{
    Task<CartDto> GetCartAsync(string sessionId, CancellationToken cancellationToken);
    Task<CartDto> AddItemAsync(AddCartItemRequest request, CancellationToken cancellationToken);
    Task<CartDto> UpdateItemAsync(int itemId, UpdateCartItemRequest request, CancellationToken cancellationToken);
    Task<CartDto> RemoveItemAsync(int itemId, string sessionId, CancellationToken cancellationToken);
    Task ClearCartAsync(string sessionId, CancellationToken cancellationToken);
}

public class CartService : ICartService
{
    private readonly OpheliaDbContext _db;

    public CartService(OpheliaDbContext db) => _db = db;

    public async Task<CartDto> GetCartAsync(string sessionId, CancellationToken cancellationToken)
    {
        var items = await _db.CartItems.Include(c => c.Product)
            .Where(c => c.SessionId == sessionId)
            .OrderBy(c => c.Id)
            .ToListAsync(cancellationToken);

        return BuildCart(sessionId, items);
    }

    public async Task<CartDto> AddItemAsync(AddCartItemRequest request, CancellationToken cancellationToken)
    {
        var sessionId = NormalizeSessionId(request.SessionId);
        var quantity = Math.Max(1, request.Quantity);
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == request.ProductId, cancellationToken)
            ?? throw new InvalidOperationException("Product not found.");
        var material = string.IsNullOrWhiteSpace(request.Material) ? product.Material : request.Material.Trim();

        var existing = await _db.CartItems.FirstOrDefaultAsync(c =>
            c.SessionId == sessionId && c.ProductId == product.Id && c.Material == material, cancellationToken);

        if (existing is null)
        {
            _db.CartItems.Add(new CartItem
            {
                SessionId = sessionId,
                ProductId = product.Id,
                Quantity = quantity,
                Material = material
            });
        }
        else
        {
            existing.Quantity += quantity;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(cancellationToken);
        return await GetCartAsync(sessionId, cancellationToken);
    }

    public async Task<CartDto> UpdateItemAsync(int itemId, UpdateCartItemRequest request, CancellationToken cancellationToken)
    {
        var sessionId = NormalizeSessionId(request.SessionId);
        var item = await _db.CartItems.FirstOrDefaultAsync(c => c.Id == itemId && c.SessionId == sessionId, cancellationToken)
            ?? throw new InvalidOperationException("Cart item not found.");

        if (request.Quantity <= 0)
        {
            _db.CartItems.Remove(item);
        }
        else
        {
            item.Quantity = request.Quantity;
            item.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(cancellationToken);
        return await GetCartAsync(sessionId, cancellationToken);
    }

    public async Task<CartDto> RemoveItemAsync(int itemId, string sessionId, CancellationToken cancellationToken)
    {
        sessionId = NormalizeSessionId(sessionId);
        var item = await _db.CartItems.FirstOrDefaultAsync(c => c.Id == itemId && c.SessionId == sessionId, cancellationToken);
        if (item is not null)
        {
            _db.CartItems.Remove(item);
            await _db.SaveChangesAsync(cancellationToken);
        }

        return await GetCartAsync(sessionId, cancellationToken);
    }

    public async Task ClearCartAsync(string sessionId, CancellationToken cancellationToken)
    {
        sessionId = NormalizeSessionId(sessionId);
        var items = await _db.CartItems.Where(c => c.SessionId == sessionId).ToListAsync(cancellationToken);
        _db.CartItems.RemoveRange(items);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public static string NormalizeSessionId(string? sessionId) =>
        string.IsNullOrWhiteSpace(sessionId) ? "guest" : sessionId.Trim();

    private static CartDto BuildCart(string sessionId, IReadOnlyList<CartItem> items)
    {
        var cartItems = items.Where(i => i.Product is not null).Select(i => new CartItemDto(
            i.Id,
            i.ProductId,
            i.Product!.Name,
            i.Material,
            i.Product.ImageUrl,
            i.Product.Price,
            i.Quantity,
            i.Product.Price * i.Quantity)).ToList();

        var subtotal = cartItems.Sum(i => i.LineTotal);
        var shipping = subtotal >= 1000 || subtotal == 0 ? 0 : 35;
        var discount = 0m;
        var tax = Math.Round(subtotal * 0.14m, 2);
        var total = subtotal + shipping + tax - discount;

        return new CartDto(sessionId, cartItems, subtotal, shipping, discount, tax, total);
    }
}

public interface IOrderService
{
    Task<OrderDto> CreateOrderAsync(CreateOrderRequest request, CancellationToken cancellationToken);
    Task<OrderDto?> GetOrderAsync(int id, CancellationToken cancellationToken);
}

public class OrderService : IOrderService
{
    private readonly OpheliaDbContext _db;
    private readonly ICartService _cartService;

    public OrderService(OpheliaDbContext db, ICartService cartService)
    {
        _db = db;
        _cartService = cartService;
    }

    public async Task<OrderDto> CreateOrderAsync(CreateOrderRequest request, CancellationToken cancellationToken)
    {
        var sessionId = CartService.NormalizeSessionId(request.SessionId);
        var cart = await _cartService.GetCartAsync(sessionId, cancellationToken);
        if (cart.Items.Count == 0)
        {
            throw new InvalidOperationException("Cart is empty.");
        }

        var order = new Order
        {
            OrderNumber = $"OPH-{DateTime.UtcNow:yyyyMMddHHmmss}",
            SessionId = sessionId,
            CustomerName = request.CustomerName.Trim(),
            CompanyName = request.CompanyName?.Trim() ?? string.Empty,
            Phone = request.Phone.Trim(),
            Address = request.Address.Trim(),
            Country = request.Country?.Trim() ?? string.Empty,
            Region = request.Region?.Trim() ?? string.Empty,
            City = request.City?.Trim() ?? string.Empty,
            Governorate = request.Governorate?.Trim() ?? string.Empty,
            Email = request.Email?.Trim() ?? string.Empty,
            ReceiptTime = request.ReceiptTime?.Trim() ?? string.Empty,
            Location = request.Location?.Trim() ?? string.Empty,
            PaymentMethod = request.PaymentMethod.Trim(),
            Notes = request.Notes?.Trim() ?? string.Empty,
            Subtotal = cart.Subtotal,
            Shipping = cart.Shipping,
            Discount = cart.Discount,
            Tax = cart.Tax,
            Total = cart.Total,
            Items = cart.Items.Select(i => new OrderItem
            {
                ProductId = i.ProductId,
                ProductName = i.Name,
                Material = i.Material,
                ImageUrl = i.ImageUrl,
                UnitPrice = i.UnitPrice,
                Quantity = i.Quantity,
                LineTotal = i.LineTotal
            }).ToList()
        };

        _db.Orders.Add(order);
        await _db.SaveChangesAsync(cancellationToken);
        await _cartService.ClearCartAsync(sessionId, cancellationToken);
        return order.ToDto();
    }

    public async Task<OrderDto?> GetOrderAsync(int id, CancellationToken cancellationToken) =>
        (await _db.Orders.Include(o => o.Items).AsNoTracking().FirstOrDefaultAsync(o => o.Id == id, cancellationToken))?.ToDto();
}

public static class MappingExtensions
{
    public static ProductDto ToDto(this Product p) => new(
        p.Id, p.Name, p.Category, p.Material, p.ImageUrl, p.Description, p.Price, p.IsFeatured, p.IsRecommended);

    public static OrderDto ToDto(this Order o) => new(
        o.Id,
        o.OrderNumber,
        o.Subtotal,
        o.Shipping,
        o.Discount,
        o.Tax,
        o.Total,
        o.CreatedAt,
        o.Items.Select(i => new OrderItemDto(i.ProductId, i.ProductName, i.Material, i.ImageUrl, i.UnitPrice, i.Quantity, i.LineTotal)).ToList());
}
