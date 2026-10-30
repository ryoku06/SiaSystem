import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";
import { User } from "./userModel.js";

export const Order = sequelize.define("Order", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  totalAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  status: {
    type: DataTypes.ENUM("PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"),
    defaultValue: "PENDING",
  },
  paymentMethod: { type: DataTypes.STRING, defaultValue: "cash" },
  notes: { type: DataTypes.TEXT, defaultValue: "" },
});

Order.belongsTo(User, { foreignKey: "customerId", as: "customer" });
User.hasMany(Order, { foreignKey: "customerId", as: "orders" });
