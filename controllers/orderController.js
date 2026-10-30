import { Order } from "../models/Order.js";
import { OrderItem } from "../models/OrderItem.js";
import { Product } from "../models/Product.js";
import { User } from "../models/userModel.js";
import { AccountingEntry } from "../models/AccountingEntry.js";

const base = (req) => ({
  userName: req.session.userName, userRole: req.session.userRole,
  userInitial: req.session.userName ? req.session.userName[0].toUpperCase() : "U",
  isOrders: true,
  isAdmin: req.session.userRole === "admin",
  isCashierOrAdmin: ["admin","cashier"].includes(req.session.userRole),
});

export const orderList = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  try {
    const orders = await Order.findAll({
      include: [{ model: User, as: "customer", attributes: ["name","email"] }],
      order: [["createdAt","DESC"]],
    });
    const rows = orders.map(o => `<tr class="border-b hover:bg-gray-50">
      <td class="p-3">#${o.id}</td>
      <td class="p-3">${o.customer?.name || "N/A"}</td>
      <td class="p-3">₱${parseFloat(o.totalAmount).toFixed(2)}</td>
      <td class="p-3">${o.paymentMethod}</td>
      <td class="p-3"><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
      <td class="p-3">${new Date(o.createdAt).toLocaleDateString()}</td>
      <td class="p-3 flex gap-1 flex-wrap">
        <a href="/orders/${o.id}" class="text-gray-500 hover:underline text-xs">View</a>
        ${o.status==="PENDING" ? `<a href="/orders/${o.id}/confirm" class="text-blue-500 hover:underline text-xs">Confirm</a>` : ""}
        ${o.status==="CONFIRMED" ? `<a href="/orders/${o.id}/ship" class="text-blue-500 hover:underline text-xs">Ship</a>` : ""}
        ${o.status==="SHIPPED" ? `<a href="/orders/${o.id}/deliver" class="text-green-500 hover:underline text-xs">Deliver</a>` : ""}
        ${["PENDING","CONFIRMED"].includes(o.status) ? `<a href="/orders/${o.id}/cancel" class="text-red-500 hover:underline text-xs" onclick="return confirm('Cancel order #${o.id}?')">Cancel</a>` : ""}
      </td>
    </tr>`).join("") || `<tr><td colspan="7" class="p-4 text-center text-gray-400 text-sm">No orders yet.</td></tr>`;
    res.render("orders", { ...base(req), title: "Orders", pageTitle: "Orders", rows });
  } catch (err) { res.send("Error: " + err.message); }
};

export const orderDetail = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: "customer" },
        { model: OrderItem, as: "items", include: [{ model: Product, as: "product" }] },
      ],
    });
    if (!order) return res.redirect("/orders");
    const itemRows = order.items.map(i => `<tr class="border-b">
      <td class="p-3">${i.product?.name || "N/A"}</td>
      <td class="p-3">${i.quantity}</td>
      <td class="p-3">₱${parseFloat(i.unitPrice).toFixed(2)}</td>
      <td class="p-3">₱${(i.quantity * parseFloat(i.unitPrice)).toFixed(2)}</td>
    </tr>`).join("");
    const statusActions = `
      ${order.status==="PENDING" ? `<a href="/orders/${order.id}/confirm" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition">✓ Confirm</a>` : ""}
      ${order.status==="CONFIRMED" ? `<a href="/orders/${order.id}/ship" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition">🚚 Ship</a>` : ""}
      ${order.status==="SHIPPED" ? `<a href="/orders/${order.id}/deliver" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition">📦 Deliver</a>` : ""}
      ${["PENDING","CONFIRMED"].includes(order.status) ? `<a href="/orders/${order.id}/cancel" class="bg-red-100 hover:bg-red-200 text-red-500 px-4 py-2 rounded-lg text-sm transition" onclick="return confirm('Cancel this order?')">✗ Cancel</a>` : ""}
    `;
    res.render("order-detail", {
      ...base(req), title: `Order #${order.id}`, pageTitle: `Order #${order.id}`,
      orderId: order.id, orderStatus: order.status, statusLower: order.status.toLowerCase(),
      customerName: order.customer?.name || "N/A",
      customerEmail: order.customer?.email || "N/A",
      customerAddress: order.customer?.address || "N/A",
      totalAmount: parseFloat(order.totalAmount).toFixed(2),
      paymentMethod: order.paymentMethod,
      orderNotes: order.notes || "—",
      orderDate: new Date(order.createdAt).toLocaleString(),
      itemRows, statusActions,
    });
  } catch (err) { res.send("Error: " + err.message); }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id, action } = req.params;
    const map = { confirm:"CONFIRMED", ship:"SHIPPED", deliver:"DELIVERED", cancel:"CANCELLED" };
    const newStatus = map[action];
    if (!newStatus) return res.redirect("/orders");
    const order = await Order.findByPk(id);
    if (!order) return res.redirect("/orders");
    await order.update({ status: newStatus });
    if (newStatus === "CONFIRMED") {
      await AccountingEntry.create({
        referenceId: order.id, referenceType: "ORDER",
        amount: order.totalAmount, entryType: "CREDIT",
        description: `Online Order #${order.id} confirmed`,
        entryDate: new Date().toISOString().split("T")[0],
      });
    }
    res.redirect("/orders");
  } catch (err) { res.send("Error: " + err.message); }
};

export const placeOrder = async (req, res) => {
  try {
    if (!req.session.userId) return res.json({ success: false, message: "Please login first." });
    const { items, paymentMethod, notes } = req.body;
    const parsedItems = JSON.parse(items);
    let total = 0;
    const orderItems = [];
    for (const item of parsedItems) {
      const product = await Product.findByPk(item.productId);
      if (!product || product.stockQty < item.quantity)
        return res.json({ success: false, message: `Insufficient stock for ${product?.name || "a product"}` });
      total += parseFloat(product.price) * item.quantity;
      orderItems.push({ productId: product.id, quantity: item.quantity, unitPrice: product.price });
    }
    const order = await Order.create({ customerId: req.session.userId, totalAmount: total, paymentMethod: paymentMethod||"cash", notes: notes||"", status: "PENDING" });
    for (const item of orderItems) {
      await OrderItem.create({ orderId: order.id, ...item });
      await Product.decrement("stockQty", { by: item.quantity, where: { id: item.productId } });
    }
    res.json({ success: true, orderId: order.id, total: total.toFixed(2) });
  } catch (err) { res.json({ success: false, message: err.message }); }
};
