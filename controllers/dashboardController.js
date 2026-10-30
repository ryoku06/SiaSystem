import { Order } from "../models/Order.js";
import { POSTransaction } from "../models/POSTransaction.js";
import { AccountingEntry } from "../models/AccountingEntry.js";
import { Product } from "../models/Product.js";
import { User } from "../models/userModel.js";
import { sequelize } from "../models/db.js";

export const dashboardPage = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  try {
    const totalOrders = await Order.count();
    const totalPOS = await POSTransaction.count({ where: { status: "COMPLETED" } });
    const totalProducts = await Product.count({ where: { isActive: true } });
    const totalUsers = await User.count();

    const salesResult = await AccountingEntry.findAll({
      attributes: [[sequelize.fn("SUM", sequelize.col("amount")), "total"]],
      where: { entryType: "CREDIT" },
    });
    const totalSales = parseFloat(salesResult[0]?.dataValues?.total || 0).toFixed(2);

    const lowStock = await Product.findAll({ where: { isActive: true }, order: [["stockQty", "ASC"]], limit: 5 });
    const recentOrders = await Order.findAll({
      include: [{ model: User, as: "customer", attributes: ["name"] }],
      order: [["createdAt", "DESC"]], limit: 5,
    });

    const lowStockRows = lowStock.map(p => `<tr>
      <td class="p-2">${p.name}</td>
      <td class="p-2"><span class="badge ${p.stockQty <= 5 ? "badge-danger" : "badge-warning"}">${p.stockQty}</span></td>
    </tr>`).join("") || `<tr><td colspan="2" class="p-3 text-center text-gray-400 text-xs">No products</td></tr>`;

    const recentOrderRows = recentOrders.map(o => `<tr>
      <td class="p-2">#${o.id}</td>
      <td class="p-2">${o.customer?.name || "N/A"}</td>
      <td class="p-2">₱${parseFloat(o.totalAmount).toFixed(2)}</td>
      <td class="p-2"><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
    </tr>`).join("") || `<tr><td colspan="4" class="p-3 text-center text-gray-400 text-xs">No orders yet</td></tr>`;

    const role = req.session.userRole;
    res.render("dashboard", {
      title: "Dashboard",
      pageTitle: "Dashboard",
      userName: req.session.userName,
      userRole: role,
      userInitial: req.session.userName ? req.session.userName[0].toUpperCase() : "U",
      isDashboard: true,
      isAdmin: role === "admin",
      isCashierOrAdmin: role === "admin" || role === "cashier",
      totalOrders, totalPOS, totalProducts, totalUsers, totalSales,
      lowStockRows, recentOrderRows,
    });
  } catch (err) {
    res.send("Error loading dashboard: " + err.message);
  }
};
