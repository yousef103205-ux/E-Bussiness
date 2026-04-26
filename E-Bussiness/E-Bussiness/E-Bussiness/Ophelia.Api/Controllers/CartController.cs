using Microsoft.AspNetCore.Mvc;
using Ophelia.Api.Dtos;
using Ophelia.Api.Services;

namespace Ophelia.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CartController : ControllerBase
{
    private readonly ICartService _cart;

    public CartController(ICartService cart) => _cart = cart;

    [HttpGet]
    public async Task<IActionResult> GetCart([FromQuery] string? sessionId, CancellationToken cancellationToken) =>
        Ok(await _cart.GetCartAsync(CartService.NormalizeSessionId(sessionId), cancellationToken));

    [HttpPost("items")]
    public async Task<IActionResult> AddItem(AddCartItemRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _cart.AddItemAsync(request, cancellationToken));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("items/{itemId:int}")]
    public async Task<IActionResult> UpdateItem(int itemId, UpdateCartItemRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _cart.UpdateItemAsync(itemId, request, cancellationToken));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("items/{itemId:int}")]
    public async Task<IActionResult> RemoveItem(int itemId, [FromQuery] string? sessionId, CancellationToken cancellationToken) =>
        Ok(await _cart.RemoveItemAsync(itemId, CartService.NormalizeSessionId(sessionId), cancellationToken));

    [HttpDelete]
    public async Task<IActionResult> Clear([FromQuery] string? sessionId, CancellationToken cancellationToken)
    {
        await _cart.ClearCartAsync(CartService.NormalizeSessionId(sessionId), cancellationToken);
        return NoContent();
    }
}
