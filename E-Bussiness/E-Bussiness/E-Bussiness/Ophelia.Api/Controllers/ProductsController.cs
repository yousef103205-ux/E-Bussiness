using Microsoft.AspNetCore.Mvc;
using Ophelia.Api.Services;

namespace Ophelia.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _products;

    public ProductsController(IProductService products) => _products = products;

    [HttpGet]
    public async Task<IActionResult> GetProducts(CancellationToken cancellationToken) =>
        Ok(await _products.GetProductsAsync(cancellationToken));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetProduct(int id, CancellationToken cancellationToken)
    {
        var product = await _products.GetProductAsync(id, cancellationToken);
        return product is null ? NotFound() : Ok(product);
    }
}
