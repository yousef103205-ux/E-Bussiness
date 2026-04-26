using Microsoft.AspNetCore.Mvc;
using Ophelia.Api.Dtos;
using Ophelia.Api.Services;

namespace Ophelia.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orders;

    public OrdersController(IOrderService orders) => _orders = orders;

    [HttpPost]
    public async Task<IActionResult> CreateOrder(CreateOrderRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.CustomerName) || string.IsNullOrWhiteSpace(request.Phone) || string.IsNullOrWhiteSpace(request.Address))
        {
            return BadRequest(new { message = "Customer name, phone, and address are required." });
        }

        try
        {
            var order = await _orders.CreateOrderAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetOrder(int id, CancellationToken cancellationToken)
    {
        var order = await _orders.GetOrderAsync(id, cancellationToken);
        return order is null ? NotFound() : Ok(order);
    }
}
