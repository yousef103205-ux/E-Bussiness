CREATE DATABASE OpheliaDb;
GO
USE OpheliaDb;
GO

CREATE TABLE Products (
    Id int NOT NULL PRIMARY KEY,
    Name nvarchar(120) NOT NULL,
    Category nvarchar(60) NOT NULL,
    Material nvarchar(160) NOT NULL,
    ImageUrl nvarchar(260) NOT NULL,
    Description nvarchar(1200) NOT NULL,
    Price decimal(18,2) NOT NULL,
    IsFeatured bit NOT NULL,
    IsRecommended bit NOT NULL
);

CREATE TABLE CartItems (
    Id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SessionId nvarchar(80) NOT NULL,
    ProductId int NOT NULL,
    Quantity int NOT NULL,
    Material nvarchar(160) NOT NULL,
    CreatedAt datetime2 NOT NULL,
    UpdatedAt datetime2 NOT NULL,
    CONSTRAINT FK_CartItems_Products FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE
);

CREATE TABLE Orders (
    Id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    OrderNumber nvarchar(max) NOT NULL,
    SessionId nvarchar(max) NOT NULL,
    CustomerName nvarchar(140) NOT NULL,
    CompanyName nvarchar(140) NOT NULL,
    Phone nvarchar(40) NOT NULL,
    Address nvarchar(260) NOT NULL,
    Country nvarchar(80) NOT NULL,
    Region nvarchar(80) NOT NULL,
    City nvarchar(80) NOT NULL,
    Governorate nvarchar(80) NOT NULL,
    Email nvarchar(180) NOT NULL,
    ReceiptTime nvarchar(80) NOT NULL,
    Location nvarchar(260) NOT NULL,
    PaymentMethod nvarchar(80) NOT NULL,
    Notes nvarchar(1000) NOT NULL,
    Subtotal decimal(18,2) NOT NULL,
    Shipping decimal(18,2) NOT NULL,
    Discount decimal(18,2) NOT NULL,
    Tax decimal(18,2) NOT NULL,
    Total decimal(18,2) NOT NULL,
    CreatedAt datetime2 NOT NULL
);

CREATE TABLE OrderItems (
    Id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    OrderId int NOT NULL,
    ProductId int NOT NULL,
    ProductName nvarchar(120) NOT NULL,
    Material nvarchar(160) NOT NULL,
    ImageUrl nvarchar(260) NOT NULL,
    UnitPrice decimal(18,2) NOT NULL,
    Quantity int NOT NULL,
    LineTotal decimal(18,2) NOT NULL,
    CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id) ON DELETE CASCADE
);

INSERT INTO Products (Id, Name, Category, Material, ImageUrl, Description, Price, IsFeatured, IsRecommended) VALUES
(1, 'Aura Diamond Band', 'Rings', '18k Yellow Gold / Size 6', 'Photos/collection 1.jpg', 'Hand-finished diamond band with polished satin finish.', 1850, 1, 1),
(2, 'Lumina Pearl Drops', 'Earrings', '18k Yellow Gold / Freshwater Pearl', 'Photos/collection 2.jpg', 'Freshwater pearl drops designed to catch the light with every movement.', 920, 1, 1),
(3, 'Celestial Trace Necklace', 'Necklaces', '18k Yellow Gold', 'Photos/collection 3.png', 'A whisper of moonlight, captured for the everyday.', 1450, 1, 0),
(4, 'Nocturne Link Bracelet', 'Bracelets', '18k Yellow Gold', 'Photos/collection 4.jpg', 'A sculptural bracelet with a refined nocturne link silhouette.', 2100, 1, 1),
(5, 'Celestial Hoops', 'Earrings', '18k Yellow Gold', 'Photos/Celestial Hoops.png', 'Lightweight hoops with a celestial-inspired profile.', 890, 0, 1);
GO
