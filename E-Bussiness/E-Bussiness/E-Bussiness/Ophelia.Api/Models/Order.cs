namespace Ophelia.Api.Models;

public class Order
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Governorate { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string ReceiptTime { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal Shipping { get; set; }
    public decimal Discount { get; set; }
    public decimal Tax { get; set; }
    public decimal Total { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<OrderItem> Items { get; set; } = new();
}
