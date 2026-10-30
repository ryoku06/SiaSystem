import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";

const base = (req) => ({
  userName: req.session.userName, userRole: req.session.userRole,
  userInitial: req.session.userName ? req.session.userName[0].toUpperCase() : "U",
  isProducts: true,
  isAdmin: req.session.userRole === "admin",
  isCashierOrAdmin: ["admin","cashier"].includes(req.session.userRole),
});

export const productList = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  try {
    const products = await Product.findAll({ include: [{ model: Category, as: "category" }], order: [["createdAt","DESC"]] });
    const categories = await Category.findAll();
    const rows = products.map(p => `<tr class="border-b hover:bg-gray-50">
      <td class="p-3">${p.id}</td>
      <td class="p-3 font-semibold">${p.name}</td>
      <td class="p-3">${p.category?.name || "—"}</td>
      <td class="p-3">₱${parseFloat(p.price).toFixed(2)}</td>
      <td class="p-3">${p.stockQty}</td>
      <td class="p-3"><span class="badge ${p.isActive ? "badge-success":"badge-danger"}">${p.isActive ? "Active":"Inactive"}</span></td>
      <td class="p-3">
        <a href="/products/edit/${p.id}" class="text-blue-500 hover:underline text-xs mr-2">Edit</a>
        <a href="/products/delete/${p.id}" class="text-red-500 hover:underline text-xs" onclick="return confirm('Delete this product?')">Delete</a>
      </td>
    </tr>`).join("") || `<tr><td colspan="7" class="p-4 text-center text-gray-400 text-sm">No products found.</td></tr>`;
    const catOptions = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
    res.render("products", { ...base(req), title: "Products", pageTitle: "Products", rows, catOptions });
  } catch (err) { res.send("Error: " + err.message); }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, stockQty, categoryId } = req.body;
    await Product.create({ name, description, price, stockQty: stockQty||0, categoryId: categoryId||null });
    res.redirect("/products");
  } catch (err) { res.send("Error: " + err.message); }
};

export const editProductPage = async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.redirect("/products");
    const categories = await Category.findAll();
    const catOptions = categories.map(c => `<option value="${c.id}" ${c.id===product.categoryId?"selected":""}>${c.name}</option>`).join("");
    res.render("product-edit", {
      ...base(req), title: "Edit Product", pageTitle: "Edit Product",
      productId: product.id, productName: product.name,
      productPrice: product.price, productStock: product.stockQty,
      productDesc: product.description || "",
      isActiveChecked: product.isActive ? "checked" : "",
      catOptions,
    });
  } catch (err) { res.send("Error: " + err.message); }
};

export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, stockQty, categoryId, isActive } = req.body;
    await Product.update({ name, description, price, stockQty: stockQty||0, categoryId: categoryId||null, isActive: isActive==="on" }, { where: { id: req.params.id } });
    res.redirect("/products");
  } catch (err) { res.send("Error: " + err.message); }
};

export const deleteProduct = async (req, res) => {
  try {
    await Product.destroy({ where: { id: req.params.id } });
    res.redirect("/products");
  } catch (err) { res.send("Error: " + err.message); }
};
