# Ophelia Online Deployment

## Project Structure

- Frontend: this folder, with `landing-page.html`, `main.js`, `features.js`, CSS files, and `Photos/`.
- Backend API: `Ophelia.Api/`.
- Database: SQL Server used through Entity Framework Core in `Ophelia.Api/Data/OpheliaDbContext.cs`.

## Frontend API Configuration

The frontend reads the API base URL from `config.js`:

```js
window.OPHELIA_CONFIG = {
  apiBaseUrl: "http://localhost:5159/api"
};
```

For Vercel, set `OPHELIA_API_BASE_URL` to your deployed backend API URL ending in `/api`. The build script writes `config.js` during deployment.

## Backend Configuration

Production must provide a SQL Server connection string through environment variables. Use one of these:

- `ConnectionStrings__DefaultConnection`
- `SQLSERVER_CONNECTION_STRING`
- `DATABASE_CONNECTION_STRING`

CORS must allow the deployed frontend URL. Set both:

- `FRONTEND_URL=https://your-vercel-project.vercel.app`
- `CORS_ALLOWED_ORIGINS=https://your-vercel-project.vercel.app`

Local development still works through `appsettings.Development.json` and `launchSettings.json`.

## Database Hosting

Use an online SQL Server database, for example Azure SQL Database, SmarterASP SQL Server, Somee SQL Server, or a managed SQL Server from your hosting provider. Do not use `localhost` in production.

If your local database already contains data, export it from SQL Server Management Studio or Azure Data Studio and import it into the hosted database. Do not delete the local database.

Current options to create the online schema:

1. Run `database.sql` against the online SQL Server database, then deploy the API.
2. Or let the API create and seed the database on first startup through `DbInitializer.SeedAsync` when the hosted database is empty.
3. For a migrations-based workflow, add EF Core migrations and run `dotnet ef database update` with the hosted connection string.

## Local Commands

From `Ophelia.Api/`:

```powershell
dotnet restore
dotnet build
dotnet run
```

Test locally:

```powershell
Invoke-RestMethod http://localhost:5159/health
Invoke-RestMethod http://localhost:5159/api/products
```

From the frontend folder:

```powershell
npm run build
```

Then open `landing-page.html` or serve the folder with any static web server.

## Deploy Frontend To Vercel

1. Push this folder to GitHub.
2. Create a Vercel project from the repository.
3. Set the frontend root directory to this folder.
4. Framework preset: Other.
5. Build command: `npm run build`.
6. Output directory: `.`.
7. Environment variable: `OPHELIA_API_BASE_URL=https://your-backend-domain/api`.
8. Deploy.

Frontend URLs to test:

- `https://your-vercel-project.vercel.app/`
- `https://your-vercel-project.vercel.app/landing-page.html`
- `https://your-vercel-project.vercel.app/add-to-cart.html`
- `https://your-vercel-project.vercel.app/Product%20Description-page.html`

## Deploy Backend To Render

Recommended Render setup: Docker Web Service.

1. Push the project to GitHub.
2. Create a new Render Web Service.
3. Root directory: `Ophelia.Api`.
4. Environment: Docker.
5. Add environment variables:
   - `ASPNETCORE_ENVIRONMENT=Production`
   - `ConnectionStrings__DefaultConnection=Server=tcp:YOUR_SQL_SERVER,1433;Initial Catalog=OpheliaDb;User ID=YOUR_USER;Password=YOUR_PASSWORD;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;`
   - `FRONTEND_URL=https://your-vercel-project.vercel.app`
   - `CORS_ALLOWED_ORIGINS=https://your-vercel-project.vercel.app`
6. Deploy.

Backend URLs to test:

- `https://your-render-service.onrender.com/health`
- `https://your-render-service.onrender.com/api/products`

## Deploy Backend To Railway

1. Create a Railway project from GitHub.
2. Select the backend root directory: `Ophelia.Api`.
3. Use the Dockerfile.
4. Add the same backend environment variables listed above.
5. Deploy.

Test:

- `https://your-railway-domain/health`
- `https://your-railway-domain/api/products`

## Deploy Backend To Azure

Option A: Azure App Service with container.

1. Build and push the Docker image to Azure Container Registry.
2. Create an Azure App Service for Container.
3. Configure the app to use the pushed image.
4. Add the same backend environment variables listed above.
5. Ensure the Azure SQL firewall allows the App Service outbound connection.

Option B: Azure App Service native .NET if .NET 10 is available in your region.

1. Publish from `Ophelia.Api`.
2. Configure App Settings with the same environment variables.
3. Deploy the published API.

## Final Connection Steps

1. Deploy the backend first.
2. Copy the backend URL, for example `https://your-api-host.com`.
3. In Vercel, set `OPHELIA_API_BASE_URL=https://your-api-host.com/api`.
4. In the backend host, set `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` to your Vercel URL.
5. Redeploy both if needed.

## Online Checklist

- Frontend `/` opens the existing landing page.
- Desktop layout matches the local version.
- Mobile layout matches the local version.
- Browser DevTools Network tab shows API calls going to the deployed backend, not localhost.
- `GET /health` returns `{ "status": "ok" }`.
- `GET /api/products` returns product data.
- Product cards load data.
- Add to cart works.
- Cart quantity update/remove works.
- Checkout creates an order.
- Success page loads after checkout.
- No CORS errors appear in the browser console.