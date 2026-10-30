import { POSTransaction } from "../models/POSTransaction.js";
import { POSItem } from "../models/POSItem.js";
import { Product } from "../models/Product.js";
import { AccountingEntry } from "../models/AccountingEntry.js";
import { Category } from "../models/Category.js";

const base = (req, active) => ({
  userName: req.session.userName, userRole: req.session.userRole,
  userInitial: req.session.userName ? req.session.userName[0].toUpperCase() : "U",
  isPOS: active === "pos", isPOSHistory: active === "history",
  isAdmin: req.session.userRole === "admin",
  isCashierOrAdmin: ["admin","cashier"].includes(req.session.userRole),
});

const genReceiptNo = () => {
  const d = new Date().toISOString().slice(0,10).replace(/-/g,"");
  return `REC-${d}-${Math.floor(Math.random()*9000)+1000}`;
};

export const posPage = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  if (!["admin","cashier"].includes(req.session.userRole)) return res.redirect("/dashboard");
  try {
    const products = await Product.findAll({
      where: { isActive: true },
      include: [{ model: Category, as: "category" }],
      order: [["name","ASC"]],
    });
    const productData = products.map(p => ({
      id: p.id, name: p.name, price: parseFloat(p.price),
      stock: p.stockQty, category: p.category?.name || "Uncategorized",
    }));
    res.render("pos", {
      ...base(req, "pos"), title: "POS Terminal", pageTitle: "POS Terminal",
      productsJson: JSON.stringify(productData),
    });
  } catch (err) { res.send("Error loading POS: " + err.message); }
};

export const processTransaction = async (req, res) => {
  try {
    const { items, paymentMethod, amountPaid, discount } = req.body;
    const parsedItems = JSON.parse(items);
    let subtotal = 0;
    for (const item of parsedItems) {
      const product = await Product.findByPk(item.productId);
      if (!product || product.stockQty < item.quantity)
        return res.json({ success: false, message: `Insufficient stock for ${product?.name || "product"}` });
      subtotal += parseFloat(product.price) * item.quantity;
    }
    const discountAmt = parseFloat(discount) || 0;
    const total = Math.max(0, subtotal - discountAmt);
    const paid = parseFloat(amountPaid);
    if (paid < total) return res.json({ success: false, message: "Amount paid is less than total." });
    const receiptNo = genReceiptNo();
    const transaction = await POSTransaction.create({
      cashierId: req.session.userId, totalAmount: total, discount: discountAmt,
      amountPaid: paid, change: paid - total, paymentMethod: paymentMethod||"cash",
      receiptNo, status: "COMPLETED",
    });
    for (const item of parsedItems) {
      const product = await Product.findByPk(item.productId);
      await POSItem.create({ transactionId: transaction.id, productId: item.productId, quantity: item.quantity, unitPrice: product.price });
      await Product.decrement("stockQty", { by: item.quantity, where: { id: item.productId } });
    }
    await AccountingEntry.create({
      referenceId: transaction.id, referenceType: "POS",
      amount: total, entryType: "CREDIT",
      description: `POS Transaction ${receiptNo}`,
      entryDate: new Date().toISOString().split("T")[0],
    });
    res.json({ success: true, transactionId: transaction.id, receiptNo, total: total.toFixed(2), change: (paid-total).toFixed(2) });
  } catch (err) { res.json({ success: false, message: err.message }); }
};

export const voidTransaction = async (req, res) => {
  try {
    const txn = await POSTransaction.findByPk(req.params.id);
    if (!txn || txn.status === "VOIDED") return res.redirect("/pos/history");
    await txn.update({ status: "VOIDED" });
    res.redirect("/pos/history");
  } catch (err) { res.send("Error: " + err.message); }
};

export const posHistory = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  try {
    const transactions = await POSTransaction.findAll({ order: [["createdAt","DESC"]], limit: 100 });
    const rows = transactions.map(t => `<tr class="border-b hover:bg-gray-50">
      <td class="p-3">${t.receiptNo}</td>
      <td class="p-3">₱${parseFloat(t.totalAmount).toFixed(2)}</td>
      <td class="p-3">₱${parseFloat(t.discount).toFixed(2)}</td>
      <td class="p-3">${t.paymentMethod}</td>
      <td class="p-3">₱${parseFloat(t.amountPaid).toFixed(2)}</td>
      <td class="p-3">₱${parseFloat(t.change).toFixed(2)}</td>
      <td class="p-3"><span class="badge ${t.status==="COMPLETED"?"badge-success":"badge-danger"}">${t.status}</span></td>
      <td class="p-3">${new Date(t.createdAt).toLocaleDateString()}</td>
      <td class="p-3">${t.status==="COMPLETED" ? `<a href="/pos/void/${t.id}" class="text-red-500 hover:underline text-xs" onclick="return confirm('Void this transaction?')">Void</a>` : "—"}</td>
    </tr>`).join("") || `<tr><td colspan="9" class="p-4 text-center text-gray-400 text-sm">No transactions yet.</td></tr>`;
    res.render("pos-history", { ...base(req, "history"), title: "POS History", pageTitle: "POS History", rows });
  } catch (err) { res.send("Error: " + err.message); }
};
