import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: {
    type: DataTypes.ENUM("admin", "cashier", "customer"),
    allowNull: false,
    defaultValue: "customer",
  },
  address: { type: DataTypes.TEXT, defaultValue: "" },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

export { sequelize };
