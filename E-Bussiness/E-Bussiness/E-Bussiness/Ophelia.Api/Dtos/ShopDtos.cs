namespace Ophelia.Api.Dtos;

public record ProductDto(
    int Id,
    string Name,
    string Category,
    string Material,
    string ImageUrl,
    string Description,
    decimal Price,
    bool IsFeatured,
    bool IsRecommended);

public record CartItemDto(
    int Id,
    int ProductId,
    string Name,
    string Material,
    string ImageUrl,
    decimal UnitPrice,
    int Quantity,
    decimal LineTotal);

public record CartDto(
    string SessionId,
    IReadOnlyList<CartItemDto> Items,
    decimal Subtotal,
    decimal Shipping,
    decimal Discount,
    decimal Tax,
    decimal Total);

public record AddCartItemRequest(int ProductId, int Quantity, string? Material, string? SessionId);
public record UpdateCartItemRequest(int Quantity, string? SessionId);

public record CreateOrderRequest(
    string? SessionId,
    string CustomerName,
    string? CompanyName,
    string Phone,
    string Address,
    string? Country,
    string? Region,
    string? City,
    string? Governorate,
    string? Email,
    string? ReceiptTime,
    string? Location,
    string PaymentMethod,
    string? Notes);

public record OrderItemDto(
    int ProductId,
    string ProductName,
    string Material,
    string ImageUrl,
    decimal UnitPrice,
    int Quantity,
    decimal LineTotal);

public record OrderDto(
    int Id,
    string OrderNumber,
    decimal Subtotal,
    decimal Shipping,
    decimal Discount,
    decimal Tax,
    decimal Total,
    DateTime CreatedAt,
    IReadOnlyList<OrderItemDto> Items);
