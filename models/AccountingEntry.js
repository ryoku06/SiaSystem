import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const AccountingEntry = sequelize.define("AccountingEntry", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  referenceId: { type: DataTypes.INTEGER, allowNull: false },
  referenceType: { type: DataTypes.ENUM("ORDER", "POS", "EXPENSE", "REFUND"), allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  entryType: { type: DataTypes.ENUM("DEBIT", "CREDIT"), allowNull: false },
  description: { type: DataTypes.TEXT, defaultValue: "" },
  entryDate: { type: DataTypes.DATEONLY, allowNull: false },
});
