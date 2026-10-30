import { Sequelize } from "sequelize";

// Step 1: Create DB if not exists
const bootstrap = new Sequelize("", "root", "", {
  host: "localhost", dialect: "mysql", logging: false,
});
await bootstrap.query("CREATE DATABASE IF NOT EXISTS individual1_erp;");
await bootstrap.close();

// Step 2: Import all models (order matters for associations)
import { sequelize } from "./models/db.js";
import { User } from "./models/userModel.js";
import { Category } from "./models/Category.js";
import { Product } from "./models/Product.js";
import { Order } from "./models/Order.js";
import { OrderItem } from "./models/OrderItem.js";
import { POSTransaction } from "./models/POSTransaction.js";
import { POSItem } from "./models/POSItem.js";
import { AccountingEntry } from "./models/AccountingEntry.js";
import bcrypt from "bcrypt";

try {
  await sequelize.authenticate();
  console.log("✅ Connected to MySQL.");

  await sequelize.sync({ force: true });
  console.log("✅ All tables created.");

  // Seed admin
  await User.create({
    name: "Admin User", email: "admin@erp.com",
    password: await bcrypt.hash("admin123", 10), role: "admin",
  });

  // Seed cashier
  await User.create({
    name: "Juan Cashier", email: "cashier@erp.com",
    password: await bcrypt.hash("cashier123", 10), role: "cashier",
  });

  // Seed customer
  await User.create({
    name: "Maria Santos", email: "customer@erp.com",
    password: await bcrypt.hash("customer123", 10),
    role: "customer", address: "123 Rizal St, Manila",
  });

  // Seed categories
  const cat1 = await Category.create({ name: "Electronics", description: "Electronic gadgets and devices" });
  const cat2 = await Category.create({ name: "Accessories", description: "Phone and computer accessories" });
  const cat3 = await Category.create({ name: "Stationery", description: "Office and school supplies" });

  // Seed products
  await Product.create({ name: "Wireless Mouse", description: "Ergonomic wireless mouse", price: 850.00, stockQty: 50, categoryId: cat1.id });
  await Product.create({ name: "USB Keyboard", description: "Mechanical USB keyboard", price: 1200.00, stockQty: 30, categoryId: cat1.id });
  await Product.create({ name: "HDMI Cable 2m", description: "High speed HDMI cable", price: 250.00, stockQty: 100, categoryId: cat2.id });
  await Product.create({ name: "Phone Stand", description: "Adjustable phone holder", price: 180.00, stockQty: 75, categoryId: cat2.id });
  await Product.create({ name: "Ballpen Set", description: "Pack of 10 ballpens", price: 55.00, stockQty: 200, categoryId: cat3.id });
  await Product.create({ name: "Notebook A4", description: "80-leaf spiral notebook", price: 75.00, stockQty: 150, categoryId: cat3.id });

  console.log("✅ Sample data seeded.");
  console.log("");
  console.log("🔑 Login Credentials:");
  console.log("   Admin    → admin@erp.com     / admin123");
  console.log("   Cashier  → cashier@erp.com   / cashier123");
  console.log("   Customer → customer@erp.com  / customer123");
  console.log("");
  console.log("🔥 Run: npm run xian   →   http://localhost:3000");
} catch (err) {
  console.error("❌ Migration failed:", err.message);
} finally {
  process.exit();
}
