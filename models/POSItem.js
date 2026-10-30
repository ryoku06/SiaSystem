import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";
import { POSTransaction } from "./POSTransaction.js";
import { Product } from "./Product.js";

export const POSItem = sequelize.define("POSItem", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  transactionId: { type: DataTypes.INTEGER, allowNull: false },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
});

POSItem.belongsTo(POSTransaction, { foreignKey: "transactionId", as: "transaction" });
POSTransaction.hasMany(POSItem, { foreignKey: "transactionId", as: "items" });
POSItem.belongsTo(Product, { foreignKey: "productId", as: "product" });
Product.hasMany(POSItem, { foreignKey: "productId", as: "posItems" });
