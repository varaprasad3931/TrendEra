const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const User = require("./models/User");
const Category = require("./models/Category");
const Product = require("./models/Product");

dotenv.config();

const categoriesData = [
  { name: "fashion", description: "Trending apparel and clothing styles" },
  { name: "mobiles", description: "Smartphones and mobile technology" },
  { name: "electronics", description: "Computers, cameras, and general electronics" },
  { name: "beauty", description: "Cosmetics, skincare, and personal care products" },
  { name: "shoes", description: "Footwear for sport, leisure, and formal wear" },
  { name: "accessories", description: "Bags, watches, jewelry, and more" }
];

const Review = require("./models/Review");

const generateProducts = (categoriesMap) => {
    const products = [];
    
    // Original curated products with galleries, videos, and features
    products.push(
        { 
            name: "Nike Running Shoes", 
            description: "High-performance running shoes designed for ultimate comfort and durability. Featuring advanced responsive cushioning and premium breathable mesh, they are built for both professional runners and casual wear.", 
            price: 2999, 
            image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600",
            images: [
                "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600",
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
                "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600",
                "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=600"
            ],
            videos: [
                "https://assets.mixkit.co/videos/preview/mixkit-running-shoes-in-slow-motion-40337-large.mp4"
            ],
            features: ["Breathable mesh upper", "Responsive foam midsole", "Durable rubber outsole", "Lightweight design"],
            specifications: [
                { group: "General", name: "Brand", value: "Nike" },
                { group: "General", name: "Type", value: "Running Shoes" },
                { group: "General", name: "Color", value: "Red/Black/White" },
                { group: "Product Details", name: "Outer Material", value: "Premium Mesh" },
                { group: "Product Details", name: "Sole Material", value: "Durable Rubber" },
                { group: "Product Details", name: "Closure", value: "Lace-Up" },
                { group: "Product Details", name: "Weight", value: "280g (Single Shoe)" },
                { group: "Warranty", name: "Warranty Summary", value: "1 Year Brand Warranty against Manufacturing Defects" }
            ],
            category: categoriesMap["shoes"], stock: 15, averageRating: 4.5 
        },
        { 
            name: "iPhone 15 Pro", 
            description: "The latest Apple iPhone featuring a titanium design, powerful A17 Pro chip, custom Action button, and a pro-class camera system. Elevate your photography and gaming experiences to professional levels.", 
            price: 79999, 
            image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600",
            images: [
                "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600",
                "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=600",
                "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600",
                "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600"
            ],
            videos: [
                "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-smartphone-42231-large.mp4"
            ],
            features: ["A17 Pro chip with 6-core GPU", "Titanium design with Ceramic Shield front", "48MP Main camera with advanced lenses", "USB-C connector with USB 3 speeds"],
            specifications: [
                { group: "General", name: "Brand", value: "Apple" },
                { group: "General", name: "Model Name", value: "iPhone 15 Pro" },
                { group: "General", name: "Color", value: "Natural Titanium" },
                { group: "General", name: "SIM Type", value: "Dual SIM (nano-SIM and eSIM)" },
                { group: "Display Features", name: "Display Size", value: "15.49 cm (6.1 inch)" },
                { group: "Display Features", name: "Resolution", value: "2556 x 1179 Pixels" },
                { group: "Display Features", name: "Resolution Type", value: "Super Retina XDR Display" },
                { group: "OS & Processor Features", name: "Operating System", value: "iOS 17" },
                { group: "OS & Processor Features", name: "Processor Type", value: "A17 Pro Chip" },
                { group: "OS & Processor Features", name: "Processor Core", value: "Hexa Core" },
                { group: "Memory & Storage Features", name: "Internal Storage", value: "128 GB" },
                { group: "Memory & Storage Features", name: "RAM", value: "8 GB" },
                { group: "Camera Features", name: "Primary Camera", value: "48MP + 12MP + 12MP" },
                { group: "Camera Features", name: "Secondary Camera", value: "12MP Front Camera" },
                { group: "Warranty", name: "Warranty Summary", value: "1 Year Brand Warranty for Phone and 6 Months for Accessories" }
            ],
            category: categoriesMap["mobiles"], stock: 8, averageRating: 4.8 
        },
        { 
            name: "Smart Watch Elite", 
            description: "Monitor your fitness, heart rate, and notifications on the go. Equipped with built-in GPS, premium sports tracking, and an elegant AMOLED screen that shines bright even in direct sunlight.", 
            price: 2999, 
            image: "https://www.leafstudios.in/cdn/shop/files/1_1099cd20-7237-4bdf-a180-b7126de5ef3d_800x.png?v=1722230645",
            images: [
                "https://www.leafstudios.in/cdn/shop/files/1_1099cd20-7237-4bdf-a180-b7126de5ef3d_800x.png?v=1722230645",
                "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600",
                "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600"
            ],
            videos: [
                "https://assets.mixkit.co/videos/preview/mixkit-smartwatch-on-a-mans-wrist-42247-large.mp4"
            ],
            features: ["1.4-inch AMOLED display", "Built-in GPS tracking", "Heart rate & sleep monitoring", "5ATM water resistance", "Up to 14 days battery life"],
            specifications: [
                { group: "General", name: "Brand", value: "SmartEra" },
                { group: "General", name: "Model Name", value: "Watch Elite 2" },
                { group: "General", name: "Color", value: "Space Black" },
                { group: "General", name: "Dial Shape", value: "Square" },
                { group: "Display Features", name: "Display Size", value: "3.56 cm (1.4 inch)" },
                { group: "Display Features", name: "Resolution", value: "454 x 454 Pixels" },
                { group: "Display Features", name: "Display Type", value: "AMOLED" },
                { group: "Battery & Connectivity", name: "Battery Life", value: "Up to 14 Days" },
                { group: "Battery & Connectivity", name: "Bluetooth Version", value: "v5.2" },
                { group: "Battery & Connectivity", name: "GPS", value: "Built-in GPS" },
                { group: "Sensors", name: "Heart Rate Monitor", value: "Yes" },
                { group: "Sensors", name: "SpO2 Sensor", value: "Yes" },
                { group: "Warranty", name: "Warranty Summary", value: "1 Year Manufacturer Warranty" }
            ],
            category: categoriesMap["accessories"], stock: 20, averageRating: 4.6 
        }
    );

    // Generate remaining 60 products dynamically with features and image galleries
    const brands = {
        mobiles: ["OnePlus", "Xiaomi", "Motorola", "Oppo", "Vivo", "Realme"],
        shoes: ["Reebok", "Asics", "New Balance", "Under Armour", "Skechers"],
        electronics: ["Sony", "LG", "Dell", "HP", "Lenovo", "Asus"],
        fashion: ["Zara", "H&M", "Levi's", "Tommy Hilfiger", "Calvin Klein"],
        beauty: ["L'Oreal", "MAC", "Estee Lauder", "Clinique", "Maybelline"],
        accessories: ["Fossil", "Ray-Ban", "Oakley", "Casio", "Samsonite"]
    };
    
    // Arrays of fallback images by category to act as a gallery
    const imageMap = {
        mobiles: [
            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600",
            "https://images.unsplash.com/photo-1598327105666-5b89351cb31b?w=600",
            "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600"
        ],
        shoes: [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
            "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600",
            "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=600"
        ],
        electronics: [
            "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600",
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600",
            "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600"
        ],
        fashion: [
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
            "https://images.unsplash.com/photo-1489987707023-af82705b7668?w=600",
            "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600"
        ],
        beauty: [
            "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=600",
            "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600",
            "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600"
        ],
        accessories: [
            "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=600",
            "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600",
            "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600"
        ]
    };

    const categories = Object.keys(brands);
    
    for (let i = 1; i <= 60; i++) {
        const catName = categories[i % categories.length];
        const brandList = brands[catName];
        const brand = brandList[i % brandList.length];
        
        products.push({
            name: `${brand} Premium Item ${i}`,
            description: `High quality ${catName} product from ${brand}. Features amazing durability and premium finish. Built to meet the highest standards of the industry.`,
            price: Math.floor(Math.random() * 5000) + 499,
            image: imageMap[catName][0],
            images: imageMap[catName],
            features: [
                "Premium Build Quality",
                "1 Year Brand Warranty",
                "7 Days Replacement Policy",
                "Cash on Delivery Available",
                `${brand} Authentic Original`
            ],
            category: categoriesMap[catName],
            stock: Math.floor(Math.random() * 50) + 10,
            averageRating: (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1)
        });
    }

    return products;
};

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/trendera";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for Seeding");

    // Clear existing data
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await Review.deleteMany();
    console.log("Cleared old database records");

    // Seed Users
    const adminPassword = await bcrypt.hash("admin123", 10);
    const userPassword = await bcrypt.hash("user123", 10);

    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@trendera.com",
      password: adminPassword,
      role: "admin"
    });

    const standardUser = await User.create({
      name: "John Doe",
      email: "john@trendera.com",
      password: userPassword,
      role: "user"
    });

    console.log(`Created admin account: ${adminUser.email}`);
    console.log(`Created test user account: ${standardUser.email}`);

    // Seed Categories
    const seededCategories = await Category.insertMany(categoriesData);
    console.log(`Seeded ${seededCategories.length} categories`);

    // Create category map of name -> ID
    const categoriesMap = {};
    seededCategories.forEach((cat) => {
      categoriesMap[cat.name] = cat._id;
    });

    // Seed Products
    const productsData = generateProducts(categoriesMap);
    const seededProducts = await Product.insertMany(productsData);
    console.log(`Seeded ${seededProducts.length} products with multiple images and features!`);

    // Seed Reviews
    const shoesProduct = seededProducts.find(p => p.name === "Nike Running Shoes");
    const iphoneProduct = seededProducts.find(p => p.name === "iPhone 15 Pro");
    const watchProduct = seededProducts.find(p => p.name === "Smart Watch Elite");

    if (shoesProduct && iphoneProduct && watchProduct) {
      await Review.insertMany([
        {
          user: standardUser._id,
          product: shoesProduct._id,
          rating: 5,
          comment: "Super comfortable running shoes. Worth every rupee! The cushioning is fantastic."
        },
        {
          user: adminUser._id,
          product: shoesProduct._id,
          rating: 4,
          comment: "Excellent design and grip. Breathability is good for long sessions."
        },
        {
          user: standardUser._id,
          product: iphoneProduct._id,
          rating: 5,
          comment: "Breathtaking speed and display. Titanium finish feels very premium and light."
        },
        {
          user: adminUser._id,
          product: iphoneProduct._id,
          rating: 5,
          comment: "Incredible camera quality. The zoom works beautifully and night mode is stunning."
        },
        {
          user: standardUser._id,
          product: watchProduct._id,
          rating: 4,
          comment: "Great smart watch. Battery lasts almost 2 weeks, GPS is very accurate."
        }
      ]);
      console.log("Seeded mock reviews!");
    }

    console.log("Database Seeding Completed Successfully! 🌟");
    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seedDB();
