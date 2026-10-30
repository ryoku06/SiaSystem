import { Sequelize } from "sequelize";

export const sequelize = new Sequelize("individual1_erp", "root", "", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
});
