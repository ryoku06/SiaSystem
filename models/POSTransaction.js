import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";
import { User } from "./userModel.js";

export const POSTransaction = sequelize.define("POSTransaction", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  cashierId: { type: DataTypes.INTEGER, allowNull: false },
  totalAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  amountPaid: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  change: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  paymentMethod: { type: DataTypes.STRING, defaultValue: "cash" },
  receiptNo: { type: DataTypes.STRING, unique: true },
  status: { type: DataTypes.ENUM("COMPLETED", "VOIDED"), defaultValue: "COMPLETED" },
});

POSTransaction.belongsTo(User, { foreignKey: "cashierId", as: "cashier" });
User.hasMany(POSTransaction, { foreignKey: "cashierId", as: "transactions" });
