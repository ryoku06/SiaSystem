import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";
import { Category } from "./Category.js";

export const Product = sequelize.define("Product", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, defaultValue: "" },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  stockQty: { type: DataTypes.INTEGER, defaultValue: 0 },
  imageUrl: { type: DataTypes.STRING, defaultValue: "" },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  categoryId: { type: DataTypes.INTEGER, allowNull: true },
});

Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });
Category.hasMany(Product, { foreignKey: "categoryId", as: "products" });
